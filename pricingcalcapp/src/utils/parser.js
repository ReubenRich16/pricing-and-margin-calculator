import { nanoid } from 'nanoid';

// --- CATEGORY MAPPING HELPER ---
const mapItemTypeToCategory = (itemType) => {
    if (!itemType) return 'Other';
    const lower = itemType.toLowerCase();
    if (lower.includes('xps')) return 'XPS';
    if (lower.includes('bulk insulation') || lower.includes('batt')) return 'Bulk Insulation';
    if (lower.includes('rigid') || lower.includes('soffit') || lower.includes('wall panel insulation') || lower.includes('panels')) return 'Rigid Wall/Soffit';
    if (lower.includes('wall wrap') || lower.includes('brane')) return 'Wall Wrap';
    if (lower.includes('fire protection') || lower.includes('fireproof')) return 'Fire Protection';
    if (lower.includes('subfloor')) return 'Subfloor';
    if (lower.includes('pipe lagging')) return 'Acoustic Pipe Lagging';
    if (['consumables', 'tape', 'dampcourse', 'strapping', 'staples'].some(c => lower.includes(c))) return 'Consumables';
    return 'Other';
};

// --- REGEX DEFINITIONS ---
const REGEX = {
    // Matches lines that clearly look like line items (ending in area/length)
    // Supports bullets: -, •, *
    // Supports separator: –, -
    LINE_ITEM: /^(?:[-•*]\s*)?(?<descriptionAndStuff>.*?)\s*[–-]\s*(?<quantity>[\d,.]+)(?<unit>m²|LM|m2|lm)(?<remainder>.*)$/i,
    
    // Fallback for lines that might lack the separator but have the unit (less strict)
    IMPLIED_LINE_ITEM: /^(?<descriptionAndStuff>.+?)\s+(?<quantity>[\d,.]+)(?<unit>m²|LM|m2|lm)(?<remainder>.*)$/i,

    // Specific extractions
    PRODUCT_COUNT: /(?<count>\d+)\s*(?<unit>panels|bags|rolls|sheets)/i,
    THICKNESS: /(?<thickness>\d+mm)/i,
    DIMENSIONS: /(?<dimensions>\d+\s*[xX]\s*\d+mm)/i,
    
    R_VALUE: /R[\d.]+\s*\w*/,
    COLOR_HINT: /\(Marked\s+([A-Z\s]+)\)/i,
    DAMP_COURSE: /Includes damp course –\s*(?<width>\d+MM)\s*\(\s*(?<length>\d+)LM\)/i,
    
    // Keywords
    SUPPLY_ONLY: /SUPPLY ONLY/i,
    LAYERED: /layered/i,
};

// --- PARSING HELPER FUNCTIONS ---

const isLineItem = (line) => {
    return REGEX.LINE_ITEM.test(line); // || REGEX.IMPLIED_LINE_ITEM.test(line); // strict regex preferred first
};

const splitNotes = (notesString) => {
    if (!notesString) return [];
    // Split by various dash formats, then clean up the resulting array.
    // Avoid splitting if it breaks a sentence, but generally notes are separated by dashes.
    return notesString.split(/\s*--\s*|\s*—\s*|\s*-\s*/)
        .map(n => n.trim())
        .filter(Boolean);
};

const parseLineItem = (line, currentGroup) => {
    const match = line.match(REGEX.LINE_ITEM);
    if (!match) return null;

    let { descriptionAndStuff, quantity, unit, remainder } = match.groups;
    let description = descriptionAndStuff;
    let colorHint = null;
    let rValue = null;
    let isSupplyOnly = false;
    
    // Specific Product Fields
    let productCount = null;
    let productUnit = null;
    let thickness = null;
    let dimensions = null;

    // --- SECONDARY EXTRACTION ON DESCRIPTION ---
    
    // Extract Product Count (Panels/Bags/Rolls/Sheets)
    const productCountMatch = description.match(REGEX.PRODUCT_COUNT);
    if (productCountMatch) {
        productCount = parseInt(productCountMatch.groups.count, 10);
        productUnit = productCountMatch.groups.unit.toLowerCase();
        // We do NOT remove this from description to keep context readable
    }

    // Extract Thickness (e.g., 70mm)
    const thicknessMatch = description.match(REGEX.THICKNESS);
    if (thicknessMatch) {
        thickness = thicknessMatch.groups.thickness;
    }

    // Extract Dimensions (e.g., 2400x600mm)
    const dimensionsMatch = description.match(REGEX.DIMENSIONS);
    if (dimensionsMatch) {
        dimensions = dimensionsMatch.groups.dimensions.replace(/\s+/g, ''); // Normalize spacing
    }

    // Extract Supply Only flag
    if (REGEX.SUPPLY_ONLY.test(description)) {
        isSupplyOnly = true;
    }

    // Extract R-Value
    const rValueMatch = description.match(REGEX.R_VALUE);
    if (rValueMatch) {
        rValue = rValueMatch[0].trim().replace(/\s*PIR\s*$/, '');
        description = description.replace(REGEX.R_VALUE, '').trim();
    }

    // Extract Color Hint
    const colorMatch = description.match(REGEX.COLOR_HINT);
    if (colorMatch) {
        colorHint = colorMatch[1].trim();
        description = description.replace(colorMatch[0], '').trim();
    }

    // Determine Category
    const category = description.toLowerCase().includes('xps') ? 'XPS' : (currentGroup?.category || mapItemTypeToCategory(description));

    // Create the primary line item
    const lineItem = {
        id: nanoid(),
        type: 'LINE_ITEM',
        confidence: 'high',
        originalText: line,
        description: description.trim().replace(/[-–]\s*$/, '').trim(),
        colorHint,
        rValue,
        isSupplyOnly,
        isLayered: false, // will check notes later
        
        // New Fields
        productCount,
        productUnit,
        thickness,
        dimensions,
        
        quantity: parseFloat(quantity.replace(/,/g, '')), // handle commas
        unit: unit,
        notes: [],
        location: currentGroup?.location || null,
        category: category,
    };

    const additionalItems = [];

    // Process Remainder (same line notes)
    if (remainder && remainder.trim()) {
        let notesContent = remainder.trim().replace(/^\s*[-—]\s*/, '');
        
        // Check for Damp Course in remainder
        const dampCourseMatch = notesContent.match(REGEX.DAMP_COURSE);
        if (dampCourseMatch) {
            const { width, length } = dampCourseMatch.groups;
            const lengthValue = parseInt(length, 10);
            additionalItems.push({
                id: nanoid(),
                type: 'LINE_ITEM',
                description: "Damp Course",
                specifications: { width: `${width}`, length: lengthValue }, // ensure width is string '300MM' or similar
                thickness: width.toLowerCase(), // map width to thickness for consistency
                quantity: lengthValue,
                unit: 'LM',
                colorHint: null,
                rValue: null,
                notes: [],
                location: currentGroup?.location,
                category: "Consumables",
            });
            notesContent = notesContent.replace(dampCourseMatch[0], '').trim();
        }

        if (notesContent) {
            lineItem.notes.push(...splitNotes(notesContent));
        }
    }

    return { lineItem, additionalItems };
};

// --- MAIN PARSING ENGINE ---
export const parseWorksheetText = (text) => {
    const lines = text.replace(/\u00A0/g, ' ').split('\n');
    const worksheet = { groups: [] };
    let currentGroup = null;
    let currentLineItem = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('___')) {
            continue;
        }

        const looksLikeLineItem = isLineItem(trimmedLine);

        // If it's a line item, process it
        if (looksLikeLineItem) {
            const parsed = parseLineItem(trimmedLine, currentGroup);
            if (parsed) {
                currentLineItem = parsed.lineItem;
                
                // Ensure we have a group to attach to
                if (!currentGroup) {
                    currentGroup = {
                        id: nanoid(),
                        type: 'GROUP_HEADER',
                        groupName: "Ungrouped Items",
                        location: "Ungrouped",
                        itemType: "Misc",
                        category: "Other",
                        lineItems: [],
                    };
                    worksheet.groups.push(currentGroup);
                }

                currentGroup.lineItems.push(currentLineItem);
                
                // Add any extra items found (e.g. damp course)
                if (parsed.additionalItems && parsed.additionalItems.length > 0) {
                    currentGroup.lineItems.push(...parsed.additionalItems);
                }
            }
        } 
        // If it's NOT a line item, check if it's a Header or a Note
        else {
            // Heuristics for Header:
            // 1. We are NOT currently parsing a line item's notes (or we are, but this line looks like a header)
            // 2. It doesn't start with a dash/bullet (usually) - though some headers might.
            // 3. It usually contains specific keywords or structure (Block, Unit, Level, Location)
            
            // However, distinguishing between a "Note for the previous item" and a "New Header" is the hardest part.
            // Rule: If it starts with a dash/bullet/indent, treat as Note for current item (if exists).
            // Rule: If it matches "Damp Course" regex, treat as Note/Extra.
            // Rule: Otherwise, treat as Header.
            
            const isNoteFormat = /^[ \t]*[-•*]/.test(line); // indented or bulleted
            const hasNoteKeywords = REGEX.SUPPLY_ONLY.test(trimmedLine) || REGEX.LAYERED.test(trimmedLine) || REGEX.DAMP_COURSE.test(trimmedLine);
            
            if ((isNoteFormat || hasNoteKeywords) && currentLineItem) {
                // Treat as Note for current item
                
                // Check for Damp Course specifically
                const dampCourseMatch = trimmedLine.match(REGEX.DAMP_COURSE);
                if (dampCourseMatch) {
                    const { width, length } = dampCourseMatch.groups;
                    const lengthValue = parseInt(length, 10);
                    currentGroup.lineItems.push({
                        id: nanoid(),
                        type: 'LINE_ITEM',
                        description: "Damp Course",
                        specifications: { width: `${width}`, length: lengthValue },
                        thickness: width.toLowerCase(),
                        quantity: lengthValue,
                        unit: 'LM',
                        colorHint: null,
                        rValue: null,
                        notes: [],
                        location: currentGroup?.location,
                        category: "Consumables",
                    });
                } else {
                    // Regular note
                    const cleanNote = trimmedLine.replace(/^[ \t]*[-•*]\s*/, '').trim();
                    if (cleanNote) {
                        currentLineItem.notes.push(cleanNote);
                        
                        // Check for flags in the note
                        if (REGEX.SUPPLY_ONLY.test(cleanNote)) {
                            currentLineItem.isSupplyOnly = true;
                        }
                        if (REGEX.LAYERED.test(cleanNote)) {
                            currentLineItem.isLayered = true;
                        }
                    }
                }
            } else {
                // Treat as Group Header
                const locationMatch = trimmedLine.match(/^(?:U\d+,\s*)?([^–]+)/);
                const location = locationMatch ? locationMatch[1].trim() : trimmedLine;
                const itemTypeMatch = trimmedLine.match(/–\s*(.+)/);
                const itemType = itemTypeMatch ? itemTypeMatch[1].trim() : null;

                currentGroup = {
                    id: nanoid(),
                    type: 'GROUP_HEADER',
                    groupName: trimmedLine,
                    unitNumber: null,
                    location: location,
                    itemType: itemType,
                    category: mapItemTypeToCategory(itemType || location),
                    lineItems: [],
                };
                worksheet.groups.push(currentGroup);
                currentLineItem = null; // Reset current line item as we started a new group
            }
        }
    }
    return worksheet;
};
