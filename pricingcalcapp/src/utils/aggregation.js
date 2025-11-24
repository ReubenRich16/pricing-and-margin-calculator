/**
 * Aggregates a worksheet by combining groups and line items based on specific business rules.
 */
import { nanoid } from 'nanoid';

// --- SORTING LOGIC ---
const bulkInsulationSortOrder = [
    "CEILING", "SUSPENDED",
    "BOX GUTTER",
    "EXTERNAL WALL", "BOUNDARY",
    "ADJOINING WALL", "PARTY WALL",
    "GARAGE TO HOUSE",
    "INTERNAL WALL",
    "BETWEEN FLOOR", "CANTILEVER"
];

const getSortIndex = (description) => {
    const upperDesc = description.toUpperCase();
    for (let i = 0; i < bulkInsulationSortOrder.length; i++) {
        if (upperDesc.includes(bulkInsulationSortOrder[i])) {
            return i;
        }
    }
    return bulkInsulationSortOrder.length; // Default to last if no match
};

const sortBulkInsulation = (a, b) => {
    const indexA = getSortIndex(a.description);
    const indexB = getSortIndex(b.description);

    if (indexA !== indexB) {
        return indexA - indexB;
    }

    // Secondary sort by R-Value (highest to lowest)
    const rValueA = parseFloat(a.rValue?.replace('R', '')) || 0;
    const rValueB = parseFloat(b.rValue?.replace('R', '')) || 0;
    return rValueB - rValueA;
};

const parseUnitNumber = (groupName) => {
    // Note: With unitIdentifier now available, this helper might be less critical for UNIT mode
    // but still useful for sorting unit ranges in LEVEL/BLOCK mode.
    // Try to extract first number.
    const match = groupName.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

export const aggregateWorksheet = (rawWorksheetData, materials, groupingMode = 'UNIT') => {
    if (!rawWorksheetData || !rawWorksheetData.groups) {
        return { groups: [] };
    }

    const aggregatedGroups = new Map();

    // --- Step 1: Group raw line items by a composite key ---
    rawWorksheetData.groups.forEach(group => {
        // Try to use the parser's unitIdentifier if available, otherwise fallback to parsing name
        const unitIdentifier = group.unitIdentifier;
        const unitNumber = parseUnitNumber(unitIdentifier || group.groupName);
        
        let key;

        if (groupingMode === 'UNIT') {
            // Group by Unit + Location + ItemType
            // Use unitIdentifier if available, else groupName (fallback)
            const unitKey = unitIdentifier || group.groupName;
            key = `${unitKey}|${group.location}|${group.itemType}`;
        } else if (groupingMode === 'BLOCK') {
            // Group by Block + Location + ItemType
            const blockKey = group.block || "Ungrouped";
            key = `${blockKey}|${group.location}|${group.itemType}`;
        } else {
            // LEVEL Mode (Default fallback logic if not UNIT/BLOCK)
            // Group by Location + ItemType only (merges across units/blocks)
            key = `${group.location}|${group.itemType}`;
        }

        if (!aggregatedGroups.has(key)) {
            aggregatedGroups.set(key, {
                unitIdentifiers: new Set(), // Store identifiers like "U1", "TH1A-1"
                lineItems: [],
                sourceGroupIds: new Set(),
                originalGroup: group,
            });
        }
        const aggGroup = aggregatedGroups.get(key);
        
        if (unitIdentifier) {
            aggGroup.unitIdentifiers.add(unitIdentifier);
        } else if (unitNumber) {
            aggGroup.unitIdentifiers.add(`U${unitNumber}`); // Fallback
        }

        aggGroup.sourceGroupIds.add(group.id);
        aggGroup.lineItems.push(...group.lineItems);
    });

    const finalGroups = [];

    // --- Step 2: Process each aggregated group ---
    for (const [key, groupData] of aggregatedGroups.entries()) {
        const { unitIdentifiers, lineItems, sourceGroupIds, originalGroup } = groupData;

        // --- Step 2a: Combine identical line items by summing quantities ---
        const combinedLineItems = new Map();
        lineItems.forEach(item => {
            // Composite key including new fields to prevent incorrect merging
            const itemKey = `${item.description}|${item.rValue || ''}|${item.colorHint || ''}|${item.isSupplyOnly || false}|${item.thickness || ''}|${item.dimensions || ''}|${item.productUnit || ''}`;
            
            if (combinedLineItems.has(itemKey)) {
                const existing = combinedLineItems.get(itemKey);
                
                // Sum Quantities
                existing.quantity += item.quantity;
                
                // Sum Product Counts (if both exist)
                if (existing.productCount && item.productCount) {
                    existing.productCount += item.productCount;
                } else if (item.productCount) {
                    existing.productCount = item.productCount; // Should technically not happen if key matches
                }

                // Merge Notes (Deduplicate)
                existing.notes = [...new Set([...existing.notes, ...item.notes])];
            } else {
                // Clone item to avoid mutating original reference
                combinedLineItems.set(itemKey, { ...item });
            }
        });

        let processedLineItems = Array.from(combinedLineItems.values());

        // --- Step 2b: Special processing for panel items (note grouping and material lookup) ---
        const category = processedLineItems[0]?.category || originalGroup.category;
        if (category === 'Rigid Wall/Soffit' || category === 'XPS') {
            const notesByRValue = new Map();

            processedLineItems.forEach(item => {
                const itemCategory = item.category || originalGroup.category;
                const isSoffit = originalGroup.itemType?.toLowerCase().includes('soffit');
                const isWallRigid = originalGroup.itemType?.toLowerCase().includes('wall panel');

                const matchingMaterial = materials.find(m => {
                    if (m.rValue !== item.rValue) return false;
                    if (isSoffit) return m.materialName.includes('K10');
                    if (isWallRigid) return m.materialName.includes('K12');
                    return (m.category === itemCategory);
                });

                let finalNotes = item.notes ? [...item.notes] : [];
                if (matchingMaterial) {
                    const materialNote = `${matchingMaterial.thickness || ''}mm ${matchingMaterial.brand || ''} ${matchingMaterial.materialName || ''} (${matchingMaterial.length || ''}x${matchingMaterial.width || ''}mm)`.trim();
                    const mmNoteIndex = finalNotes.findIndex(note => note.includes('__mm'));
                    if (mmNoteIndex !== -1) {
                        finalNotes[mmNoteIndex] = materialNote;
                    } else {
                        finalNotes.unshift(materialNote);
                    }
                } else if (itemCategory === 'XPS') {
                    // Legacy note
                }
                
                if (!notesByRValue.has(item.rValue)) {
                    notesByRValue.set(item.rValue, new Set());
                }
                finalNotes.forEach(note => notesByRValue.get(item.rValue).add(note));
            });
            
            const itemsByRValue = new Map();
            processedLineItems.forEach(item => {
                if (!itemsByRValue.has(item.rValue)) {
                    itemsByRValue.set(item.rValue, []);
                }
                itemsByRValue.get(item.rValue).push(item);
            });

            // Re-flatten
            processedLineItems = [];
            for (const [rValue, items] of itemsByRValue.entries()) {
                processedLineItems.push(...items);
            }
        }

        // --- Step 2c: Custom sorting for Bulk Insulation ---
        if (originalGroup.category === 'Bulk Insulation') {
            processedLineItems.sort(sortBulkInsulation);
        }

        // --- Step 2d: Consolidate damp course notes ---
        processedLineItems.forEach(item => {
            const dampCourseNotes = item.notes.filter(note => note.toLowerCase().includes('damp course'));
            if (dampCourseNotes.length > 1) {
                const totalLength = dampCourseNotes.reduce((sum, note) => {
                    const match = note.match(/\((\d+)LM\)/i);
                    return sum + (match ? parseInt(match[1], 10) : 0);
                }, 0);

                const otherNotes = item.notes.filter(note => !note.toLowerCase().includes('damp course'));
                item.notes = [...otherNotes, `Includes damp course – 300MM (${totalLength}LM)`];
            }
        });

        // --- Step 2e: Special processing for "Supply Only" items (roll calculation) ---
        processedLineItems.forEach(item => {
            if (item.isSupplyOnly) {
                const matchingMaterial = materials.find(m => {
                    const materialName = m.materialName.toLowerCase();
                    const description = item.description.toLowerCase();
                    return description.includes(materialName) || materialName.includes(description);
                });

                if (matchingMaterial && matchingMaterial.coverage > 0) {
                    const units = Math.ceil(item.quantity / matchingMaterial.coverage);
                    const unitNote = `${units} ${matchingMaterial.unit || 'units'}`;
                    if (!item.notes.includes(unitNote)) {
                        item.notes.push(unitNote);
                    }
                }
            }
        });

        // --- Step 2f: Construct the final aggregated group ---
        
        // Prefix Generation
        let prefix = '';
        if (groupingMode === 'BLOCK' && originalGroup.block) {
            // If grouping by block, use the block name as prefix
            // But we also want to list units if they differ? 
            // "Block 1: Ground Floor..."
            // Or "Block 1: TH1A-1 - TH1A-7, Ground Floor..." ?
            // Usually Block header already contains unit range "Block 1: TH1A-1 - TH1A-7".
            // Let's prepend Block if it exists.
            
            // If originalGroup.block is "Block 1: TH1A-1...", we can use that.
            // But we merged multiple groups. All should have same block.
            // We might want to show unit range if it's a subset?
            // Let's just use the block string.
            prefix = `${originalGroup.block}: `;
            
        } else if (unitIdentifiers.size > 0) {
            // UNIT or LEVEL mode: List units
            // Sort them naturally (alphanumeric)
            const sortedUnits = Array.from(unitIdentifiers).sort((a, b) => {
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            });

            if (sortedUnits.length > 1) {
                // Try to compress range if simple numbers? 
                // For now, just First-Last if > 1
                prefix = `${sortedUnits[0]} - ${sortedUnits[sortedUnits.length - 1]}, `;
            } else if (sortedUnits.length === 1) {
                prefix = `${sortedUnits[0]}, `;
            }
        }

        // Construct Final Name
        // Remove Block from originalGroup.groupName if we are prepending it?
        // originalGroup.groupName usually has "Unit, Location - Type".
        // If we are constructing from scratch:
        const baseName = `${originalGroup.location}${originalGroup.itemType ? ` – ${originalGroup.itemType}` : ''}`;
        
        const groupName = `${prefix}${baseName}`;

        if (processedLineItems.length > 0) {
            finalGroups.push({
                id: `agg-${nanoid()}`,
                groupName: groupName,
                lineItems: processedLineItems,
                sourceGroupIds: Array.from(sourceGroupIds),
            });
        }
    }

    return { ...rawWorksheetData, groups: finalGroups };
};
