/**
 * Aggregates a worksheet by combining groups and line items based on specific business rules.
 * This function processes raw parsed data to:
 * 1. Aggregate groups by location and category (e.g., 'U1-8, Basement – Soffit panels').
 * 2. Sum quantities of identical line items.
 * 3. For panel-type items ('Rigid Wall/Soffit'), group notes for items with the same R-Value.
 * 4. For panel-type items, look up matching materials to transform generic notes into specific product details.
 * 5. For 'Supply Only' items, calculate the required number of units (e.g., rolls) based on coverage.
 *
 * @param {object} rawWorksheetData - The raw worksheet object from the parser.
 * @param {Array} materials - The master list of material objects, used for lookups.
 * @returns {object} A new, aggregated worksheet object.
 */

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


export const aggregateWorksheet = (rawWorksheetData, materials) => {
    if (!rawWorksheetData || !rawWorksheetData.groups) {
        return { groups: [] };
    }

    const aggregatedGroups = new Map();

    // --- Step 1: Group raw line items by a composite key ---
    rawWorksheetData.groups.forEach(group => {
        const key = group.category === 'Rigid Wall/Soffit'
            ? `${group.location}|${group.category}|${group.itemType}`
            : `${group.location}|${group.category}`;

        if (!aggregatedGroups.has(key)) {
            aggregatedGroups.set(key, {
                unitNumbers: new Set(),
                lineItems: [],
                sourceGroupIds: new Set(),
                originalGroup: group,
            });
        }
        const aggGroup = aggregatedGroups.get(key);
        if (group.unitNumber) {
            aggGroup.unitNumbers.add(group.unitNumber);
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
            const itemKey = `${item.description}|${item.rValue || ''}|${item.colorHint || ''}`;
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
        if (originalGroup.category === 'Rigid Wall/Soffit') {
            const notesByRValue = new Map();

            processedLineItems.forEach(item => {
                const isSoffit = originalGroup.itemType?.toLowerCase().includes('soffit');
                const isWallRigid = originalGroup.itemType?.toLowerCase().includes('wall panel');

                const matchingMaterial = materials.find(m => {
                    if (m.rValue !== item.rValue) return false;
                    if (isSoffit) return m.materialName.includes('K10');
                    if (isWallRigid) return m.materialName.includes('K12');
                    return (m.category === 'Rigid Wall/Soffit' || m.category === 'XPS');
                });

                let finalNotes = item.notes || [];
                if (matchingMaterial) {
                    const materialNote = `${matchingMaterial.thickness || ''}mm ${matchingMaterial.brand || ''} ${matchingMaterial.materialName || ''} (${matchingMaterial.length || ''}x${matchingMaterial.width || ''}mm)`.trim();
                    finalNotes = finalNotes.map(note => note.includes('__mm') ? materialNote : note);
                    if (!finalNotes.includes(materialNote) && !item.notes.some(n => n.includes('__mm'))) {
                        finalNotes.unshift(materialNote);
                    }
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
                processedLineItems.push(...items);
                if (notesByRValue.has(rValue)) {
                    processedLineItems.push({
                        id: `notes-${rValue}`,
                        isNoteGroup: true,
                        notes: Array.from(notesByRValue.get(rValue)),
                    });
                }
            }
        }

        // --- Step 2c: Custom sorting for Bulk Insulation ---
        if (originalGroup.category === 'Bulk Insulation') {
            processedLineItems.sort(sortBulkInsulation);
        }

        // --- Step 2d: Special processing for "Supply Only" items (roll calculation) ---
        processedLineItems.forEach(item => {
            if (item.category === 'Supply Only' || (item.notes && item.notes.some(n => n.toLowerCase().includes('supply only')))) {
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

        // --- Step 2e: Construct the final aggregated group ---
        const sortedUnits = Array.from(unitNumbers).sort((a, b) => a - b);
        let unitPrefix = '';
        if (sortedUnits.length > 1) {
            unitPrefix = `U${sortedUnits[0]}-${sortedUnits[sortedUnits.length - 1]}, `;
        } else if (sortedUnits.length === 1) {
            unitPrefix = `U${sortedUnits[0]}, `;
        }

        let groupName = `${unitPrefix}${originalGroup.location} – ${originalGroup.itemType || originalGroup.category}`;
        if (originalGroup.category === 'Supply Only') {
            groupName = 'Supply Only';
        }

        finalGroups.push({
            id: `agg-${originalGroup.id}`,
            groupName: groupName,
            lineItems: processedLineItems,
            sourceGroupIds: Array.from(sourceGroupIds),
        });
    }

    return { ...rawWorksheetData, groups: finalGroups };
};
