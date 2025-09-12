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
export const aggregateWorksheet = (rawWorksheetData, materials) => {
    if (!rawWorksheetData || !rawWorksheetData.groups) {
        return { groups: [] };
    }

    const aggregatedGroups = new Map();

    // --- Step 1: Group raw line items by a composite key ---
    rawWorksheetData.groups.forEach(group => {
        const key = `${group.location}|${group.category}`;
        if (!aggregatedGroups.has(key)) {
            aggregatedGroups.set(key, {
                unitNumbers: new Set(),
                lineItems: [],
                originalGroup: group, // Keep a reference to the first group of this type
            });
        }
        const aggGroup = aggregatedGroups.get(key);
        if (group.unitNumber) {
            aggGroup.unitNumbers.add(group.unitNumber);
        }
        aggGroup.lineItems.push(...group.lineItems);
    });

    const finalGroups = [];

    // --- Step 2: Process each aggregated group ---
    for (const [key, groupData] of aggregatedGroups.entries()) {
        const { unitNumbers, lineItems, originalGroup } = groupData;

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
            const itemsWithoutNotes = [];

            // First, find a matching material to generate the note
            processedLineItems.forEach(item => {
                const matchingMaterial = materials.find(m =>
                    m.rValue === item.rValue &&
                    (m.category === 'Rigid Wall/Soffit' || m.category === 'XPS')
                );

                if (matchingMaterial) {
                    const materialNote = `${matchingMaterial.thickness || ''}mm ${matchingMaterial.brand || ''} ${matchingMaterial.materialName || ''} (${matchingMaterial.length || ''}x${matchingMaterial.width || ''}mm)`.trim();
                    if (!notesByRValue.has(item.rValue)) {
                        notesByRValue.set(item.rValue, [materialNote]);
                    }
                }
                // Keep all original notes as well
                if (item.notes && item.notes.length > 0) {
                    const existingNotes = notesByRValue.get(item.rValue) || [];
                    notesByRValue.set(item.rValue, [...new Set([...existingNotes, ...item.notes])]);
                }
            });
            
            // Group items by R-Value and attach the relevant notes
            const itemsByRValue = new Map();
            processedLineItems.forEach(item => {
                if (!itemsByRValue.has(item.rValue)) {
                    itemsByRValue.set(item.rValue, []);
                }
                // Clear individual notes as they will be grouped
                item.notes = []; 
                itemsByRValue.get(item.rValue).push(item);
            });

            processedLineItems = [];
            for (const [rValue, items] of itemsByRValue.entries()) {
                // Add the items back
                processedLineItems.push(...items);
                // Add a "notes" pseudo-item to display the grouped notes
                if (notesByRValue.has(rValue)) {
                    processedLineItems.push({
                        id: `notes-${rValue}`,
                        isNoteGroup: true,
                        notes: notesByRValue.get(rValue),
                    });
                }
            }
        }

        // --- Step 2c: Special processing for "Supply Only" items (roll calculation) ---
        processedLineItems.forEach(item => {
            if (item.category === 'Supply Only' || (item.notes && item.notes.some(n => n.toLowerCase().includes('supply only')))) {
                const matchingMaterial = materials.find(m => {
                    const materialName = m.materialName.toLowerCase();
                    const description = item.description.toLowerCase();
                    // Simple name matching, can be improved
                    return description.includes(materialName) || materialName.includes(description);
                });

                if (matchingMaterial && matchingMaterial.coverage > 0) {
                    const units = Math.ceil(item.quantity / matchingMaterial.coverage);
                    item.notes.push(`${units} ${matchingMaterial.unit || 'units'}`);
                }
            }
        });

        // --- Step 2d: Construct the final aggregated group ---
        const sortedUnits = Array.from(unitNumbers).sort((a, b) => a - b);
        let unitPrefix = '';
        if (sortedUnits.length > 1) {
            unitPrefix = `U${sortedUnits[0]}-${sortedUnits[sortedUnits.length - 1]}, `;
        } else if (sortedUnits.length === 1) {
            unitPrefix = `U${sortedUnits[0]}, `;
        }

        finalGroups.push({
            id: `agg-${originalGroup.id}`,
            groupName: `${unitPrefix}${originalGroup.location} – ${originalGroup.itemType || originalGroup.category}`,
            lineItems: processedLineItems,
        });
    }

    return { ...rawWorksheetData, groups: finalGroups };
};
