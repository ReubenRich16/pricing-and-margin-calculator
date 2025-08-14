import React, { useState } from 'react';

/**
 * PasteParser
 * 
 * Purpose:
 * - Paste raw quote text (blocks, subgroups, line items)
 * - Hierarchically parses blocks, subgroups/sections, material lines
 * - Matches material and possible multiple labour rates
 * - Returns parsed structure via onParse callback
 * 
 * Props:
 * - materials: array of material DB objects
 * - labourRates: array of labour DB objects
 * - onParse: function(parsedGroups) => void
 * - brand: string (optional, restricts material search)
 */
const PasteParser = ({ materials, labourRates, onParse, brand }) => {
    const [text, setText] = useState('');

    // --- Fuzzy matcher ---
    const levenshteinDistance = (a, b) => {
        if (!a || !b) return 100;
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
            }
        }
        return matrix[b.length][a.length];
    };

    // --- Material matching ---
    const findBestMaterialMatch = (searchText, parsedRValue) => {
        if (!searchText || !materials?.length) return null;
        let bestMatch = null;
        let minDistance = Infinity;
        let filteredMaterials = brand
            ? materials.filter(m => m.brand?.toLowerCase() === brand.toLowerCase())
            : materials;
        if (parsedRValue) {
            filteredMaterials = filteredMaterials.filter(m => String(m.rValue) === String(parsedRValue));
        }
        filteredMaterials.forEach(material => {
            const distance = levenshteinDistance(
                searchText.toLowerCase(),
                material.materialName.toLowerCase()
            );
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = material;
            }
        });
        return minDistance < searchText.length / 1.5 ? bestMatch : null;
    };

    // --- Labour matching: returns array of labour matches (could be more than one per item) ---
    const findBestLabourMatches = (desc) => {
        if (!desc || !labourRates?.length) return [];
        return labourRates.filter(rate => {
            if (rate.keywords && rate.keywords.some(k => desc.toLowerCase().includes(k))) return true;
            if (rate.area && desc.toLowerCase().includes(rate.area.toLowerCase())) return true;
            return false;
        });
    };

    // --- Parser ---
    const handleParse = () => {
        if (!text.trim()) return;
        const lines = text.split('\n');
        const newGroups = [];
        let currentGroup = null;
        let currentSubgroup = null;

        lines.forEach(rawLine => {
            const line = rawLine.trim();
            if (!line) return;

            // Block header ("Block 1: ...")
            const blockHeaderMatch = line.match(/^Block\s+\d+:/i);
            if (blockHeaderMatch) {
                currentGroup = { groupName: line, subgroups: [] };
                newGroups.push(currentGroup);
                currentSubgroup = null;
                return;
            }

            // Subgroup/section heading
            if (!line.startsWith('-') && !line.match(/\d+(m²|lm)/i) && line.length > 5) {
                currentSubgroup = { subgroupName: line, lineItems: [] };
                if (currentGroup) {
                    currentGroup.subgroups.push(currentSubgroup);
                } else {
                    currentGroup = { groupName: line, subgroups: [currentSubgroup] };
                    newGroups.push(currentGroup);
                }
                return;
            }

            // Material line
            const materialMatch = line.match(/^-?\s*(.+?)\s*(R\d+(\.\d+)?(HD|NB)?)?\s*–\s*(\d+(\.\d+)?)\s*(m²|lm)/i);
            if (materialMatch) {
                const materialDescription = materialMatch[1].trim();
                const parsedRValue = materialMatch[2] ? materialMatch[2].replace(/^R/, '') : null;
                const quantity = materialMatch[5];
                const unit = materialMatch[7];
                const widthMatch = materialDescription.match(/(\d{2,4})mm/);
                const width = widthMatch ? widthMatch[1] : null;
                const bestMaterial = findBestMaterialMatch(materialDescription, parsedRValue);
                const matchedLabours = findBestLabourMatches(materialDescription);

                const lineItem = {
                    description: line,
                    quantity: quantity || '',
                    unit: unit,
                    materialId: bestMaterial ? bestMaterial.id : '',
                    materialName: bestMaterial ? bestMaterial.materialName : materialDescription,
                    rValue: parsedRValue || '',
                    width: width || '',
                    labourApplications: matchedLabours.map(labour => ({
                        id: labour.id,
                        area: labour.area,
                        application: labour.application,
                        defaultRate: labour.timberRate,
                        overrideRate: '', // to be set in UI
                    })),
                    customerPrice: '',
                    priceIncludesGst: true
                };

                if (currentSubgroup) {
                    currentSubgroup.lineItems.push(lineItem);
                } else if (currentGroup) {
                    if (!currentGroup.lineItems) currentGroup.lineItems = [];
                    currentGroup.lineItems.push(lineItem);
                }
            }
        });

        onParse(newGroups);
        setText('');
    };

    return (
        <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Paste & Parse</h3>
            <p className="text-sm text-gray-500 mb-4">
                Paste your raw data below. The tool will automatically create blocks, subgroups, parse material lines, and attempt to match them to your database based on the selected brand.
            </p>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste your data here..."
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

export default PasteParser;