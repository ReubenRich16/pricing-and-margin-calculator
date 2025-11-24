import { nanoid } from 'nanoid';

// --- HELPER FUNCTIONS ---

const smartTitleCase = (str) => {
    // 1. Standard Title Case (split by spaces or hyphens)
    // We use a regex that treats hyphens as separators
    let result = str.toLowerCase().replace(/(?:^|[\s-])\w/g, (match) => {
        return match.toUpperCase();
    });
    
    // 2. Fix specific ID patterns (DW1, TH1A-1, U1)
    // Matches word boundary, Prefix (Dw/Th/U), optional suffix (numbers/letters/dashes), word boundary
    result = result.replace(/\b(Dw|Th|U)([0-9a-z-]+)?\b/gi, (match, prefix, suffix) => {
        return prefix.toUpperCase() + (suffix ? suffix.toUpperCase() : '');
    });
    
    // Fix Block
    result = result.replace(/\bBlock\s+(\d+)\b/gi, (match, num) => {
        return `Block ${num}`;
    });

    return result;
};

const splitNotes = (notesString) => {
    if (!notesString) return [];
    // Split by:
    // - Semicolons (;)
    // - Triple spaces or more (\s{3,})
    // - " - " (Space Dash Space)
    // - Standard dash separators (-- / —)
    return notesString.split(/;|\s{3,}|\s-\s|\s*--\s*|\s*—\s*/)
        .map(n => n.trim())
        .filter(Boolean);
};

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
    
    // Block Detection
    BLOCK_HEADER: /^(?:Block\s+\d+|Existing|New|Extension)/i,
};

// --- PARSING HELPER FUNCTIONS ---

const isLineItem = (line) => {
    return REGEX.LINE_ITEM.test(line); // || REGEX.IMPLIED_LINE_ITEM.test(line); // strict regex preferred first
};

const validateLineItem = (lineItem) => {
    // Dimension Check: If description contains "X panels" AND dimensions (e.g., "2400x600mm"):
    // Calculate Theoretical Area = Count * Width * Length.
    // Compare with the parsed Quantity (m²).
    // If discrepancy > 5%, add a note.
    
    if (lineItem.productCount && lineItem.dimensions) {
        // dimensions format: 2400x600mm
        const dims = lineItem.dimensions.toLowerCase().replace('mm', '').split('x');
        if (dims.length === 2) {
            const width = parseFloat(dims[0]) / 1000; // convert mm to m
            const length = parseFloat(dims[1]) / 1000; // convert mm to m
            const theoreticalArea = lineItem.productCount * width * length;
            const quotedArea = lineItem.quantity;
            
            // Calculate discrepancy percentage
            const diff = Math.abs(theoreticalArea - quotedArea);
            const percentage = (diff / quotedArea) * 100;
            
            if (percentage > 5) {
                lineItem.notes.push(`⚠️ Dimensions Check: ${lineItem.productCount} panels covers ${theoreticalArea.toFixed(2)}m², but quoted ${quotedArea.toFixed(2)}m².`);
            }
        }
    }
    return lineItem;
};

const calculatePanelCount = (itemData, materials) => {
    // Return if already has count or not a relevant category
    if (itemData.productCount) return null;
    if (!['XPS', 'Rigid Wall/Soffit'].includes(itemData.category)) return null;

    let width, length;

    // 1. Check extracted dimensions from text
    if (itemData.dimensions) {
        const parts = itemData.dimensions.toLowerCase().replace('mm', '').split('x');
        if (parts.length === 2) {
             // Usually length x width (e.g. 2400x600)
             length = parseFloat(parts[0]);
             width = parseFloat(parts[1]);
        }
    }

    // 2. If no dims found in text, search materials database
    if ((!width || !length) && materials && materials.length > 0) {
        // Parsing thickness from string "70mm" -> 70
        const thicknessVal = itemData.thickness ? parseFloat(itemData.thickness) : null;
        const rVal = itemData.rValue ? parseFloat(itemData.rValue.replace('R', '')) : null;

        // Try to find a match
        const match = materials.find(m => {
            // Category check (loose, as XPS is often in Rigid category in DB)
            const catMatch = m.category === itemData.category || (itemData.category === 'Rigid Wall/Soffit' && (m.materialName.includes('K10') || m.materialName.includes('K12')));
            
            // Thickness check
            const thickMatch = thicknessVal ? (parseFloat(m.thickness) === thicknessVal) : true;
            
            // R-Value check
            const rMatch = rVal ? (parseFloat(m.rValue) === rVal) : true;
            
            // Description check (if no specific attributes matched, try finding brand names)
            // But strict matching is better to avoid false positives. 
            // We rely on thickness/R-value/Category primarily.
            
            return catMatch && thickMatch && rMatch;
        });

        if (match) {
            width = parseFloat(match.width);
            length = parseFloat(match.length);
        }
    }

    if (width && length) {
        const areaPerBoard = (width * length) / 1000000; // mm^2 to m^2
        const count = Math.ceil(itemData.quantity / areaPerBoard);
        
        return {
            count: count,
            unit: 'panels', // Default to panels for XPS/Rigid
            dims: `${Math.max(width, length)}x${Math.min(width, length)}` // Format like 2400x600
        };
    }
    return null;
};

const parseLineItem = (line, currentGroup, materials) => {
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

    // Description Casing: KEEP ORIGINAL (Requirement: NO CHANGES)
    const cleanedDescription = description.trim().replace(/[-–]\s*$/, '').trim();

    // Create the primary line item
    let lineItem = {
        id: nanoid(),
        type: 'LINE_ITEM',
        confidence: 'high',
        originalText: line,
        description: cleanedDescription,
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

    // --- AUTO CALCULATION ---
    const calcResult = calculatePanelCount(lineItem, materials);
    if (calcResult) {
        lineItem.productCount = calcResult.count;
        lineItem.productUnit = calcResult.unit;
        // Add note
        lineItem.notes.push(`⚡ Auto-calculated: ${calcResult.count} panels based on ${calcResult.dims} dimensions.`);
    }

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
                description: "Includes Damp Course", // Explicit Description
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
            notesContent = notesContent.replace(dampCourseMatch[0], '').trim();
        }

        if (notesContent) {
            // Preservation of Context: Ensure notes are added
            lineItem.notes.push(...splitNotes(notesContent));
        }
    }

    lineItem = validateLineItem(lineItem);

    return { lineItem, additionalItems };
};

// --- MAIN PARSING ENGINE ---
export const parseWorksheetText = (text, materials = []) => {
    const lines = text.replace(/\u00A0/g, ' ').split('\n');
    const worksheet = { groups: [] };
    let currentGroup = null;
    let currentLineItem = null;
    let currentBlock = null; // Context Awareness: Track Parent Block

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('___')) {
            continue;
        }

        const looksLikeLineItem = isLineItem(trimmedLine);

        // If it's a line item, process it
        if (looksLikeLineItem) {
            const parsed = parseLineItem(trimmedLine, currentGroup, materials);
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
                        block: currentBlock, // Assign current block
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
            
            // Check for Block Header first
            if (REGEX.BLOCK_HEADER.test(trimmedLine)) {
                currentBlock = trimmedLine;
                // Do NOT create a group yet, just update state
                currentLineItem = null; // Reset line item context
                continue;
            }

            // Heuristics for Header vs Note
            const isNoteFormat = /^[ \t]*[-•*]/.test(line); // indented or bulleted
            const hasNoteKeywords = REGEX.SUPPLY_ONLY.test(trimmedLine) || REGEX.LAYERED.test(trimmedLine) || REGEX.DAMP_COURSE.test(trimmedLine);
            
            if ((isNoteFormat || hasNoteKeywords) && currentLineItem) {
                // Treat as Note for current item
                
                // Check for Damp Course specifically (legacy support for notes)
                const dampCourseMatch = trimmedLine.match(REGEX.DAMP_COURSE);
                if (dampCourseMatch) {
                    const { width, length } = dampCourseMatch.groups;
                    const lengthValue = parseInt(length, 10);
                    currentGroup.lineItems.push({
                        id: nanoid(),
                        type: 'LINE_ITEM',
                        description: "Includes Damp Course", // Explicit Description
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
                    // Preservation: We keep the raw note text!
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
                
                // Unit Parsing: Look for complex IDs like TH1A-1 or DW2
                // Matches "ID, Location..." or just "Location"
                // ID pattern: Alphanumeric with optional dashes, at start of line, usually followed by comma or separator
                const unitMatch = trimmedLine.match(/^([A-Z0-9]+(?:-[A-Z0-9]+)?)(?:,|\s–|\s-)/i);
                const unitIdentifier = unitMatch ? unitMatch[1].trim() : null;

                const locationMatch = trimmedLine.match(/^(?:[A-Z0-9]+(?:-[A-Z0-9]+)?(?:,|\s–|\s-)\s*)?([^–]+)/i);
                const location = locationMatch ? locationMatch[1].trim() : trimmedLine;
                const itemTypeMatch = trimmedLine.match(/–\s*(.+)/);
                const itemType = itemTypeMatch ? itemTypeMatch[1].trim() : null;
                
                // Apply Smart Title Case to Header
                const titleCasedHeader = smartTitleCase(trimmedLine);

                currentGroup = {
                    id: nanoid(),
                    type: 'GROUP_HEADER',
                    groupName: titleCasedHeader,
                    unitIdentifier: unitIdentifier, // Store Unit ID
                    location: location,
                    itemType: itemType,
                    category: mapItemTypeToCategory(itemType || location),
                    lineItems: [],
                    block: currentBlock, // Assign current block
                };
                worksheet.groups.push(currentGroup);
                currentLineItem = null; // Reset current line item as we started a new group
            }
        }
    }
    return worksheet;
};
