// src/components/materials/MaterialsTable.js
import React from 'react';
import { Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { consumablesGroupRule } from '../../config/sortConfig';
import { getActiveColumns } from '../../utils/materialsGrouping';

// Helper: Map column key to header label for extended S+I columns
const customColumnLabels = {
    retrofit_ceiling_rate: 'Retrofit Ceiling S+I',
    subfloor_rate: 'Subfloor S+I',
    retrofit_subfloor_rate: 'Retrofit Subfloor S+I',
};

// Helper for table header rendering
const renderTableHeader = (cols, showCombinedSI, items) => (
    <tr>
        {cols.map(colKey => {
            if (colKey in customColumnLabels)
                return <th key={colKey} className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">{customColumnLabels[colKey]}</th>;
            // ...rest of headers unchanged...
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

// Helper for table row rendering
const renderTableRow = (m, cols, showCombinedSI, onEdit, onDelete) => (
    <tr key={m.id}>
        {cols.map(colKey => {
            const saleUnit = m.unit || m.unitOfMeasure || '';
            const covUnit = m.coverageUnit || '';
            // --- Handle new S+I columns ---
            if (colKey === 'retrofit_ceiling_rate')
                return <td key={colKey} className="p-3 text-sm">{m.retrofit_ceiling_rate ? `$${Number(m.retrofit_ceiling_rate).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
            if (colKey === 'subfloor_rate')
                return <td key={colKey} className="p-3 text-sm">{m.subfloor_rate ? `$${Number(m.subfloor_rate).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
            if (colKey === 'retrofit_subfloor_rate')
                return <td key={colKey} className="p-3 text-sm">{m.retrofit_subfloor_rate ? `$${Number(m.retrofit_subfloor_rate).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
            // ...rest of row rendering unchanged...
            if (colKey === 'rValue')      return <td key={colKey} className="p-3 text-sm">{m.rValue ? `R${String(m.rValue).replace(/^R/, '')}` : ''}</td>;
            if (colKey === 'thickness')   return <td key={colKey} className="p-3 text-sm">{m.thickness ? `${m.thickness}mm` : ''}</td>;
            if (colKey === 'density')     return <td key={colKey} className="p-3 text-sm">{m.density ? `${m.density}kg/m³` : ''}</td>;
            if (colKey === 'width')       return <td key={colKey} className="p-3 text-sm">{m.width ? `${m.width}mm` : ''}</td>;
            if (colKey === 'coverage')    return <td key={colKey} className="p-3 text-sm">{m.coverage ? `${m.coverage} ${covUnit}${saleUnit ? `/${saleUnit}` : ''}` : ''}</td>;
            if (colKey === 'costPrice')   return <td key={colKey} className="p-3 text-sm text-red-600 font-medium">{m.costPrice ? `$${Number(m.costPrice).toFixed(2)}${saleUnit ? `/${saleUnit}` : ''}` : ''}</td>;
            if (colKey === 'sCostUnit')   return <td key={colKey} className="p-3 text-sm font-semibold">{m.sCostUnit ? `$${Number(m.sCostUnit).toFixed(2)}${saleUnit ? `/${saleUnit}` : ''}` : ''}</td>;
            if (colKey === 's_i_combined')return <td key={colKey} className="p-3 text-sm">{(m.s_i_timber || m.s_i_steel) ? `$${Number(m.s_i_timber || m.s_i_steel || 0).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
            if (colKey === 's_i_timber' && !showCombinedSI)
                return <td key={colKey} className="p-3 text-sm">{m.s_i_timber ? `$${Number(m.s_i_timber).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
            if (colKey === 's_i_steel' && !showCombinedSI)
                return <td key={colKey} className="p-3 text-sm">{m.s_i_steel ? `$${Number(m.s_i_steel).toFixed(2)}${covUnit ? `/${covUnit}` : ''}` : ''}</td>;
            if (colKey === 'length')      return <td key={colKey} className="p-3 text-sm">{m.length ? `${m.length}mm` : ''}</td>;
            if (colKey === 'keywords')    return <td key={colKey} className="p-3 text-sm">{Array.isArray(m.keywords) ? m.keywords.join(', ') : m.keywords || ''}</td>;
            return null;
        })}
        <td className="p-3 text-center">
            <button onClick={() => onEdit(m)} className="text-blue-500 mr-2"><Edit size={18} /></button>
            <button onClick={() => onDelete(m)} className="text-red-500"><Trash2 size={18} /></button>
        </td>
    </tr>
);

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
                                    const totalSupplierItems = Object.values(supplierProducts).reduce((sum, prodGroup) => sum + (Array.isArray(prodGroup) ? prodGroup.length : 0), 0);
                                    return (
                                        <div key={supplier} className="mb-6">
                                            <button
                                                onClick={() => setCollapsedBrand(p => ({ ...p, [`${category}|${supplier}`]: !p[`${category}|${supplier}`] }))}
                                                className="w-full flex justify-between items-center bg-gray-200 px-4 py-2 font-medium text-left rounded"
                                            >
                                                <span>{supplier} ({totalSupplierItems})</span>
                                                {collapsedBrand[`${category}|${supplier}`] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            {!collapsedBrand[`${category}|${supplier}`] && Object.keys(supplierProducts).map(prodName => {
                                                let items = supplierProducts[prodName];
                                                if (!Array.isArray(items)) items = [];
                                                const showCollapsible = items.length >= 3;
                                                const { active: cols, showCombinedSI } = getActiveColumns(items, showDetails);

                                                return (
                                                    <div key={prodName} className="mb-3">
                                                        {showCollapsible ? (
                                                            <button
                                                                onClick={() => setCollapsedProduct(p => ({
                                                                    ...p,
                                                                    [`${category}|${supplier}|${prodName}`]: !p[`${category}|${supplier}|${prodName}`]
                                                                }))}
                                                                className="w-full flex justify-between items-center bg-gray-50 px-3 py-2 text-gray-700 rounded"
                                                            >
                                                                <span>{prodName} ({items.length})</span>
                                                                {collapsedProduct[`${category}|${supplier}|${prodName}`] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                        ) : (
                                                            <div className="font-semibold px-3 py-2 text-gray-700">{prodName} ({items.length})</div>
                                                        )}
                                                        {(showCollapsible ? !collapsedProduct[`${category}|${supplier}|${prodName}`] : true) && (
                                                            <div className="overflow-x-auto border rounded-lg mt-2">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-50">
                                                                        {renderTableHeader(cols, showCombinedSI, items)}
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {items.map(m =>
                                                                            renderTableRow(m, cols, showCombinedSI, onEdit, onDelete)
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                                : Object.keys(groupedMaterials[category]).map(brand => {
                                    const brandSuppliers = groupedMaterials[category][brand];
                                    const totalBrandItems = Object.values(brandSuppliers).reduce(
                                        (sum, supplierGroup) => sum + Object.values(supplierGroup).reduce(
                                            (ssum, prodArr) => ssum + (Array.isArray(prodArr) ? prodArr.length : 0), 0
                                        ), 0
                                    );
                                    return (
                                        <div key={brand} className="mb-6">
                                            <button
                                                onClick={() => setCollapsedBrand(p => ({ ...p, [`${category}|${brand}`]: !p[`${category}|${brand}`] }))}
                                                className="w-full flex justify-between items-center bg-gray-200 px-4 py-2 font-medium text-left rounded"
                                            >
                                                <span>{brand} ({totalBrandItems})</span>
                                                {collapsedBrand[`${category}|${brand}`] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                            {!collapsedBrand[`${category}|${brand}`] && Object.keys(brandSuppliers).map(supplier => {
                                                const supplierProducts = brandSuppliers[supplier];
                                                const totalSupplierItems = Object.values(supplierProducts).reduce((sum, prodGroup) => sum + (Array.isArray(prodGroup) ? prodGroup.length : 0), 0);
                                                return (
                                                    <div key={supplier} className="mb-4">
                                                        <button
                                                            onClick={() => setCollapsedSupplier(p => ({ ...p, [`${category}|${brand}|${supplier}`]: !p[`${category}|${brand}|${supplier}`] }))}
                                                            className="w-full flex justify-between items-center bg-gray-100 px-4 py-2 font-medium text-left rounded"
                                                        >
                                                            <span>{supplier} ({totalSupplierItems})</span>
                                                            {collapsedSupplier?.[`${category}|${brand}|${supplier}`] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                        {!collapsedSupplier?.[`${category}|${brand}|${supplier}`] && Object.keys(supplierProducts).map(prodName => {
                                                            let items = supplierProducts[prodName];
                                                            if (!Array.isArray(items)) items = [];
                                                            const showCollapsible = items.length >= 3;
                                                            const { active: cols, showCombinedSI } = getActiveColumns(items, showDetails);

                                                            return (
                                                                <div key={prodName} className="mb-3">
                                                                    {showCollapsible ? (
                                                                        <button
                                                                            onClick={() => setCollapsedProduct(p => ({
                                                                                ...p,
                                                                                [`${category}|${brand}|${supplier}|${prodName}`]: !p[`${category}|${brand}|${supplier}|${prodName}`]
                                                                            }))}
                                                                            className="w-full flex justify-between items-center bg-gray-50 px-3 py-2 text-gray-700 rounded"
                                                                        >
                                                                            <span>{prodName} ({items.length})</span>
                                                                            {collapsedProduct[`${category}|${brand}|${supplier}|${prodName}`] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                                        </button>
                                                                    ) : (
                                                                        <div className="font-semibold px-3 py-2 text-gray-700">{prodName} ({items.length})</div>
                                                                    )}
                                                                    {(showCollapsible ? !collapsedProduct[`${category}|${brand}|${supplier}|${prodName}`] : true) && (
                                                                        <div className="overflow-x-auto border rounded-lg mt-2">
                                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                                <thead className="bg-gray-50">
                                                                                    {renderTableHeader(cols, showCombinedSI, items)}
                                                                                </thead>
                                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                                    {items.map(m =>
                                                                                        renderTableRow(m, cols, showCombinedSI, onEdit, onDelete)
                                                                                    )}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
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