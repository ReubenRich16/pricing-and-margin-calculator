# Implementation Plan: Stateful Parser

[Overview]
This plan outlines the refactoring of the parsing engine from a stateless, regex-based approach to a more robust, context-aware state machine. This will address the current failures in handling complex and inconsistent quote formats.

[Types]
No new types will be introduced. The existing `lineItem` and `group` objects will be used.

[Files]
The primary focus of this refactor will be on `src/components/quote/PasteParser.js`. The other files will remain unchanged for now.

- `src/components/quote/PasteParser.js`: Will be heavily modified to implement the new state machine and parsing logic.

[Functions]
- **New Functions:**
  - `isLineItem(line)` (in `src/components/quote/PasteParser.js`): A new helper function that will use heuristics (e.g., presence of "m²", R-value) to determine if a line is a line item, regardless of leading characters.
- **Modified Functions:**
  - `parseTextToWorksheet` (in `src/components/quote/PasteParser.js`): This function will be completely refactored to implement the state machine.
  - `parseGroupHeader` (in `src/components/quote/PasteParser.js`): Will be updated to handle multi-line headers.
  - `parseLineItem` (in `src/components/quote/PasteParser.js`): Will be updated to work with the new `isLineItem` function.
- **Removed Functions:**
  - The existing `REGEX.LINE_ITEM` will be deprecated in favor of the `isLineItem` function.

[Classes]
No classes will be added, modified, or removed.

[Dependencies]
No new dependencies will be added.

[Testing]
The testing protocol will be as follows:
1.  For each of the `.md` files in the `public` folder, I will:
    a.  Launch the browser.
    b.  Paste the content of the file into the application.
    c.  Provide the complete **Raw Parsed JSON** output.
    d.  Provide a screenshot of the final **Aggregated & Matched Output**.
2.  We will review the results together to ensure they are perfect before moving to the next file.

[Implementation Order]
1.  Implement the `isLineItem` helper function.
2.  Refactor the `parseTextToWorksheet` function to use a state machine.
3.  Update the `parseGroupHeader` and `parseLineItem` functions to work with the new state machine.
4.  Begin the rigorous testing protocol.
