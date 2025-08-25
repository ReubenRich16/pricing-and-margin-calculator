import React, { useState } from 'react';

/**
 * PasteParser
 * - Parses raw quote text into blocks, subgroups, and material lines.
 * - Autofills best material and labour matches, attaches suggestion arrays.
 * - Returns parsed structure via onParse callback.
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

    // --- Material matching: returns best match and shortlist array ---
    const getMaterialMatches = (desc, parsedRValue, area) => {
        let filteredMaterials = materials;
        if (brand) {
            filteredMaterials = filteredMaterials.filter(m => m.brand?.toLowerCase() === brand.toLowerCase());
        }
        if (parsedRValue) {
            filteredMaterials = filteredMaterials.filter(m => String(m.rValue) === String(parsedRValue));
        }
        if (area) {
            filteredMaterials = filteredMaterials.filter(m =>
                m.category?.toLowerCase().includes(area.toLowerCase()) ||
                m.materialName?.toLowerCase().includes(area.toLowerCase())
            );
        }
        // Score by fuzzy match
        const scored = filteredMaterials.map(mat => ({
            ...mat,
            score: levenshteinDistance(desc?.toLowerCase() || '', mat.materialName?.toLowerCase() || ''),
        }));
        scored.sort((a, b) => a.score - b.score);
        const bestMatch = scored.length && scored[0].score < (desc?.length || 10) / 1.5 ? scored[0] : null;
        const shortlist = scored.slice(0, 5).filter(m => m.score < (desc?.length || 10) / 1.2);
        return { bestMatch, materialSuggestions: shortlist.filter(m => bestMatch ? m.id !== bestMatch.id : true) };
    };

    // --- Labour matching: returns array of best matches and possible matches ---
    const getLabourMatches = (desc, area) => {
        // Score by keyword, area/application, fuzzy, etc.
        const matches = labourRates.filter(rate => {
            let found = false;
            if (rate.keywords && rate.keywords.some(k => desc.toLowerCase().includes(k))) found = true;
            if (rate.area && desc.toLowerCase().includes(rate.area.toLowerCase())) found = true;
            if (rate.application && area && area.toLowerCase().includes(rate.application.toLowerCase())) found = true;
            return found;
        });
        const allMatches = labourRates.filter(rate => !matches.includes(rate));
        return { bestMatches: matches, possibleLabourMatches: allMatches };
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
                // Use subgroup name or group name as area/application
                const area = currentSubgroup?.subgroupName || currentGroup?.groupName || '';
                // Material matching
                const { bestMatch, materialSuggestions } = getMaterialMatches(materialDescription, parsedRValue, area);
                // Labour matching
                const { bestMatches, possibleLabourMatches } = getLabourMatches(materialDescription, area);

                const lineItem = {
                    description: line,
                    quantity: quantity || '',
                    unit: unit,
                    materialId: bestMatch ? bestMatch.id : '',
                    materialName: bestMatch ? bestMatch.materialName : materialDescription,
                    rValue: parsedRValue || '',
                    width: width || '',
                    materialSuggestions: materialSuggestions.map(m => ({
                        id: m.id,
                        materialName: m.materialName,
                        rValue: m.rValue,
                        brand: m.brand,
                        supplier: m.supplier,
                    })),
                    labourApplications: bestMatches.map(labour => ({
                        id: labour.id,
                        area: labour.area,
                        application: labour.application,
                        defaultRate: labour.timberRate,
                        overrideRate: '', // to be set in UI
                        unit: labour.unit,
                    })),
                    possibleLabourMatches: possibleLabourMatches.map(labour => ({
                        id: labour.id,
                        area: labour.area,
                        application: labour.application,
                        defaultRate: labour.timberRate,
                        unit: labour.unit,
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
