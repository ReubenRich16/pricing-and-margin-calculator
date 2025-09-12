# Implementation Plan

[Overview]
This plan outlines a comprehensive refactor of the parsing and aggregation engine to correctly process complex, multi-block quote documents, ensuring accurate data extraction, aggregation, and presentation according to specific business rules.

The current implementation fails to correctly parse several complex line item formats, leading to data inaccuracies. The aggregation logic also has several flaws: it incorrectly groups dissimilar items, fails to handle "Supply Only" cases correctly, and does not apply custom sorting rules. This refactor will address these shortcomings by introducing more robust parsing, a more intelligent aggregation engine, and refined display logic, resulting in a reliable and accurate quoting tool.

[Types]
No new global types or interfaces will be introduced; however, the internal structure of the `lineItem` and `group` objects will be more consistently enforced.

- **`lineItem` object:**
  - `id`: `string` (unique identifier)
  - `originalText`: `string` (the raw text of the line)
  - `description`: `string`
  - `colorHint`: `string | null`
  - `rValue`: `string | null`
  - `quantity`: `number`
  - `unit`: `string`
  - `notes`: `string[]`
  - `category`: `string`
  - `isSupplyOnly`: `boolean` (new flag)

- **`group` object:**
  - `id`: `string` (unique identifier)
  - `groupName`: `string`
  - `unitNumber`: `number | null`
  - `location`: `string`
  - `itemType`: `string | null`
  - `category`: `string`
  - `lineItems`: `lineItem[]`
  - `sourceGroupIds`: `string[]`

[Files]
This implementation will modify three key files to overhaul the parsing, aggregation, and display logic.

- **`src/components/quote/PasteParser.js` (Modified):**
  - The category mapping will be updated to correctly classify "Wall panel insulation".
  - A new, more flexible regex will be added to correctly parse XPS supply-only panels.
  - The logic for handling Damp Course will be modified to add it as a note to its parent item instead of creating a separate line item.

- **`src/utils/aggregation.js` (Modified):**
  - The aggregation key will be made more specific to prevent incorrect grouping of dissimilar items.
  - The logic for handling "Supply Only" items will be improved to prevent "undefined" group names and to correctly merge notes.
  - A custom sorting mechanism for "Bulk Insulation" items will be introduced.
  - The material lookup logic will be enhanced to handle default cases and specific overrides.

- **`src/components/quote/PasteParserReview.js` (Modified):**
  - The rendering logic will be updated to ensure notes are always visible in both raw and aggregated views.
  - The line item display order will be corrected to match the required format.

[Functions]
This implementation will modify several functions and introduce new helper functions to improve the parsing and aggregation logic.

- **New Functions:**
  - `getSortIndex(description)` in `src/utils/aggregation.js`: A helper function to determine the sort order of "Bulk Insulation" items.
  - `sortBulkInsulation(a, b)` in `src/utils/aggregation.js`: The main sorting function for "Bulk Insulation" items.

- **Modified Functions:**
  - `mapItemTypeToCategory(itemType)` in `src/components/quote/PasteParser.js`: Will be updated to correctly classify "Wall panel insulation".
  - `parseXpsPanel(line)` in `src/components/quote/PasteParser.js`: Will be updated to use a more flexible regex and correctly extract data.
  - `parseLineItem(line, currentGroup)` in `src/components/quote/PasteParser.js`: Will be modified to handle Damp Course as a note.
  - `aggregateWorksheet(rawWorksheetData, materials)` in `src/utils/aggregation.js`: Will be completely overhauled to implement the new aggregation and business logic.
  - `GroupCard({ group, isAggregatedView, onGroupToggle })` in `src/components/quote/PasteParserReview.js`: Will be updated to correctly render notes and line item data.

[Classes]
No classes will be added, modified, or removed in this implementation.

[Dependencies]
No new dependencies will be added.

[Testing]
No new test files will be added. The primary validation will be done by running the application and testing with the provided raw text examples to ensure the output matches the "PROPER" versions.

[Implementation Order]
The implementation will be done in a logical order to minimize disruption and ensure that each step builds upon a solid foundation.

1.  **Refactor `aggregation.js`:**
    -   Update the aggregation key to be more specific.
    -   Fix the "Supply Only" group name handling.
    -   Add the enhanced sorting logic for "Bulk Insulation".
    -   Implement the default material lookup logic.
2.  **Refactor `PasteParser.js`:**
    -   Update the category mapping.
    -   Implement the new XPS panel parsing logic.
    -   Correct the Damp Course handling.
3.  **Refactor `PasteParserReview.js`:**
    -   Fix the note rendering logic.
    -   Correct the line item display order.
