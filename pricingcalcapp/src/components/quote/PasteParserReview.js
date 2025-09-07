// src/components/quote/PasteParserReview.js
import React, { useState } from 'react';
import Select from 'react-select';
import { AlertTriangle } from 'lucide-react';

const bulkKeywordPriority = [
    { key: 'HD', score: 10, wallBoost: 15 },
    { key: 'HP', score: 9, wallBoost: 13 },
    { key: 'NB', score: 7, wallBoost: 10 },
    { key: 'SHP', score: 5, wallBoost: 7 }
];
const keywordList = [
    "Acoustic", "Wall", "VHP", "XPS", "Brane", "Panel", "Wrap", "Rigid", "Board", "Foam"
];
const panelKeywords = ["XPS", "PANEL", "RIGID", "BOARD", "FOAM"];
const dampcourseKeywords = ["DAMPCOURSE", "DAMP COURSE", "DAMPCOURSE 300", "DAMPCOURSE 380", "DAMPCOURSE 450"];

function formatRValue(rv) {
    if (!rv) return '';
    let val = String(rv).trim();
    if (val.toUpperCase().startsWith('R')) val = val.replace(/^R+/, '');
    return `R${val}`;
}

function normalizeRValue(val) {
    if (val == null) return null;
    let str = String(val).trim().toUpperCase();
    if (str.startsWith('R')) str = str.replace(/^R+/, '');
    return parseFloat(str);
}

function parseDimensionsFromDesc(desc) {
    const d = (desc || '').toUpperCase();
    const thicknessMatch = d.match(/(\d{2,4})\s?MM/);
    const panelMatch = d.match(/(\d{3,4})\s?[Xx]\s?(\d{2,4})\s?MM/);
    let thickness = null, width = null, length = null;
    if (thicknessMatch) thickness = parseInt(thicknessMatch[1], 10);
    if (panelMatch) {
        length = parseInt(panelMatch[1], 10);
        width = parseInt(panelMatch[2], 10);
    }
    return { thickness, width, length };
}

function getAvailableBrands(materials) {
    const brands = Array.from(new Set(materials.map(m => m.brand).filter(Boolean)));
    brands.sort();
    return brands;
}

function isPanelTypeItem(item) {
    const desc = (item.description || '').toUpperCase();
    return panelKeywords.some(k => desc.includes(k));
}

function isPanelTypeMaterial(material) {
    const name = (material.materialName || '').toUpperCase();
    const cat = (material.category || '').toUpperCase();
    return panelKeywords.some(k => name.includes(k) || cat.includes(k));
}

<<<<<<< Updated upstream
=======
// CHANGE: R-value scoring logic now prefers exact matches
>>>>>>> Stashed changes
function scoreMaterialForItem(material, item, selectedBulkBrand, brandOverride) {
    const isDampcourseLine = dampcourseKeywords.some(k => (item.description || '').toUpperCase().includes(k));
    const isDampcourseMat = dampcourseKeywords.some(k => (material.materialName || '').toUpperCase().includes(k));
    const isConsumable = material.category === "Consumables";
    const isBulk = material.category === "Bulk Insulation" || item.category === "Bulk Insulation";
    const isPanelItem = isPanelTypeItem(item);
    const isPanelMat = isPanelTypeMaterial(material);

    if (isPanelItem && !isPanelMat) return -100;
    if (isBulk && material.category !== "Bulk Insulation") return -100;
    if (!isBulk && !isPanelItem && !isDampcourseLine) {
        if (!material.category || !item.category || (material.category !== item.category && !isConsumable)) return -100;
    }

    let brandToUse = brandOverride !== undefined ? brandOverride : item.brand;
    if (isPanelItem) {
        brandToUse = '';
    } else if (!isBulk) {
        brandToUse = brandOverride || '';
    }
    if (isBulk) {
        if (brandToUse && material.brand && material.brand !== brandToUse) return -100;
        if (selectedBulkBrand && material.brand === selectedBulkBrand) return 8;
    }

    const matR = normalizeRValue(material.rValue);
    const itemR = normalizeRValue(item.rValue);

    // Exact and fuzzy R-value scoring
    let rValueScore = 0;
    if (itemR != null && matR != null) {
        if (matR === itemR) {
            rValueScore = 20;
        } else if (Math.abs(matR - itemR) <= 0.1) {
            rValueScore = 10;
        } else {
            // For Bulk, exclude mismatched R-value
            if (isBulk) return -100;
        }
    }

    // Panel/XPS: R-value is a bonus, not an exclusion if dimensions match
    let perfectDimensionMatch = false;
    let dimensionScore = 0;
    const { thickness: descThickness, width: descWidth, length: descLength } = parseDimensionsFromDesc(item.description || "");
    if (isPanelItem) {
        if (
            material.thickness && descThickness && Number(material.thickness) === descThickness &&
            material.width && descWidth && Number(material.width) === descWidth &&
            material.length && descLength && Number(material.length) === descLength
        ) {
            perfectDimensionMatch = true;
            dimensionScore += 20;
        } else {
            if (material.thickness && descThickness && Number(material.thickness) === descThickness) dimensionScore += 8;
            if (material.width && descWidth && Number(material.width) === descWidth) dimensionScore += 8;
            if (material.length && descLength && Number(material.length) === descLength) dimensionScore += 8;
        }
    } else {
        // Bulk: strict R-value match already handled above
        if (!matR && (descThickness || descWidth || descLength)) {
            let dimScore = 0;
            if (material.thickness && descThickness && Number(material.thickness) === descThickness) dimScore += 8;
            if (material.width && descWidth && Number(material.width) === descWidth) dimScore += 8;
            if (material.length && descLength && Number(material.length) === descLength) dimScore += 8;
            dimensionScore += dimScore;
        }
    }

    let score = 30 + rValueScore + dimensionScore;

    // Bulk Insulation: keyword priority (with WALL boost)
    let bulkKeywordRank = 99;
    if (isBulk) {
        const itemDesc = (item.description || '').toUpperCase();
        const matName = (material.materialName || '').toUpperCase();
        const keywordsArr = Array.isArray(material.keywords)
            ? material.keywords.map(k => k.toUpperCase())
            : String(material.keywords || '').toUpperCase().split(',').map(k => k.trim());

        let bestKeywordScore = 0;
        let bestKeywordRank = 99;
        let hasWallKeyword = itemDesc.includes("WALL") || matName.includes("WALL") || keywordsArr.includes("WALL");
        bulkKeywordPriority.forEach(({ key, score: kwScore, wallBoost, rank }) => {
            if (
                itemDesc.includes(key) ||
                matName.includes(key) ||
                keywordsArr.includes(key)
            ) {
                const thisScore = hasWallKeyword ? wallBoost : kwScore;
                if (thisScore > bestKeywordScore) {
                    bestKeywordScore = thisScore;
                    bestKeywordRank = rank;
                }
            }
        });
        bulkKeywordRank = bestKeywordRank;
        score += bestKeywordScore;

        keywordList.forEach(keyword => {
            if (
                itemDesc.includes(keyword) ||
                matName.includes(keyword) ||
                keywordsArr.includes(keyword)
            ) {
                score += 5;
            }
        });
    } else {
        const itemDesc = (item.description || '').toUpperCase();
        const matName = (material.materialName || '').toUpperCase();
        const keywordsArr = Array.isArray(material.keywords)
            ? material.keywords.map(k => k.toUpperCase())
            : String(material.keywords || '').toUpperCase().split(',').map(k => k.trim());
        keywordList.forEach(keyword => {
            if (
                itemDesc.includes(keyword) ||
                matName.includes(keyword) ||
                keywordsArr.includes(keyword)
            ) {
                score += 5;
            }
        });
    }

    const matKeywordsArr = Array.isArray(material.keywords)
        ? material.keywords.map(k => k.toUpperCase())
        : String(material.keywords || '').toUpperCase().split(',').map(k => k.trim());
    if (item.colorKeyword && matKeywordsArr.includes(item.colorKeyword?.toUpperCase())) score += 2;
    if (material.materialName && item.description && material.materialName.toLowerCase() === item.description.toLowerCase()) score += 2;

    if (isDampcourseLine && isDampcourseMat && material.width && descWidth && Number(material.width) === descWidth) score += 10;
    if (isDampcourseLine && isDampcourseMat) score += 15;

    const excludedNames = ['Staples', 'Strapping', 'Tape'];
    if (excludedNames.some(ex => (material.materialName || '').toUpperCase().includes(ex))) score -= 100;

    return { score, bulkKeywordRank, rValue: matR, thickness: material.thickness, materialName: material.materialName || '', perfectDimensionMatch, dimensionScore, rValueScore };
}

function getMaterialOptions(materials, item, selectedBulkBrand, brandOverride) {
    const isDampcourseLine = dampcourseKeywords.some(k => (item.description || '').toUpperCase().includes(k));
    let dampcourseMaterials = [];
    if (isDampcourseLine) {
        dampcourseMaterials = materials.filter(m =>
            (m.materialName || '').toUpperCase().includes('DAMPCOURSE')
        );
        if (dampcourseMaterials.length > 0) {
            return dampcourseMaterials
                .map(mat => ({
                    material: mat,
                    scoreObj: scoreMaterialForItem(mat, item, selectedBulkBrand, brandOverride)
                }))
                .sort((a, b) => b.scoreObj.score - a.scoreObj.score)
                .map(opt => ({
                    value: opt.material.id,
                    label: [
                        opt.material.materialName,
                        opt.material.brand ? `(${opt.material.brand})` : "",
                        formatRValue(opt.material.rValue),
                        opt.material.thickness ? `${opt.material.thickness}mm` : "",
                        opt.material.width ? `${opt.material.width}mm` : "",
                        opt.material.length ? `${opt.material.length}mm` : "",
                        opt.material.category ? `[${opt.material.category}]` : "",
                    ].filter(Boolean).join(" "),
                    searchable: [
                        opt.material.materialName,
                        opt.material.brand,
                        formatRValue(opt.material.rValue),
                        opt.material.thickness,
                        opt.material.width,
                        opt.material.length,
                        opt.material.category,
                        Array.isArray(opt.material.keywords) ? opt.material.keywords.join(' ') : opt.material.keywords
                    ].filter(Boolean).join(" ")
                }));
        }
    }

    const isPanelItem = isPanelTypeItem(item);
    let panelMaterials = [];
    if (isPanelItem) {
        panelMaterials = materials.filter(m => isPanelTypeMaterial(m));
        if (panelMaterials.length > 0) {
            return panelMaterials
                .map(mat => ({
                    material: mat,
                    scoreObj: scoreMaterialForItem(mat, item, selectedBulkBrand, brandOverride)
                }))
                .filter(opt => opt.scoreObj.score > -20)
                .sort((a, b) => {
<<<<<<< Updated upstream
=======
                    // CHANGE: R-value scoring exact > fuzzy > none
>>>>>>> Stashed changes
                    if (b.scoreObj.rValueScore !== a.scoreObj.rValueScore)
                        return b.scoreObj.rValueScore - a.scoreObj.rValueScore;
                    if (b.scoreObj.perfectDimensionMatch !== a.scoreObj.perfectDimensionMatch)
                        return b.scoreObj.perfectDimensionMatch ? 1 : -1;
                    if (b.scoreObj.dimensionScore !== a.scoreObj.dimensionScore)
                        return b.scoreObj.dimensionScore - a.scoreObj.dimensionScore;
                    if ((b.scoreObj.rValue || 0) !== (a.scoreObj.rValue || 0))
                        return (b.scoreObj.rValue || 0) - (a.scoreObj.rValue || 0);
                    return (a.scoreObj.materialName || '').localeCompare(b.scoreObj.materialName || '');
                })
                .map(opt => ({
                    value: opt.material.id,
                    label: [
                        opt.material.materialName,
                        opt.material.brand ? `(${opt.material.brand})` : "",
                        formatRValue(opt.material.rValue),
                        opt.material.thickness ? `${opt.material.thickness}mm` : "",
                        opt.material.width ? `${opt.material.width}mm` : "",
                        opt.material.length ? `${opt.material.length}mm` : "",
                        opt.material.category ? `[${opt.material.category}]` : "",
                    ].filter(Boolean).join(" "),
                    searchable: [
                        opt.material.materialName,
                        opt.material.brand,
                        formatRValue(opt.material.rValue),
                        opt.material.thickness,
                        opt.material.width,
                        opt.material.length,
                        opt.material.category,
                        Array.isArray(opt.material.keywords) ? opt.material.keywords.join(' ') : opt.material.keywords
                    ].filter(Boolean).join(" ")
                }));
        }
    }

    let shortlist = materials
        .map(mat => ({
            material: mat,
            scoreObj: scoreMaterialForItem(mat, item, selectedBulkBrand, brandOverride)
        }))
        .filter(opt => opt.scoreObj.score > -20);

    let hasStrictBrandMatch = shortlist.some(opt =>
        (brandOverride && opt.material.brand === brandOverride)
    );
    let warningMsg = '';
    if (brandOverride && !hasStrictBrandMatch && shortlist.length > 0) {
        warningMsg = `No materials found for brand "${brandOverride}". Showing closest alternatives below.`;
    }

    shortlist = shortlist
        .sort((a, b) => {
<<<<<<< Updated upstream
=======
            // CHANGE: R-value scoring exact > fuzzy > none
>>>>>>> Stashed changes
            if (b.scoreObj.rValueScore !== a.scoreObj.rValueScore)
                return b.scoreObj.rValueScore - a.scoreObj.rValueScore;
            if (b.scoreObj.score !== a.scoreObj.score) return b.scoreObj.score - a.scoreObj.score;
            if (item.category === "Bulk Insulation") {
                if (a.scoreObj.bulkKeywordRank !== b.scoreObj.bulkKeywordRank)
                    return a.scoreObj.bulkKeywordRank - b.scoreObj.bulkKeywordRank;
            }
            if ((b.scoreObj.rValue || 0) !== (a.scoreObj.rValue || 0))
                return (b.scoreObj.rValue || 0) - (a.scoreObj.rValue || 0);
            if ((b.scoreObj.thickness || 0) !== (a.scoreObj.thickness || 0))
                return (b.scoreObj.thickness || 0) - (a.scoreObj.thickness || 0);
            return (a.scoreObj.materialName || '').localeCompare(b.scoreObj.materialName || '');
        })
        .map(opt => ({
            value: opt.material.id,
            label: [
                opt.material.materialName,
                opt.material.brand ? `(${opt.material.brand})` : "",
                formatRValue(opt.material.rValue),
                opt.material.thickness ? `${opt.material.thickness}mm` : "",
                opt.material.width ? `${opt.material.width}mm` : "",
                opt.material.length ? `${opt.material.length}mm` : "",
                opt.material.category ? `[${opt.material.category}]` : "",
            ].filter(Boolean).join(" "),
            searchable: [
                opt.material.materialName,
                opt.material.brand,
                formatRValue(opt.material.rValue),
                opt.material.thickness,
                opt.material.width,
                opt.material.length,
                opt.material.category,
                Array.isArray(opt.material.keywords) ? opt.material.keywords.join(' ') : opt.material.keywords
            ].filter(Boolean).join(" "),
            warning: warningMsg
        }));

    return shortlist;
}

const PasteParserReview = ({
    materials,
    parsedGroups,
    unmatchedItems,
    setUnmatchedItems,
    setParsedGroups,
    onAssign,
    selectedBulkBrand = ""
}) => {
    const brands = getAvailableBrands(materials);
    const [brandOverrides, setBrandOverrides] = useState({});

    const handleMaterialAssign = (itemIdx, materialId) => {
        const item = unmatchedItems[itemIdx];
        const updatedItem = { ...item, materialId, unmatched: !materialId };
        const updatedGroups = parsedGroups.map(group => ({
            ...group,
            lineItems: (group.lineItems || []).map(li =>
                li === item ? updatedItem : li
            )
        }));
        setParsedGroups(updatedGroups);
        const updatedUnmatched = unmatchedItems.filter((_, idx) => idx !== itemIdx || !materialId);
        setUnmatchedItems(updatedUnmatched);
        if (onAssign) onAssign(updatedGroups);
    };

    const handleBrandOverrideChange = (itemIdx, newBrand) => {
        setBrandOverrides(prev => ({
            ...prev,
            [itemIdx]: newBrand
        }));
    };

    return (
        <div className="mt-8">
            <h4 className="text-lg font-semibold text-red-700 mb-4">Unmatched Items – Review & Assign</h4>
            <div className="space-y-6">
                {unmatchedItems.map((item, idx) => {
                    const brandOverride = brandOverrides[idx] !== undefined ? brandOverrides[idx] : item.brand;
                    const options = getMaterialOptions(materials, item, selectedBulkBrand, brandOverride);
                    const valueObj = options.find(opt => opt.value === item.materialId) || null;
                    const isBulk = item.category === "Bulk Insulation";
<<<<<<< Updated upstream
                    // Removed: const isPanelItem = isPanelTypeItem(item);
=======
                    const isPanelItem = isPanelTypeItem(item);
>>>>>>> Stashed changes

                    const warningMsg = options.length > 0 && options[0].warning ? options[0].warning : '';

                    return (
                        <div key={idx} className="relative bg-red-50 border-2 border-red-400 rounded-lg p-4 shadow flex flex-col gap-2">
                            <div className="absolute left-2 top-2">
                                <AlertTriangle className="text-red-500" size={22} aria-label="Unmatched item warning" />
                            </div>
                            <div className="pl-8 mb-1 text-base font-medium text-gray-900">
                                {item.description || <span className="italic text-gray-400">No description found</span>}
                            </div>
                            <div className="pl-8 mb-2 text-sm text-gray-600">
                                {item.rValue && <span>{formatRValue(item.rValue)} </span>}
                                {item.colorKeyword && <span>({item.colorKeyword}) </span>}
                                {item.brand && <span>Brand: {item.brand} </span>}
                                {item.thickness && <span>Thickness: {item.thickness}mm </span>}
                                {item.width && <span>Width: {item.width}mm </span>}
                                {item.length && <span>Length: {item.length}mm </span>}
                                {item.quantity && <span>Qty: {item.quantity} </span>}
                                {item.unit && <span>{item.unit} </span>}
                            </div>
                            <div className="pl-8 mb-2 flex items-center gap-3">
                                <label className="text-xs text-gray-500 mr-2 font-medium">Brand Override:</label>
                                <select
                                    value={brandOverride || ''}
                                    onChange={e => handleBrandOverrideChange(idx, e.target.value)}
                                    className="p-1 border rounded bg-white text-sm"
                                >
                                    <option value="">(Ignore Brand)</option>
                                    {brands.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                {!isBulk && (
                                    <span className="ml-2 text-xs italic text-gray-400">Ignored for non-bulk items</span>
                                )}
                            </div>
                            {warningMsg && (
                                <div className="pl-8 pb-2 text-xs text-yellow-700 font-semibold">{warningMsg}</div>
                            )}
                            <div className="pl-8">
                                <Select
                                    options={options}
                                    value={valueObj}
                                    onChange={selected => handleMaterialAssign(idx, selected ? selected.value : "")}
                                    placeholder="Search & assign material..."
                                    isClearable
                                    isSearchable
                                    noOptionsMessage={() =>
                                        options.length === 0
                                            ? "No materials found for this category/brand."
                                            : "No match found."
                                    }
                                    filterOption={(option, input) => {
                                        if (!input) return true;
                                        return option.label.toLowerCase().includes(input.toLowerCase()) ||
                                            option.searchable.toLowerCase().includes(input.toLowerCase());
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
                {unmatchedItems.length === 0 && (
                    <div className="text-center text-green-600 p-6 font-bold flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        All items matched!
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasteParserReview;