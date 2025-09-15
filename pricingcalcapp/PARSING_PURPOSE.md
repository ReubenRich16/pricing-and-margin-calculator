# PARSING ENGINE DOCUMENTATION

## 1. Purpose & Design Philosophy
The primary purpose of the parsing engine is to ingest raw, unstructured, and often inconsistent text from insulation quotes and meticulously transform it into a structured, hierarchical, and aggregated format. This process is the foundational step for all subsequent application functionality, including accurate pricing calculations, material logistics, and the generation of professional client-facing quote worksheets.

### The Human-in-the-Loop System
Given the inherent ambiguity of free-form text, the engine is designed as a human-in-the-loop system. It is not intended to be a fully autonomous, infallible parser. Instead, its philosophy is to perform 80-90% of the tedious data structuring work, and then present a structured, editable preview to a human operator. This allows the user to quickly review, validate, and correct any ambiguities, creating a powerful synergy between automated processing and human oversight.

Key features of this system include:

- **Confidence Scoring:** The parser assigns a confidence level (high or low) to each line item it processes. Lines that do not perfectly match an expected format are flagged as low confidence and highlighted in the UI, immediately drawing the user's attention to potential errors.
- **Interactive Review & Editing:** The user is presented with a review screen where they can directly edit the text of any line, correct its type (e.g., from `NOTE` to `LINE_ITEM`), and merge group headers that were incorrectly separated.
- **Real-time Recalculation:** Any change made in the review screen triggers a complete re-parsing and re-aggregation of the entire quote, providing immediate feedback on the final calculations.

## 2. System Architecture & Workflow
The entire process, from raw text to final worksheet data, is handled by a two-stage pipeline orchestrated by three key modules.

```
[Raw Text Input]
       |
       v
[ 1. UI Component: `PasteParser.js` ]
       |
       +------------------------------------------------------+
       |                                                      |
       v                                                      v
[ 2. Parsing Engine: `parser.js` ]                     [ 3. Aggregation Engine: `aggregation.js` ]
       |                                                      ^
       | [ Stage 1: Initial Parsing ]                         | [ Stage 2: Post-Processing ]
       | - State machine processes text line-by-line          | - Aggregates groups by name
       | - Regex extracts entities (description, m², R-value) | - Applies custom business logic & sorting
       | - Assigns confidence scores                          | - Enriches data (e.g., material lookups)
       |                                                      |
       +------> [ Structured but Unaggregated Data ] ----------+
                               |
                               v
                       [ Final, Aggregated Worksheet Data ]
```

### Module Descriptions
- **`src/components/quote/PasteParser.js` (The UI Component)**
    - **Role:** The user interface and process orchestrator.
    - **Description:** This React component contains the `<textarea>` for pasting the raw text. Upon user action, it triggers the workflow, first calling the core parsing engine and then feeding its output into the aggregation engine to produce the final result.

- **`src/utils/parser.js` (The Core Parsing Engine)**
    - **Role:** Raw text-to-structure conversion.
    - **Description:** This is the heart of the initial parsing logic. The `parseWorksheetText` function uses a state machine to understand the context of each line. It applies complex regular expressions to identify and dissect group headers, line items, and notes. Its sole responsibility is to convert the chaotic input text into a predictable, structured, but still fragmented, JSON object.

- **`src/utils/aggregation.js` (The Post-Processing & Business Logic Engine)**
    - **Role:** Structure-to-worksheet refinement and business rule application.
    - **Description:** This utility consumes the structured output from the parser. It applies a crucial layer of domain-specific business logic, handling the aggregation of groups with identical names, applying custom sorting rules for presentation, and enriching the data. Its output is the final, clean worksheet data ready for display and calculation.

## 3. Parsing Rules & Text Structure Conventions
The engine's flexibility is guided by a set of rules for interpreting the input text's structure. Adherence to these conventions ensures the highest parsing accuracy.

### 3.1. Group Headers
- **Definition:** Any line that is not indented and does not start with a hyphen (`-`).
- **Behaviour:** Defines a primary section of work.
- **Example:** `U1, Basement to Second Floor – Ceiling & wall bulk insulation`

### 3.2. Line Items
A line is classified as a `LINE_ITEM` if it meets one of two conditions:

- **Standard Line Item (Explicit)**
    - **Definition:** A line that begins with a hyphen (`-`) and contains a parsable quantity (e.g., `m²`, `LM`).
    - **Core Format:** `-[Description] (MARKED [COLOR]) [R-VALUE] – [QUANTITY]m²`
    - **Example:** `- ROOF CEILING BATTS (MARKED RED) R5.0 – 73m²`

- **Implied Line Item**
    - **Definition:** A line that does not begin with a hyphen but still contains a parsable quantity.
    - **Example:** `BRANE VHP – 84m²`

### 3.3. Notes & Billable Sub-Items
The parser's logic handles notes and can distinguish between descriptive text and billable sub-items.

- **Same-Line Notes:**
    - **Definition:** Any text appearing on the same line as a valid `LINE_ITEM` after the quantity has been identified.
    - **Behaviour:** This text is captured and stored in the `notes` array of the parent line item. If the text contains multiple notes separated by a hyphen, they will be split into separate entries.
    - **Example:** In `BRANE VHP – 36m² - SUPPLY ONLY - Delivery included`, the text is captured as two notes: `"SUPPLY ONLY"` and `"Delivery included"`.

- **Indented Notes:**
    - **Definition:** Any line that is indented with spaces and appears directly after a `LINE_ITEM`.
    - **Behaviour:** The line is treated as a descriptive note. If it contains multiple notes separated by a hyphen, they will be split and added to the parent item's `notes` array.
    - **Example:** `  - Priced as install strictly before other trades/services - Price estimate only` becomes two notes.

- **Intelligent Note Promotion (Note becomes a Line Item):**
    - **Definition:** An indented line that contains patterns indicating it is a distinct, billable item (e.g., a description followed by a quantity in parentheses).
    - **Behaviour:** The parser promotes the note, creating a new, separate `LINE_ITEM`.
    - **Example:** The indented note `- Includes damp course – 450mm (12LM)` becomes a distinct `LINE_ITEM` with the description `damp course` and a quantity of `12LM`.

## 4. Final Output Data Schema
The final output is a worksheet object containing an array of group objects.

### The `group` Object
| Property       | Type         | Description                                                  |
| :------------- | :----------- | :----------------------------------------------------------- |
| `id`           | `string`     | A unique identifier for the group (e.g., `"agg-12345"`).      |
| `groupName`    | `string`     | The descriptive name of the group.                           |
| `lineItems`    | `lineItem[]` | An array of `lineItem` objects belonging to this group.      |
| `sourceGroupIds` | `string[]`   | An array of IDs from the raw parsed groups that were combined. |

### The `lineItem` Object
| Property       | Type       | Description                                                                                                |
| :------------- | :--------- | :--------------------------------------------------------------------------------------------------------- |
| `id`           | `string`   | A unique identifier for the line item (e.g., `"li-12345"`).                                                 |
| `originalText` | `string`   | The raw, unmodified text of the line as it appeared in the input.                                          |
| `description`  | `string`   | The clean description of the item (e.g., `"ROOF CEILING BATTS"`).                                          |
| `colorHint`    | `string`   | The colour parsed from the `(MARKED ...)` text, if present.                                                |
| `rValue`       | `string`   | The R-Value of the material, if present (e.g., `"R5.0"`).                                                  |
| `quantity`     | `number`   | The area or quantity parsed from the line (e.g., `73`).                                                    |
| `unit`         | `string`   | The unit of measure, which defaults to `m²` or `LM`.                                                       |
| `notes`        | `string[]` | An array of any additional non-billable notes associated with the item.                                    |
| `category`     | `string`   | The category of the item, derived from keywords (e.g., `"Bulk Insulation"`).                               |
| `isSupplyOnly` | `boolean`  | A flag set to `true` if keywords like `"SUPPLY"` are detected.                                             |

## 5. Annotated Parsing Scenarios & Examples
The following section provides a comprehensive breakdown of parsing scenarios for each known quote category, demonstrating how the rules are applied to a variety of real-world text formats.

### Category: Bulk Insulation
This is the most common category and can include complex, hierarchical groupings.

**Standard Hierarchical Format**
```
U1, Ground-Second Floor – Ceiling & wall bulk insulation // [GROUP HEADER]
- ROOF CEILING BATTS (MARKED RED) R6.0 – 48m²              // [LINE ITEM] - Standard format with description, color, R-Value, and quantity.
- BETWEEN FLOOR BATTS (MARKED GREEN) R6.0 – 44m²           // [LINE ITEM]
- EXTERNAL WALL ACOUSTIC BATTS (MARKED BLUE) R2.7NB – 124m²// [LINE ITEM] - Note the "NB" suffix on the R-Value is correctly parsed.
```

### Category: Wall Wrap
This category often features implied line items and billable sub-items promoted from notes.

**Implied Line Item with Billable Note Promotion**
This scenario demonstrates two powerful features working together.
```
// Input Text:
U1, Ground Floor – Wall wrap
BRANE VHP – 76m²
   - Includes damp course – 300MM (23LM)

// Expected Parsed Structure:
// GROUP HEADER: "U1, Ground Floor – Wall wrap"
//   - LINE ITEM 1: description="BRANE VHP", quantity=76, unit="m²"
//   - LINE ITEM 2 (Promoted): description="damp course", quantity=23, unit="LM"
```

### Category: Rigid Wall Panels
This category refers to rigid insulation panels installed on vertical wall surfaces.

**Standard Format with Product Specification Note**
```
U1, Basement – Wall panel insulation                         // [GROUP HEADER]
- EXTERNAL WALL RIGID TO GARAGE (MARKED SKY BLUE) R1.75 – 13m² // [LINE ITEM] - The 'PIR' is correctly ignored as part of the R-Value.
  - 40mm Kingspan Kooltherm K12 (2400x1200mm)                 // [NOTE] - This product specification is captured in the notes array.
  - Priced as install strictly before other trades/services  // [NOTE]
```

### Category: Soffit Panels
This category refers to panels installed on the underside of suspended concrete slabs, typically in basements or carparks.

**Standard Format with Multi-Line Notes**
```
U1-8, Basement – Soffit panels                                                // [GROUP HEADER]
- SUSPENDED CONCRETE SOFFIT PANELS (MARKED MOSS GREEN) R2.3 – 372m²           // [LINE ITEM]
  - 50mm Kingspan Kooltherm K10 G2 (2400x1200mm)                              // [NOTE 1] - Captured in notes array.
  - Priced as install strictly before other trades/services                 // [NOTE 2] - Also captured in notes array.
```

### Category: XPS Under-Slab Panels
This category refers to extruded polystyrene (XPS) boards, almost always as a "Supply Only" item for installation under concrete slabs.

**Complex Description with Supply Only Note**
```
Additional Items:                                                           // [GROUP HEADER]
U1, Slab on Ground - Panels                                                 // [GROUP HEADER]
- _ panels of __mm XPS (2400x600mm) R2.3 – 20m² (24)                       // [LINE ITEM] - The entire text before the quantity becomes the description. The parser correctly extracts "20" as the quantity and ignores the trailing "(24)".
   - SUPPLY ONLY item; Delivery included                                  // [NOTE] - This note is captured, and its content flags the parent line item with `isSupplyOnly: true`.
```

### Category: Acoustic Pipe Lagging
A distinct category with a different unit of measure.
```
Ground Floor – Acoustic pipe lagging                          // [GROUP HEADER]
- 89mm Pipework – 10LM                                      // [LINE ITEM] - The parser correctly identifies "LM" (Lineal Metres) as the unit and "10" as the quantity.
```

### Category: Fire Protection
This category includes items related to fire safety and compliance.
```
// Example to be added
