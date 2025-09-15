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
            const itemKey = `${item.description}|${item.rValue || ''}|${item.colorHint || ''}|${item.isSupplyOnly || false}`;
            if (combinedLineItems.has(itemKey)) {
                const existing = combinedLineItems.get(itemKey);
                existing.quantity += item.quantity;
                existing.notes = [...new Set([...existing.notes, ...item.notes])];
            } else {
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
                    finalNotes.push('ISOMAX 300');
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
                item.notes = []; 
                itemsByRValue.get(item.rValue).push(item);
            });

            processedLineItems = [];
            for (const [rValue, items] of itemsByRValue.entries()) {
                if (notesByRValue.has(rValue)) {
                    const allNotes = Array.from(notesByRValue.get(rValue));
                    // Attach all notes to the last item in the group
                    if (items.length > 0) {
                        items[items.length - 1].notes.push(...allNotes);
                    }
                }
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
                    item.notes.push(`${units} ${matchingMaterial.unit || 'units'}`);
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
