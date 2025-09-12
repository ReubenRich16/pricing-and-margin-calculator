// src/utils/aggregation.js

/**
 * Aggregates line items within a worksheet and combines group headers.
 * This function processes raw parsed worksheet data to:
 * 1. Combine line items with identical description, R-value, color hint, and category by summing their quantities and merging notes.
 * 2. Aggregate group headers that follow a 'U[number], [rest of name]' pattern into 'U[min]-[max], [rest of name]'.
 *
 * @param {object} rawWorksheetData - The raw worksheet object parsed from text.
 * @returns {object} A new worksheet object with aggregated groups and line items.
 */
export const aggregateWorksheet = (rawWorksheetData) => {
  console.log("aggregateWorksheet: rawWorksheetData received:", JSON.stringify(rawWorksheetData, null, 2)); // DEBUG

  if (!rawWorksheetData || !rawWorksheetData.groups) {
    console.log("aggregateWorksheet: Invalid rawWorksheetData, returning empty groups."); // DEBUG
    return { groups: [] };
  }

  // Map to store aggregated group data, keyed by the 'location|category|itemType'
  // Value: { unitNumbers: Set<number>, lineItems: Map<string, AggregatedLineItem>, sourceGroupIds: Set<string>, originalItemType: string }
  const aggregatedGroupData = new Map();

  // Regex to extract unit number and location from group headers like 'U1, Basement - Soffit panels'
  const unitRegex = /^U(\d+),\s*(.+?)(?:\s*–\s*(.+))?$/i; // Keep this regex for parsing original group names

  rawWorksheetData.groups.forEach(group => {
    console.log("Processing group:", group.groupName); // DEBUG
    const groupNameMatch = group.groupName.match(unitRegex);
    let unitNumber = null;
    let location = group.location || group.groupName.trim(); // Use group.location from PasteParser
    let itemType = group.itemType || null; // Use group.itemType from PasteParser
    let category = group.category || 'Other'; // Use the category already parsed by PasteParser

    if (groupNameMatch) { // Corrected: was groupMatch
      unitNumber = parseInt(groupNameMatch[1], 10);
      // location, itemType, category are already set from group object
    }

    // Use a combination of location, category, and itemType as the key for aggregatedGroupData
    // This ensures unique aggregation for each specific type of item within a location
    const aggKey = `${location}|${category}|${itemType || ''}`;

    // Ensure a data structure exists for this aggregation key
    if (!aggregatedGroupData.has(aggKey)) {
      aggregatedGroupData.set(aggKey, {
        unitNumbers: new Set(),
        lineItems: new Map(),
        sourceGroupIds: new Set(),
        originalItemType: itemType, // Store the original itemType for group name construction
      });
    }
    const currentAggGroup = aggregatedGroupData.get(aggKey);

    if (unitNumber !== null) {
      currentAggGroup.unitNumbers.add(unitNumber);
    }
    currentAggGroup.sourceGroupIds.add(group.id); // Add the raw group's ID

    group.lineItems.forEach(lineItem => {
      // Aggregation key for line items remains: description|rValue|colorHint|category
      const key = `${lineItem.description}|${lineItem.rValue || ''}|${lineItem.colorHint || ''}|${lineItem.category || ''}`;
      console.log(`    Processing line item: ${lineItem.description}, Key: ${key}`); // DEBUG

      // Use the lineItems map on the current aggregated group
      if (currentAggGroup.lineItems.has(key)) {
        const existingItem = currentAggGroup.lineItems.get(key);
        existingItem.quantity += lineItem.quantity;
        existingItem.notes = Array.from(new Set([...existingItem.notes, ...lineItem.notes]));
        console.log(`      Aggregated existing item. New quantity: ${existingItem.quantity}`); // DEBUG
      } else {
        // Important: create a copy of the line item before adding it to the map
        currentAggGroup.lineItems.set(key, { ...lineItem, notes: [...lineItem.notes] });
        console.log(`      Added new item to group aggregation.`); // DEBUG
      }
    });
  });

  const newGroups = [];

  // Create new aggregated groups
  aggregatedGroupData.forEach((data, aggKey) => {
    // Reconstruct the group name based on aggregated units, location, and original item type
    let newGroupName = '';
    const [location, category, originalItemType] = aggKey.split('|');

    // Add unit numbers to the group name
    if (data.unitNumbers.size > 0) {
      const sortedUnits = Array.from(data.unitNumbers).sort((a, b) => a - b);
      if (sortedUnits.length === 1) {
        newGroupName = `U${sortedUnits[0]}, `;
      } else {
        newGroupName = `U${sortedUnits[0]}-${sortedUnits[sortedUnits.length - 1]}, `;
      }
    }

    newGroupName += `${location}`; // Add the location (e.g., Basement to Second Floor)

    if (originalItemType && originalItemType !== 'null') { // Add itemType if it exists
        newGroupName += ` – ${originalItemType}`;
    } else {
        // Fallback if itemType was not parsed, use category
        newGroupName += ` – ${category}`;
    }


    console.log(`Creating new group: ${newGroupName}`); // DEBUG
    newGroups.push({
      id: `g-agg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      groupName: newGroupName,
      lineItems: Array.from(data.lineItems.values()),
      labourItems: [],
      sourceGroupIds: Array.from(data.sourceGroupIds),
    });
  });

  console.log("aggregateWorksheet: Final newGroups:", JSON.stringify(newGroups, null, 2)); // DEBUG
  return {
    ...rawWorksheetData,
    groups: newGroups,
  };
};