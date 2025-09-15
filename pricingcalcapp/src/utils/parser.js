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
    GROUP_HEADER: /^(?!\s*-|\s{2,}).+$/,
    LINE_ITEM: /[-•*]?\s*(?<descriptionAndStuff>.+?)\s*–\s*(?<quantity>\d+)(?<unit>m²|LM)(?<remainder>.*)/i,
    IMPLIED_LINE_ITEM: /^(?<descriptionAndStuff>.+?)\s*–\s*(?<quantity>\d+)(?<unit>m²|LM)(?<remainder>.*)/i,
    NOTE_PROMOTION: /(?<description>.+?)\s*–\s*(?<width>\d+mm)?\s*\((?<quantity>\d+)(?<unit>LM)\)/i,
    R_VALUE: /R[\d.]+\s*\w*/,
    COLOR_HINT: /\(Marked\s+([A-Z\s]+)\)/i,
};

// --- PARSING HELPER FUNCTIONS ---

const isLineItem = (line) => {
    return REGEX.LINE_ITEM.test(line) || REGEX.IMPLIED_LINE_ITEM.test(line);
};

const splitNotes = (notesString) => {
    if (!notesString) return [];
    // Split by various dash formats, then clean up the resulting array.
    return notesString.split(/\s*--\s*|\s*—\s*|\s*-\s*/)
        .map(n => n.trim())
        .filter(Boolean);
};

const parseLineItem = (line, currentGroup, isImplied = false) => {
    const match = line.match(isImplied ? REGEX.IMPLIED_LINE_ITEM : REGEX.LINE_ITEM);
    if (!match) return null;

    let { descriptionAndStuff, quantity, unit, remainder } = match.groups;
    let description = descriptionAndStuff;
    let colorHint = null;
    let rValue = null;
    let isSupplyOnly = false;

    if (description.toUpperCase().includes('SUPPLY ONLY')) {
        isSupplyOnly = true;
        description = description.replace(/-\s*SUPPLY ONLY/i, '').trim();
    }

    const rValueMatch = description.match(REGEX.R_VALUE);
    if (rValueMatch) {
        rValue = rValueMatch[0].trim().replace(/\s*PIR\s*$/, '');
        description = description.replace(REGEX.R_VALUE, '').trim();
    }

    const colorMatch = description.match(REGEX.COLOR_HINT);
    if (colorMatch) {
        colorHint = colorMatch[1].trim();
        description = description.replace(colorMatch[0], '').trim();
    }

    const category = description.toLowerCase().includes('xps') ? 'XPS' : (currentGroup?.category || null);

    const lineItem = {
        id: nanoid(),
        type: 'LINE_ITEM',
        confidence: 'high',
        originalText: line,
        description: description.trim().replace(/-\s*$/, '').trim(),
        colorHint,
        rValue,
        isSupplyOnly,
        quantity: parseFloat(quantity),
        unit: unit,
        notes: [],
        location: currentGroup?.location || null,
        category: category,
    };

    if (remainder && remainder.trim()) {
        let notesContent = remainder.trim().replace(/^\s*[-—]\s*/, '');
        lineItem.notes.push(...splitNotes(notesContent));
    }

    return { lineItem };
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

        const isItemGroup = !isLineItem(trimmedLine) && REGEX.GROUP_HEADER.test(line);
        const isImplied = !line.trim().startsWith('-') && isLineItem(trimmedLine);

        if (isItemGroup) {
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
            currentLineItem = null;
        } else if (isLineItem(trimmedLine)) {
            const parsed = parseLineItem(trimmedLine, currentGroup, isImplied);
            if (parsed && currentGroup) {
                currentLineItem = parsed.lineItem;
                currentGroup.lineItems.push(currentLineItem);
            }
        } else if (currentLineItem) {
            const promotionMatch = trimmedLine.match(REGEX.NOTE_PROMOTION);
            if (promotionMatch && currentGroup) {
                const { description, quantity, unit } = promotionMatch.groups;
                const promotedItem = {
                    id: nanoid(),
                    type: 'LINE_ITEM',
                    confidence: 'high',
                    originalText: trimmedLine,
                    description: description.trim(),
                    colorHint: null,
                    rValue: null,
                    isSupplyOnly: false,
                    quantity: parseFloat(quantity),
                    unit: unit,
                    notes: [],
                    location: currentGroup.location,
                    category: mapItemTypeToCategory(description),
                };
                currentGroup.lineItems.push(promotedItem);
            } else {
                // This is an indented note. Split it in case it contains multiple notes.
                currentLineItem.notes.push(...splitNotes(trimmedLine));
            }
        } else if (currentGroup) {
            currentGroup.lineItems.push({
                id: nanoid(),
                type: 'NOTE',
                confidence: 'low',
                originalText: trimmedLine,
                notes: [],
            });
        }
    }
    return worksheet;
};
