import React from 'react';
import { nanoid } from 'nanoid';

// --- CATEGORY MAPPING HELPER ---
const mapItemTypeToCategory = (itemType) => {
    if (!itemType) return 'Other';
    const lower = itemType.toLowerCase();
    if (lower.includes('bulk insulation') || lower.includes('batt')) return 'Bulk Insulation';
    if (lower.includes('rigid') || lower.includes('soffit') || lower.includes('xps') || lower.includes('wall panel insulation')) return 'Rigid Wall/Soffit';
    if (lower.includes('wall wrap') || lower.includes('brane')) return 'Wall Wrap';
    if (lower.includes('fire protection') || lower.includes('fireproof')) return 'Fire Protection';
    if (lower.includes('subfloor')) return 'Subfloor';
    if (lower.includes('pipe lagging')) return 'Acoustic Pipe Lagging';
    if (['consumables', 'tape', 'dampcourse', 'strapping', 'staples'].some(c => lower.includes(c))) return 'Consumables';
    return 'Other';
};

// --- REGEX DEFINITIONS ---
const REGEX = {
    GROUP_HEADER: /^U(\d+),\s*(.+?)(?:\s*–\s*(.+))?$/i,
    XPS_PANEL: /-\s*_\s*panels\s*of\s*__mm\s*XPS\s*\((?<dims>[\dx]+mm)\)\s*(?<rValue>R[\d.]+)\s*–\s*(?<area>\d+)m²\s*\((?<panelCount>\d+)\)/i,
    LINE_ITEM: /-\s*(?<descriptionAndStuff>.+?)\s*–\s*(?<area>\d+)m²(?<remainder>.*)/,
    DAMP_COURSE: /Includes damp course –\s*(?<width>\d+MM)\s*\(\s*(?<length>\d+)LM\)/i,
    R_VALUE: /R[\d.]+\s*\w*/,
    COLOR_HINT: /\(Marked\s+([A-Z\s]+)\)/i,
    NOTE_INDENT_1: /^  —/,
    NOTE_INDENT_2: /^   /,
};

// --- PARSING HELPER FUNCTIONS ---

// Splits a raw notes string by various delimiters into an array of clean notes.
const splitNotes = (notesString) => {
    if (!notesString) return [];
    // Normalize all dash-like separators to a consistent one, then split.
    const normalized = notesString.replace(/\s*--\s*|\s*—\s*|\s*-\s*/g, ' -- ');
    return normalized.split(' -- ').map(n => n.trim()).filter(Boolean);
};

const parseXpsPanel = (line) => {
    const match = line.match(REGEX.XPS_PANEL);
    if (!match) return null;
    const { dims, rValue, area, panelCount } = match.groups;
    return {
        id: nanoid(),
        originalText: line,
        description: `__mm XPS (${dims})`,
        rValue,
        quantity: parseFloat(area),
        unit: 'm²',
        notes: [`${panelCount} panels`],
        category: 'Rigid Wall/Soffit',
    };
};

const parseGroupHeader = (line) => {
    const match = line.match(REGEX.GROUP_HEADER);
    if (!match) return null;
    const itemType = match[3] ? match[3].trim() : null;
    return {
        unitNumber: parseInt(match[1], 10),
        location: match[2].trim(),
        itemType: itemType,
        category: mapItemTypeToCategory(itemType),
    };
};

const parseLineItem = (line, currentGroup) => {
    const match = line.match(REGEX.LINE_ITEM);
    if (!match) return null;

    let { descriptionAndStuff, area, remainder } = match.groups;
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
        // Remove only "PIR" suffix, leave others like "HD"
        rValue = rValueMatch[0].trim().replace(/\s*PIR\s*$/, '');
        description = description.replace(REGEX.R_VALUE, '').trim();
    }

    const colorMatch = description.match(REGEX.COLOR_HINT);
    if (colorMatch) {
        colorHint = colorMatch[1].trim();
        description = description.replace(colorMatch[0], '').trim();
    }

    const lineItem = {
        id: nanoid(),
        originalText: line,
        description: description.trim().replace(/-\s*$/, '').trim(),
        colorHint,
        rValue,
        isSupplyOnly,
        quantity: parseFloat(area),
        unit: 'm²',
        notes: [],
        location: currentGroup?.location || null,
        category: currentGroup?.category || null,
    };

    const additionalItems = [];
    if (remainder && remainder.trim()) {
        let notesContent = remainder.trim().replace(/^\s*[-—]\s*/, '');
        const dampCourseMatch = notesContent.match(REGEX.DAMP_COURSE);
        if (dampCourseMatch) {
            lineItem.notes.push(dampCourseMatch[0].trim());
            notesContent = notesContent.replace(dampCourseMatch[0], '').trim();
        }
        if (notesContent) {
            lineItem.notes.push(...splitNotes(notesContent));
        }
    }

    return { lineItem, additionalItems };
};

// --- MAIN PARSING ENGINE ---
const parseTextToWorksheet = (text) => {
    const lines = text.replace(/\u00A0/g, ' ').split('\n').filter(line => line.trim() !== '');
    const worksheet = { groups: [] };
    let currentGroup = null;
    let currentLineItem = null;
    let isExpectingAdditionalItems = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('-')) {
            const xpsPanel = parseXpsPanel(trimmedLine);
            if (xpsPanel && currentGroup) {
                currentLineItem = xpsPanel;
                currentGroup.lineItems.push(currentLineItem);
            } else {
                const parsed = parseLineItem(trimmedLine, currentGroup);
                if (parsed && currentGroup) {
                    currentLineItem = parsed.lineItem;
                    currentGroup.lineItems.push(currentLineItem);
                    if (parsed.additionalItems.length > 0) {
                        currentGroup.lineItems.push(...parsed.additionalItems);
                    }
                } else if (currentLineItem) {
                    currentLineItem.notes.push(trimmedLine.replace(/^-+/, '').trim());
                }
            }
        } else if ((REGEX.NOTE_INDENT_1.test(line) || REGEX.NOTE_INDENT_2.test(line)) && currentLineItem) {
            const noteContent = trimmedLine.replace(/^[ —]+/, '');
            currentLineItem.notes.push(...splitNotes(noteContent));
        } else {
            if (trimmedLine === "Additional Items:") {
                isExpectingAdditionalItems = true;
                continue;
            }

            const groupData = parseGroupHeader(trimmedLine);
            let finalGroupName = trimmedLine;
            if (isExpectingAdditionalItems) {
                finalGroupName = `Additional Items:\n${trimmedLine}`;
                isExpectingAdditionalItems = false;
            }

            currentGroup = {
                id: nanoid(),
                groupName: finalGroupName,
                unitNumber: groupData?.unitNumber || null,
                location: groupData?.location || trimmedLine,
                itemType: groupData?.itemType || null,
                category: groupData?.category || 'Other',
                lineItems: [],
            };
            worksheet.groups.push(currentGroup);
            currentLineItem = null;
        }
    }
    return worksheet;
};

// --- REACT COMPONENT ---
const PasteParser = ({ onParse }) => {
    const [text, setText] = React.useState('');

    const handleParse = () => {
        const rawWorksheetData = parseTextToWorksheet(text);
        onParse(rawWorksheetData);
    };

    return (
        <div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={20}
                style={{ width: '100%' }}
                placeholder="Paste your unformatted scope of works here..."
            />
            <button onClick={handleParse} style={{ marginTop: '10px' }}>
                Parse and Generate Quote
            </button>
        </div>
    );
};

export default PasteParser;
