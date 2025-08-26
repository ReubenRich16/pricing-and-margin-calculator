// src/components/quote/PasteParserInput.js
import React, { useState, useMemo } from 'react';

// --- Constants and helpers ---
const BULK_INSULATION_BRANDS = ["Ecowool", "Earthwool", "Polyester"];
const MATERIAL_KEYWORDS = [
    'batts', 'batt', 'panel', 'panels', 'xps', 'wrap', 'brane', 'floor', 'wall', 'ceiling',
    'garage', 'damp course', 'dampcourse', 'flashing'
];

const GRADE_KEYWORDS = ['hd', 'nb', 'shd'];
const PHRASE_KEYWORDS = [
    'wall batt', 'ceiling batt', 'bulk insulation', 'supply only',
    'wall wrap', 'rigid panel', 'subfloor', 'retrofit'
];

// --- Normalize string for keyword extraction ---
function normalize(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s]+/g, ' ') // remove punctuation except word chars/space
        .replace(/\s{2,}/g, ' ')
        .trim();
}

// --- Extract keywords from description (phrase + word level) ---
function extractKeywords(description) {
    const lowered = normalize(description);
    let keywords = [];

    // Extract R-value and grade (HD/NB/SHD)
    const rMatch = lowered.match(/r\s?(\d+(\.\d+)?)(hd|nb|shd)?/i);
    if (rMatch) {
        keywords.push(`r${rMatch[1]}${rMatch[3] || ''}`);
        if (rMatch[3]) keywords.push(rMatch[3]);
    }

    // Extract color keyword
    const colorMatch = description.match(/\((marked\s+[a-z ]+)\)/i);
    if (colorMatch) {
        keywords.push(colorMatch[1].replace(/marked\s+/i, '').trim());
    }

    // Extract supply only
    if (/supply\s*only/i.test(description)) {
        keywords.push('supply only');
    }

    // Phrase-level extraction
    PHRASE_KEYWORDS.forEach(phrase => {
        if (lowered.includes(phrase)) keywords.push(phrase);
    });

    // Split into words, remove duplicates
    keywords = keywords.concat(
        lowered.split(/\s+/).filter(w => w && !keywords.includes(w))
    );

    // Remove duplicates
    return Array.from(new Set(keywords));
}

// --- Prefer HD/NB/SHD for wall batts ---
function preferHDGrade(keywords) {
    if (keywords.includes('wall') && keywords.includes('batt')) {
        return keywords.filter(k => GRADE_KEYWORDS.includes(k));
    }
    return [];
}

// --- Parsing regexes ---
const lineItemRegex = /^(.+?)\s*(?:\((MARKED [A-Z ]+)\))?\s*(?:R\s?([\d.]+)(HD|NB|SHD)?)?\s*[–—-]\s*([\d.]+)\s*(m²|LM|item|panel|panels)?/i;
const panelItemRegex = /^(\d+)\s*panels? of\s*([\d.]+)mm\s*XPS\s*\(([\d.xX]+)\)\s*(R[\d.]+)?\s*[–—-]\s*([\d.]+)\s*(m²|LM|item|panel|panels)?/i;
const dampcourseRegex = /(damp\s?course|dampcourse|flashing).*?(\d{2,4}MM)?\s*\(?([\d.]+)\s*(LM|m²|item)\)?/i;

// --- Material line detection ---
function isLikelyMaterialLine(line) {
    const lower = line.toLowerCase();
    return MATERIAL_KEYWORDS.some(k => lower.includes(k));
}
function isDampcourseLine(line) {
    return /(damp\s?course|dampcourse|flashing)/i.test(line)
        && /(\d{2,4}MM)?.*?([\d.]+)\s*(LM|m²|item)/i.test(line);
}
function extractColorKeyword(description) {
    const colorMatch = description.match(/\(MARKED ([A-Z ]+)\)/i);
    return colorMatch ? colorMatch[1].trim() : null;
}
function detectSupplyOnly(line, trailingLines = []) {
    if (/supply\s*only/i.test(line)) return true;
    if (trailingLines.some(l => /supply\s*only/i.test(l))) return true;
    return false;
}

// --- Parse a material line (returns lineItem object) ---
function parseItemLine(line, trailingLines = []) {
    // Dampcourse/flashing
    if (isDampcourseLine(line)) {
        const match = line.match(dampcourseRegex);
        if (match) {
            const [, desc, size, qty, unit] = match;
            return {
                description: (desc + (size ? ` ${size}` : '')).trim(),
                colorKeyword: '',
                rValue: '',
                grade: '',
                quantity: parseFloat(qty) || 0,
                unit: unit || 'LM',
                supplyOnly: detectSupplyOnly(line, trailingLines),
                category: 'Dampcourse',
                keywords: extractKeywords(line),
                unmatched: true
            };
        }
    }
    // Panels/XPS
    const panelMatch = line.match(panelItemRegex);
    if (panelMatch) {
        const [, qtyPanels, thickness, dims, rValue, qty, unit] = panelMatch;
        return {
            description: `${qtyPanels} panels of ${thickness}mm XPS (${dims}) ${rValue || ''}`.trim(),
            colorKeyword: '',
            rValue: rValue ? rValue.replace(/^R/, '') : '',
            grade: '',
            quantity: parseFloat(qty) || 0,
            unit: unit || 'm²',
            supplyOnly: detectSupplyOnly(line, trailingLines),
            category: 'Panels',
            keywords: extractKeywords(line),
            unmatched: true
        };
    }
    // General material line regex
    const match = line.match(lineItemRegex);
    if (match) {
        const [, description, markedColor, rValueRaw, grade, qty, unit] = match;
        const colorKeyword = markedColor ? markedColor.replace(/^MARKED /i, '') : extractColorKeyword(description);
        const rValue = rValueRaw ? rValueRaw : '';
        return {
            description: description.trim(),
            colorKeyword,
            rValue,
            grade: grade || '',
            quantity: parseFloat(qty) || 0,
            unit: unit || 'm²',
            supplyOnly: detectSupplyOnly(line, trailingLines),
            category: isLikelyMaterialLine(description) ? undefined : '',
            keywords: extractKeywords(description),
            unmatched: true
        };
    }
    return null;
}

// --- Group header detection ---
function isGroupHeader(line) {
    if (/^\[.*\]$/.test(line.trim())) return true;
    if (/^\(.*\)$/.test(line.trim())) return true;
    if (
        !isLikelyMaterialLine(line) &&
        !line.startsWith('-') &&
        !line.startsWith('•') &&
        !/^\s+/.test(line) &&
        !/supply\s*only/i.test(line)
    ) return true;
    return false;
}

// --- Main PasteParserInput component ---
const PasteParserInput = ({ materials, onParse }) => {
    const [text, setText] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');

    const isBulkInsulationQuote = useMemo(() => {
        return text.split('\n').some(line =>
            /bulk insulation|batt|batts/i.test(line)
        );
    }, [text]);

    const handleParse = () => {
        if (!text.trim()) return;
        const linesRaw = text.split('\n');
        const groups = [];
        let currentGroup = null;
        let trailingLines = [];
        let lastItemIdx = null;

        // eslint-disable-next-line no-loop-func
        let i = 0;
        while (i < linesRaw.length) {
            let line = linesRaw[i].trim();
            if (!line) { i++; continue; }

            // Multi-line group header
            if (isGroupHeader(line)) {
                let groupName = line;
                let nextIdx = i + 1;
                // Combine consecutive group headers
                while (
                    nextIdx < linesRaw.length &&
                    isGroupHeader(linesRaw[nextIdx].trim())
                ) {
                    groupName += ' / ' + linesRaw[nextIdx].trim();
                    nextIdx++;
                }
                // Normalize bracketed/parenthesis headers
                if (/^\[.*\]$/.test(groupName)) {
                    groupName = groupName.replace(/^\[(.*)\]$/, '$1').trim();
                } else if (/^\(.*\)$/.test(groupName)) {
                    groupName = groupName.replace(/^\((.*)\)$/, '$1').trim();
                }
                // Only push previous group if it has items
                if (
                    currentGroup &&
                    Array.isArray(currentGroup.lineItems) &&
                    currentGroup.lineItems.length > 0
                ) {
                    groups.push({ ...currentGroup, lineItems: currentGroup.lineItems });
                }
                // Always initialize new group with an empty lineItems array
                currentGroup = {
                    groupName,
                    lineItems: [],
                    supplyOnly: false
                };
                lastItemIdx = null;
                trailingLines = [];
                i = nextIdx;
                continue;
            }

            // Material line or sub-line
            const cleanedLine = line.replace(/^[-•]\s*/, '').trim();

            // If supply only note (not a material line)
            if (!isLikelyMaterialLine(cleanedLine) && /supply\s*only/i.test(cleanedLine)) {
                if (currentGroup && lastItemIdx != null && currentGroup.lineItems[lastItemIdx]) {
                    currentGroup.lineItems[lastItemIdx].supplyOnly = true;
                } else if (currentGroup) {
                    currentGroup.supplyOnly = true;
                }
                i++;
                continue;
            }

            // Material line (incl. dampcourse/flashing)
            if (isLikelyMaterialLine(cleanedLine) || isDampcourseLine(cleanedLine)) {
                // Multi-item line support (e.g., wall wrap + damp course)
                let mainLine = cleanedLine;
                let subLines = [];
                if (cleanedLine.includes(' - ')) {
                    const splitLines = cleanedLine.split(' - ');
                    mainLine = splitLines[0];
                    subLines = splitLines.slice(1);
                }
                // Parse main line
                const itemObj = parseItemLine(mainLine, [...trailingLines, ...subLines]);
                if (itemObj) {
                    itemObj.brand = isBulkInsulationQuote ? selectedBrand : undefined;
                    itemObj.category = /batt/i.test(itemObj.description) ? 'Bulk Insulation'
                        : /brane/i.test(itemObj.description) ? 'Wall Wrap'
                        : /panel|xps/i.test(itemObj.description) ? 'Panels'
                        : /damp\s?course|dampcourse|flashing/i.test(itemObj.description) ? 'Dampcourse'
                        : '';
                    const preferredGrades = preferHDGrade(itemObj.keywords);
                    itemObj.preferredGrades = preferredGrades;
                    // Only add to a valid group
                    if (currentGroup && Array.isArray(currentGroup.lineItems)) {
                        currentGroup.lineItems.push(itemObj);
                        lastItemIdx = currentGroup.lineItems.length - 1;
                        // Sub-lines: dampcourse/etc as separate items
                        subLines.forEach(sl => {
                            if (isDampcourseLine(sl)) {
                                const subItem = parseItemLine(sl, []);
                                if (subItem) {
                                    subItem.brand = itemObj.brand;
                                    subItem.category = 'Dampcourse';
                                    currentGroup.lineItems.push(subItem);
                                    lastItemIdx = currentGroup.lineItems.length - 1;
                                }
                            }
                        });
                        trailingLines = [];
                    }
                }
            } else {
                // Sub-line or note for previous item
                trailingLines.push(cleanedLine);
            }
            i++;
        }

        // Final push for last group (only if non-empty)
        if (
            currentGroup &&
            Array.isArray(currentGroup.lineItems) &&
            currentGroup.lineItems.length > 0
        ) {
            groups.push({ ...currentGroup, lineItems: currentGroup.lineItems });
        }

        // Filter out null/empty groups before passing to UI
        const finalGroups = groups.filter(
            g => g && Array.isArray(g.lineItems) && g.lineItems.length > 0
        );

        // Defensive: fallback to empty array if nothing parsed
        onParse(Array.isArray(finalGroups) ? finalGroups : []);
        setText('');
    };

    return (
        <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Paste & Parse Quote</h3>
            <p className="text-sm text-gray-500 mb-4">
                Paste raw data from a quote. The tool will automatically create groups and parse material lines.<br />
                <span className="font-semibold">
                    For Bulk Insulation, select brand for optimal matching. Unmatched items will be flagged for review below.
                </span>
            </p>
            {isBulkInsulationQuote && (
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Bulk Insulation Brand:
                    </label>
                    <select
                        value={selectedBrand}
                        onChange={e => setSelectedBrand(e.target.value)}
                        className="w-48 p-2 border rounded-md bg-white"
                    >
                        <option value="">Any Brand</option>
                        {BULK_INSULATION_BRANDS.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            )}
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste raw quote data here..."
                className="w-full p-2 border rounded-md h-40 font-mono text-sm"
            />
            <div className="text-right mt-2">
                <button
                    onClick={handleParse}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Parse Data
                </button>
            </div>
        </div>
    );
};

export default PasteParserInput;