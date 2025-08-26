import {
  categoryOrder,
  brandOrder,
  productNameSortOrder,
  materialColumns,
  consumablesGroupRule
} from '../config/sortConfig';

// Technical columns to always show (never grouping columns)
const CORE_TECHNICAL_COLUMNS = [
  'rValue', 'thickness', 'width', 'coverage', 'costPrice',
  'sCostUnit', 's_i_timber', 's_i_steel',
  'density', 'length',
  'retrofit_ceiling_rate', 'subfloor_rate', 'retrofit_subfloor_rate'
];

// Helper: get strictly ordered, non-empty columns for product group
export function getActiveColumns(items, showDetails) {
    if (!Array.isArray(items)) items = [];

    // Remove grouping columns always
    let orderedKeys = materialColumns.map(col => col.key)
        .filter(key =>
            !['notes', 'keywords', 'supplier', 'brand', 'materialName', 'category'].includes(key)
        );

    // Details mode: show all technical columns in config, plus any present in the data
    if (showDetails) {
        // Always show core technical columns, plus any others present for at least one item
        let active = [...CORE_TECHNICAL_COLUMNS];
        orderedKeys.forEach(key => {
            if (!active.includes(key)) {
                const hasValue = items.some(i =>
                    i[key] !== undefined &&
                    String(i[key]).trim() !== '' &&
                    i[key] !== 0
                );
                if (hasValue) active.push(key);
            }
        });
        // Always force costPrice to be present
        if (!active.includes('costPrice')) active.push('costPrice');

        // S+I logic: show combined if both values are identical in all rows
        const timberVals = items.map(i => Number(i.s_i_timber || 0));
        const steelVals = items.map(i => Number(i.s_i_steel || 0));
        const hasTimber = timberVals.some(v => v > 0);
        const hasSteel = steelVals.some(v => v > 0);
        let showCombinedSI = false;
        if (hasTimber && hasSteel) {
            const allSame = items.every(i =>
                Number(i.s_i_timber || 0) === Number(i.s_i_steel || 0)
            );
            if (allSame) {
                const filtered = active.filter(key => key !== 's_i_timber' && key !== 's_i_steel');
                filtered.push('s_i_combined');
                return { active: filtered, showCombinedSI: true };
            }
        }
        return { active, showCombinedSI };
    }

    // Compact mode: only show columns with at least one non-empty value in the group, plus costPrice
    let compactKeys = orderedKeys.filter(key =>
        items.some(i =>
            i[key] !== undefined &&
            String(i[key]).trim() !== '' &&
            i[key] !== 0
        )
    );
    // Always force costPrice to be present
    if (!compactKeys.includes('costPrice')) compactKeys.push('costPrice');

    // S+I logic: show combined if both values are identical in all rows
    const timberVals = items.map(i => Number(i.s_i_timber || 0));
    const steelVals = items.map(i => Number(i.s_i_steel || 0));
    const hasTimber = timberVals.some(v => v > 0);
    const hasSteel = steelVals.some(v => v > 0);
    let showCombinedSI = false;
    if (hasTimber && hasSteel) {
        const allSame = items.every(i =>
            Number(i.s_i_timber || 0) === Number(i.s_i_steel || 0)
        );
        if (allSame) {
            const filtered = compactKeys.filter(key => key !== 's_i_timber' && key !== 's_i_steel');
            filtered.push('s_i_combined');
            return { active: filtered, showCombinedSI: true };
        }
    }
    return { active: compactKeys, showCombinedSI };
}

// Helper: convert R-value to number reliably
function parseRValue(val) {
    if (val == null) return NaN;
    let str = String(val).trim().toUpperCase();
    if (str.startsWith('R')) str = str.replace(/^R+/i, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Sorting helper
export function sortProducts(products = []) {
    return [...products].sort((a, b) => {
        // R-value descending
        const rA = parseRValue(a.rValue);
        const rB = parseRValue(b.rValue);
        if (rA !== rB) return rB - rA;

        // Thickness descending
        const thicknessA = parseFloat(a.thickness) || 0;
        const thicknessB = parseFloat(b.thickness) || 0;
        if (thicknessA !== thicknessB) return thicknessB - thicknessA;

        // Width descending
        const widthA = parseFloat(a.width) || 0;
        const widthB = parseFloat(b.width) || 0;
        if (widthA !== widthB) return widthB - widthA;

        // Density descending
        const densityA = parseFloat(a.density) || 0;
        const densityB = parseFloat(b.density) || 0;
        if (densityA !== densityB) return densityB - densityA;

        // Product name sort order
        const idxA = productNameSortOrder.indexOf(a.materialName);
        const idxB = productNameSortOrder.indexOf(b.materialName);
        if (idxA !== -1 && idxB !== -1 && idxA !== idxB) return idxA - idxB;

        // Finally, by materialName
        return (a.materialName || '').localeCompare(b.materialName || '');
    });
}

// --- Main grouping logic ---
// Standard: category > brand > supplier > productName > variants (grouped by all except width)
export function groupMaterials(filteredMaterials, showDetails = false) {
    // 1. Group by category
    const cats = {};
    filteredMaterials.forEach(mat => {
        const category = mat.category || 'Uncategorized';
        if (!cats[category]) cats[category] = [];
        cats[category].push(mat);
    });

    // 2. Category order
    const orderedCats = categoryOrder.filter(cat => cats[cat]);
    const extraCats = Object.keys(cats).filter(cat => !orderedCats.includes(cat));
    const allCats = [...orderedCats, ...extraCats];

    // 3. Deep grouping structure
    const result = {};
    allCats.forEach(cat => {
        const products = cats[cat];
        if (cat === consumablesGroupRule.category) {
            // Consumables: category > supplier > productName
            const supplierGroups = {};
            products.forEach(mat => {
                const supplier = mat.supplier || 'Unspecified';
                if (!supplierGroups[supplier]) supplierGroups[supplier] = {};
                const prodName = mat.materialName || 'Unnamed';
                if (!supplierGroups[supplier][prodName]) supplierGroups[supplier][prodName] = [];
                supplierGroups[supplier][prodName].push(mat);
            });
            const supplierOrder = Object.keys(supplierGroups).sort();
            result[cat] = {};
            supplierOrder.forEach(supplier => {
                const prodNameGroups = supplierGroups[supplier];
                const prodOrder = productNameSortOrder.filter(pn => prodNameGroups[pn]);
                const prodExtra = Object.keys(prodNameGroups).filter(pn => !prodOrder.includes(pn));
                const prodNames = [...prodOrder, ...prodExtra.sort()];
                result[cat][supplier] = {};
                prodNames.forEach(prodName => {
                    result[cat][supplier][prodName] = sortProducts(prodNameGroups[prodName]);
                });
            });
        } else {
            // Standard: category > brand > supplier > productName
            const brandGroups = {};
            products.forEach(mat => {
                const brand = mat.brand || 'Unbranded';
                if (!brandGroups[brand]) brandGroups[brand] = {};
                const supplier = mat.supplier || 'Unspecified';
                if (!brandGroups[brand][supplier]) brandGroups[brand][supplier] = {};
                const prodName = mat.materialName || 'Unnamed';
                if (!brandGroups[brand][supplier][prodName]) brandGroups[brand][supplier][prodName] = [];
                brandGroups[brand][supplier][prodName].push(mat);
            });
            const brandOrderStrict = brandOrder.filter(b => brandGroups[b]);
            const brandExtra = Object.keys(brandGroups).filter(b => !brandOrderStrict.includes(b));
            const allBrands = [...brandOrderStrict, ...brandExtra.sort()];
            result[cat] = {};
            allBrands.forEach(brand => {
                const supplierGroups = brandGroups[brand];
                const supplierOrder = Object.keys(supplierGroups).sort();
                result[cat][brand] = {};
                supplierOrder.forEach(supplier => {
                    const prodNameGroups = supplierGroups[supplier];
                    const prodOrder = productNameSortOrder.filter(pn => prodNameGroups[pn]);
                    const prodExtra = Object.keys(prodNameGroups).filter(pn => !prodOrder.includes(pn));
                    const prodNames = [...prodOrder, ...prodExtra.sort()];
                    result[cat][brand][supplier] = {};
                    prodNames.forEach(prodName => {
                        const items = sortProducts(prodNameGroups[prodName]);

                        // --- Layer: group variants by all except width ---
                        if (!showDetails) {
                            // Group variants by [rValue, thickness, density, s_i_timber, s_i_steel, brand, supplier, category]
                            const variantGroups = {};
                            items.forEach(item => {
                                const key = [
                                    item.rValue || "",
                                    item.thickness || "",
                                    item.density || "",
                                    item.s_i_timber || "",
                                    item.s_i_steel || "",
                                    item.brand || "",
                                    item.supplier || "",
                                    item.category || "",
                                    // product name intentionally excluded!
                                ].join('|');
                                if (!variantGroups[key]) variantGroups[key] = [];
                                variantGroups[key].push(item);
                            });
                            // For each group, keep variants (different widths)
                            result[cat][brand][supplier][prodName] = Object.values(variantGroups).map(variants => variants);
                        } else {
                            // Show all variants as rows
                            result[cat][brand][supplier][prodName] = items;
                        }
                    });
                });
            });
        }
    });

    return result;
}