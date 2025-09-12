# Implementation Plan

[Overview]
This plan outlines the necessary changes to correctly handle "Supply Only" items within the parsing and aggregation engine, ensuring they remain in their original groups while being clearly marked.

[Types]
No new types will be introduced, but an existing data structure will be modified. The `lineItem` object, created in `PasteParser.js` and used throughout the aggregation and display process, will be updated to include a new boolean flag.

- `lineItem`:
  - `isSupplyOnly` (boolean, optional): Will be set to `true` if the item is identified as "Supply Only".

[Files]
This implementation will involve modifications to three key files: `PasteParser.js`, `aggregation.js`, and `PasteParserReview.js`.

- `src/components/quote/PasteParser.js`: The parsing logic will be updated to stop moving "Supply Only" items to a separate group and instead flag them directly on the line item object.
- `src/utils/aggregation.js`: The aggregation logic will be modified to prevent the creation of a separate "Supply Only" group and to correctly group items based on their new `isSupplyOnly` flag.
- `src/components/quote/PasteParserReview.js`: The display component will be updated to render a "Supply Only" label for flagged items.

[Functions]
Several functions across the three files will be modified to implement the new "Supply Only" handling.

- **Modified Functions:**
  - `parseSupplyOnlyItem` (in `src/components/quote/PasteParser.js`): This function will be removed, as its logic will be integrated into `parseLineItem`.
  - `parseLineItem` (in `src/components/quote/PasteParser.js`): Will be updated to detect "SUPPLY ONLY" text in the line and set the `isSupplyOnly` flag.
  - `parseTextToWorksheet` (in `src/components/quote/PasteParser.js`): The logic for creating a separate "Supply Only" group will be removed.
  - `aggregateWorksheet` (in `src/utils/aggregation.js`): The logic for creating a separate "Supply Only" group will be removed, and the item keying logic will be updated to include the `isSupplyOnly` status.
  - `GroupCard` (in `src/components/quote/PasteParserReview.js`): Will be updated to display a "Supply Only" label next to items where `isSupplyOnly` is `true`.

[Classes]
No classes will be added, modified, or removed.

[Dependencies]
No new dependencies will be added.

[Testing]
The primary method of testing will be to use the provided raw text input and verify that the rendered output in the browser matches the desired outcome, specifically ensuring that "Supply Only" items are correctly displayed within their original groups.

[Implementation Order]
1.  Modify `src/components/quote/PasteParser.js` to flag "Supply Only" items instead of moving them.
2.  Modify `src/utils/aggregation.js` to handle the new `isSupplyOnly` flag during aggregation.
3.  Modify `src/components/quote/PasteParserReview.js` to display the "Supply Only" status.
4.  Test the entire flow using the provided raw text to ensure the output is correct.
