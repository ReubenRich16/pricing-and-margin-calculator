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
    const match = groupName.match(/^U(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

export const aggregateWorksheet = (rawWorksheetData, materials) => {
    if (!rawWorksheetData || !rawWorksheetData.groups) {
        return { groups: [] };
    }

    const aggregatedGroups = new Map();

    // --- Step 1: Group raw line items by a composite key ---
    rawWorksheetData.groups.forEach(group => {
        const unitNumber = parseUnitNumber(group.groupName);
        const key = unitNumber ? `${group.location}|${group.itemType}` : group.groupName;

        if (!aggregatedGroups.has(key)) {
            aggregatedGroups.set(key, {
                unitNumbers: new Set(),
                lineItems: [],
                sourceGroupIds: new Set(),
                originalGroup: group,
            });
        }
        const aggGroup = aggregatedGroups.get(key);
        if (unitNumber) {
            aggGroup.unitNumbers.add(unitNumber);
        }
        aggGroup.sourceGroupIds.add(group.id);
        aggGroup.lineItems.push(...group.lineItems);
    });

    const finalGroups = [];

    // --- Step 2: Process each aggregated group ---
    for (const [key, groupData] of aggregatedGroups.entries()) {
        const { unitNumbers, lineItems, sourceGroupIds, originalGroup } = groupData;

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
                    // Legacy note, maybe removable if parser extracts dimensions
                    // finalNotes.push('ISOMAX 300'); 
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
                // We keep notes on individual items now, but maybe we want to consolidate specific notes?
                // The previous logic cleared notes and aggregated them at the end. 
                // Given strict note preservation, we should be careful about clearing notes.
                // However, for XPS/Rigid, the requirement seems to be about summarizing materials.
                // I will retain individual notes to be safe, but still apply the R-value grouping if strict aggregation is ON.
                
                // For now, let's NOT clear the notes to preserve "Strict Note Preservation".
                // item.notes = [];  <-- Removed this line
                
                itemsByRValue.get(item.rValue).push(item);
            });

            // Re-flatten
            processedLineItems = [];
            for (const [rValue, items] of itemsByRValue.entries()) {
                // If we want to append aggregated notes, we can, but let's avoid duplicating specific line notes.
                // The original code aggregated ALL notes to the last item.
                // Let's keep items distinct.
                processedLineItems.push(...items);
            }
        }

        // --- Step 2c: Custom sorting for Bulk Insulation ---
        if (originalGroup.category === 'Bulk Insulation') {
            processedLineItems.sort(sortBulkInsulation);
        }

        // --- Step 2d: Consolidate damp course notes ---
        // (Legacy logic kept but likely won't trigger if Parser creates Line Items)
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
        // Only add calculation note if not already present (avoid duplicates on re-aggregation)
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
        const sortedUnits = Array.from(unitNumbers).sort((a, b) => a - b);
        let unitPrefix = '';
        if (sortedUnits.length > 1) {
            unitPrefix = `U${sortedUnits[0]}-${sortedUnits[sortedUnits.length - 1]}, `;
        } else if (sortedUnits.length === 1) {
            unitPrefix = `U${sortedUnits[0]}, `;
        }

        const groupName = unitPrefix ? `${unitPrefix}${originalGroup.location}${originalGroup.itemType ? ` – ${originalGroup.itemType}` : ''}` : originalGroup.groupName;

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
