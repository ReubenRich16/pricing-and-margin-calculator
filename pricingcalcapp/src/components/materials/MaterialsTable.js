import React, { useState } from 'react';
import { Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { consumablesGroupRule } from '../../config/sortConfig';
import { getActiveColumns } from '../../utils/materialsGrouping';

// Utility for R-value formatting
const formatRValue = rv => (rv ? (String(rv).toUpperCase().startsWith('R') ? rv : `R${rv}`) : '');

const customColumnLabels = {
    retrofit_ceiling_rate: 'Retrofit Ceiling S+I',
    subfloor_rate: 'Subfloor S+I',
    retrofit_subfloor_rate: 'Retrofit Subfloor S+I',
};

// Table header renderer
const renderTableHeader = (cols, showCombinedSI) => (
    <tr>
        {cols.map(colKey => {
            if (colKey in customColumnLabels)
                return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">{customColumnLabels[colKey]}</th>;
            if (colKey === 'rValue')      return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">R-Value</th>;
            if (colKey === 'thickness')   return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Thickness</th>;
            if (colKey === 'density')     return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Density</th>;
            if (colKey === 'width')       return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Width</th>;
            if (colKey === 'coverage')    return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Coverage</th>;
            if (colKey === 'costPrice')   return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Cost/Unit</th>;
            if (colKey === 'sCostUnit')   return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">S Cost/Unit</th>;
            if (colKey === 's_i_combined')return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">S+I</th>;
            if (colKey === 's_i_timber' && !showCombinedSI)
                return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">S+I Timber</th>;
            if (colKey === 's_i_steel' && !showCombinedSI)
                return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">S+I Steel</th>;
            if (colKey === 'length')      return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Length</th>;
            if (colKey === 'keywords')    return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Keywords</th>;
            return null;
        })}
        <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
    </tr>
);

// Table row renderer for a material variant group
function MaterialVariantRow({
    variants, cols, showCombinedSI, onEdit, onDelete,
    groupKey, selectedIdx, setSelectedIdx
}) {
    // The currently selected variant (by width)
    const selected = variants[selectedIdx] || variants[0];

    return (
        <tr key={groupKey}>
            {cols.map(colKey => {
                const saleUnit = selected.unitOfMeasure || '';
                const covUnit = selected.coverageUnit || '';
                if (colKey === 'width' && variants.length > 1) {
                    return (
                        <td key={colKey} className="p-3 text-sm">
                            <select
                                value={selectedIdx}
                                onChange={e => setSelectedIdx(Number(e.target.value))}
                                className="border rounded px-2 py-1 bg-white text-sm"
                            >
                                {variants.map((item, idx) => (
                                    <option key={item.width || idx} value={idx}>{item.width ? `${item.width}mm` : ''}</option>
                                ))}
                            </select>
                            <span className="ml-1 text-xs text-gray-400">({variants.length} widths)</span>
                        </td>
                    );
                }
                if (colKey === 'width') {
                    return <td key={colKey} className="p-3 text-sm">{selected.width ? `${selected.width}mm` : ''}</td>;
                }
                if (colKey === 'retrofit_ceiling_rate')
                    return <td key={colKey} className="p-3 text-sm">{selected.retrofit_ceiling_rate ? `$${Number(selected.retrofit_ceiling_rate).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
                if (colKey === 'subfloor_rate')
                    return <td key={colKey} className="p-3 text-sm">{selected.subfloor_rate ? `$${Number(selected.subfloor_rate).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
                if (colKey === 'retrofit_subfloor_rate')
                    return <td key={colKey} className="p-3 text-sm">{selected.retrofit_subfloor_rate ? `$${Number(selected.retrofit_subfloor_rate).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
                if (colKey === 'rValue')      return <td key={colKey} className="p-3 text-sm">{selected.rValue ? formatRValue(selected.rValue) : ''}</td>;
                if (colKey === 'thickness')   return <td key={colKey} className="p-3 text-sm">{selected.thickness ? `${selected.thickness}mm` : ''}</td>;
                if (colKey === 'density')     return <td key={colKey} className="p-3 text-sm">{selected.density ? `${selected.density}kg/m³` : ''}</td>;
                if (colKey === 'coverage')    return <td key={colKey} className="p-3 text-sm">{selected.coverage ? `${selected.coverage} ${covUnit}${saleUnit ? `/${saleUnit}` : ''}` : ''}</td>;
                if (colKey === 'costPrice')   return <td key={colKey} className="p-3 text-sm text-red-600 font-medium">{selected.costPrice ? `$${Number(selected.costPrice).toFixed(2)}${saleUnit ? `/${saleUnit}` : ''}` : ''}</td>;
                if (colKey === 'sCostUnit')   return <td key={colKey} className="p-3 text-sm font-semibold">{selected.sCostUnit ? `$${Number(selected.sCostUnit).toFixed(2)}${saleUnit ? `/${saleUnit}` : ''}` : ''}</td>;
                if (colKey === 's_i_combined')return <td key={colKey} className="p-3 text-sm">{(selected.s_i_timber || selected.s_i_steel) ? `$${Number(selected.s_i_timber || selected.s_i_steel || 0).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
                if (colKey === 's_i_timber' && !showCombinedSI)
                    return <td key={colKey} className="p-3 text-sm">{selected.s_i_timber ? `$${Number(selected.s_i_timber).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
                if (colKey === 's_i_steel' && !showCombinedSI)
                    return <td key={colKey} className="p-3 text-sm">{selected.s_i_steel ? `$${Number(selected.s_i_steel).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
                if (colKey === 'length')      return <td key={colKey} className="p-3 text-sm">{selected.length ? `${selected.length}mm` : ''}</td>;
                if (colKey === 'keywords')    return <td key={colKey} className="p-3 text-sm">{Array.isArray(selected.keywords) ? selected.keywords.join(', ') : selected.keywords || ''}</td>;
                return null;
            })}
            <td className="p-3 text-center">
                <button onClick={() => onEdit(selected)} className="text-blue-500 mr-2"><Edit size={18} /></button>
                <button onClick={() => onDelete(selected)} className="text-red-500"><Trash2 size={18} /></button>
            </td>
        </tr>
    );
}

const MaterialsTable = ({
    groupedMaterials,
    collapsedCat,
    setCollapsedCat,
    collapsedBrand,
    setCollapsedBrand,
    collapsedSupplier,
    setCollapsedSupplier,
    collapsedProduct,
    setCollapsedProduct,
    showDetails,
    onEdit,
    onDelete
}) => {
    // --- State for width dropdowns per product group ---
    const [selectedWidthIdxByRow, setSelectedWidthIdxByRow] = useState({}); // key: groupKey, value: idx

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {Object.keys(groupedMaterials).map(category => (
                <div key={category}>
                    <button
                        onClick={() => setCollapsedCat(p => ({ ...p, [category]: !p[category] }))}
                        className="w-full flex justify-between items-center bg-gray-100 p-3 font-semibold text-left"
                    >
                        <span>{category}</span>
                        {collapsedCat[category] ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {!collapsedCat[category] && (
                        <div className="p-2">
                            {category === consumablesGroupRule.category
                                ? Object.keys(groupedMaterials[category]).map(supplier => {
                                    const supplierProducts = groupedMaterials[category][supplier];
                                    return (
                                        <div key={supplier} className="mb-6">
                                            <button
                                                onClick={() => setCollapsedBrand(p => ({ ...p, [`${category}|${supplier}`]: !p[`${category}|${supplier}`] }))}
                                                className="w-full flex justify-between items-center bg-gray-200 px-4 py-2 font-medium text-left rounded"
                                            >
                                                <span>{supplier}</span>
                                                {collapsedBrand[`${category}|${supplier}`] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            {!collapsedBrand[`${category}|${supplier}`] && Object.keys(supplierProducts).map(prodName => {
                                                let items = supplierProducts[prodName];
                                                if (!Array.isArray(items)) items = [];
                                                const { active: cols, showCombinedSI } = getActiveColumns(items, showDetails);
                                                return (
                                                    <div key={prodName} className="mb-3">
                                                        <div className="font-semibold px-3 py-2 text-gray-700">{prodName} ({items.length})</div>
                                                        <div className="overflow-x-auto border rounded-lg mt-2">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    {renderTableHeader(cols, showCombinedSI)}
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {items.map(m =>
                                                                        renderTableRow(m, cols, showCombinedSI, onEdit, onDelete)
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                                : Object.keys(groupedMaterials[category]).map(brand => {
                                    const brandSuppliers = groupedMaterials[category][brand];
                                    return (
                                        <div key={brand} className="mb-6">
                                            <button
                                                onClick={() => setCollapsedBrand(p => ({ ...p, [`${category}|${brand}`]: !p[`${category}|${brand}`] }))}
                                                className="w-full flex justify-between items-center bg-gray-200 px-4 py-2 font-medium text-left rounded"
                                            >
                                                <span>{brand}</span>
                                                {collapsedBrand[`${category}|${brand}`] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            {!collapsedBrand[`${category}|${brand}`] && Object.keys(brandSuppliers).map(supplier => {
                                                const supplierProducts = brandSuppliers[supplier];
                                                return (
                                                    <div key={supplier} className="mb-4">
                                                        <button
                                                            onClick={() => setCollapsedSupplier(p => ({ ...p, [`${category}|${brand}|${supplier}`]: !p[`${category}|${brand}|${supplier}`] }))}
                                                            className="w-full flex justify-between items-center bg-gray-100 px-4 py-2 font-medium text-left rounded"
                                                        >
                                                            <span>{supplier}</span>
                                                            {collapsedSupplier?.[`${category}|${brand}|${supplier}`] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                        {!collapsedSupplier?.[`${category}|${brand}|${supplier}`] && Object.keys(supplierProducts).map(prodName => {
                                                            let variantGroups = supplierProducts[prodName];
                                                            // If showDetails is ON, show all variants as separate rows
                                                            if (showDetails) {
                                                                const items = Array.isArray(variantGroups) ? variantGroups : [];
                                                                const { active: cols, showCombinedSI } = getActiveColumns(items, showDetails);
                                                                return (
                                                                    <div key={prodName} className="mb-3">
                                                                        <div className="font-semibold px-3 py-2 text-gray-700">{prodName} ({items.length})</div>
                                                                        <div className="overflow-x-auto border rounded-lg mt-2">
                                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                                <thead className="bg-gray-50">
                                                                                    {renderTableHeader(cols, showCombinedSI)}
                                                                                </thead>
                                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                                    {items.map(m =>
                                                                                        renderTableRow(m, cols, showCombinedSI, onEdit, onDelete)
                                                                                    )}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            // Otherwise, layered variant rows (one row per unique variant group, with width dropdown)
                                                            if (!Array.isArray(variantGroups)) return null;
                                                            const { active: cols, showCombinedSI } = getActiveColumns(variantGroups[0] || [], false);
                                                            return (
                                                                <div key={prodName} className="mb-3">
                                                                    <div className="font-semibold px-3 py-2 text-gray-700">{prodName}</div>
                                                                    <div className="overflow-x-auto rounded-lg">
                                                                        <table className="min-w-full divide-y divide-gray-200">
                                                                            <thead className="bg-gray-50">
                                                                                {renderTableHeader(cols, showCombinedSI)}
                                                                            </thead>
                                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                                {variantGroups.map((variants, rowIdx) => {
                                                                                    const groupKey = `${category}|${brand}|${supplier}|${prodName}|${rowIdx}`;
                                                                                    const selectedIdx = selectedWidthIdxByRow[groupKey] ?? 0;
                                                                                    return (
                                                                                        <MaterialVariantRow
                                                                                            key={groupKey}
                                                                                            variants={variants}
                                                                                            cols={cols}
                                                                                            showCombinedSI={showCombinedSI}
                                                                                            onEdit={onEdit}
                                                                                            onDelete={onDelete}
                                                                                            groupKey={groupKey}
                                                                                            selectedIdx={selectedIdx}
                                                                                            setSelectedIdx={idx => setSelectedWidthIdxByRow(prev => ({ ...prev, [groupKey]: idx }))}
                                                                                        />
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default MaterialsTable;