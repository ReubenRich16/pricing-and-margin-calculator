// src/components/materials/MaterialModal.js
import React, { useState } from 'react';

const MaterialModal = ({ material, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        materialName: material?.materialName || '',
        supplier: material?.supplier || '',
        brand: material?.brand || '',
        category: material?.category || 'Uncategorized',
        rValue: material?.rValue || '',
        thickness: material?.thickness || '',
        length: material?.length || '',
        width: material?.width || '',
        coverage: material?.coverage || '',
        coverageUnit: material?.coverageUnit || 'm²',
        unitOfMeasure: material?.unitOfMeasure || 'bag',
        density: material?.density || '',
        costPrice: material?.costPrice || '',
        sCostUnit: material?.sCostUnit || '',
        s_i_timber: material?.s_i_timber || '',
        s_i_steel: material?.s_i_steel || '',
        retrofit_ceiling_rate: material?.retrofit_ceiling_rate || '',
        subfloor_rate: material?.subfloor_rate || '',
        retrofit_subfloor_rate: material?.retrofit_subfloor_rate || '',
        notes: material?.notes || '',
        keywords: Array.isArray(material?.keywords) ? material.keywords.join(', ') : (material?.keywords || ''),
    });

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const numericFields = ['thickness', 'length', 'width', 'coverage', 'density', 'costPrice', 'sCostUnit', 's_i_timber', 's_i_steel', 'retrofit_ceiling_rate', 'subfloor_rate', 'retrofit_subfloor_rate'];
        const processedData = { ...formData };
        numericFields.forEach(field => {
            processedData[field] = parseFloat(formData[field]) || 0;
        });
        processedData.keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);
        onSave(processedData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto pr-3">
                    <h3 className="text-xl font-semibold">{material ? 'Edit Material' : 'Add New Material'}</h3>
                    
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-medium px-2">Basic Information</legend>
                        <input name="materialName" value={formData.materialName} onChange={handleChange} placeholder="Product Name" className="w-full p-2 border rounded-md mb-2" required />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Supplier" className="w-full p-2 border rounded-md" />
                            <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" className="w-full p-2 border rounded-md" />
                            <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="w-full p-2 border rounded-md" />
                        </div>
                    </fieldset>

                     <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-medium px-2">Specifications</legend>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input name="rValue" value={formData.rValue} onChange={handleChange} placeholder="R-Value" className="w-full p-2 border rounded-md" />
                            <input name="thickness" value={formData.thickness} onChange={handleChange} type="number" step="any" placeholder="Thickness (mm)" className="w-full p-2 border rounded-md" />
                            <input name="width" value={formData.width} onChange={handleChange} type="number" step="any" placeholder="Width (mm)" className="w-full p-2 border rounded-md" />
                             <input name="length" value={formData.length} onChange={handleChange} type="number" step="any" placeholder="Length (mm)" className="w-full p-2 border rounded-md" />
                             <input name="density" value={formData.density} onChange={handleChange} type="number" step="any" placeholder="Density (kg/m³)" className="w-full p-2 border rounded-md" />
                        </div>
                    </fieldset>

                     <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-medium px-2">Units & Coverage</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input name="coverage" value={formData.coverage} onChange={handleChange} type="number" step="any" placeholder="Coverage Amount" className="w-full p-2 border rounded-md" />
                            <select name="coverageUnit" value={formData.coverageUnit} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                <option value="">Coverage Unit</option>
                                <option value="m²">m²</option>
                                <option value="LM">LM</option>
                                <option value="item">item</option>
                            </select>
                             <select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                <option value="">Sale Unit</option>
                                <option value="bag">bag</option>
                                <option value="roll">roll</option>
                                <option value="sheet">sheet</option>
                                <option value="item">item</option>
                            </select>
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-medium px-2">Pricing (ex. GST)</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="costPrice" value={formData.costPrice} onChange={handleChange} type="number" step="0.01" placeholder="Cost Price / Unit" className="w-full p-2 border rounded-md" required />
                            <input name="sCostUnit" value={formData.sCostUnit} onChange={handleChange} type="number" step="0.01" placeholder="Supply Price / Unit" className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                           <input name="s_i_timber" value={formData.s_i_timber} onChange={handleChange} type="number" step="0.01" placeholder="S+I Timber Price" className="w-full p-2 border rounded-md" />
                           <input name="s_i_steel" value={formData.s_i_steel} onChange={handleChange} type="number" step="0.01" placeholder="S+I Steel Price" className="w-full p-2 border rounded-md" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                           <input name="retrofit_ceiling_rate" value={formData.retrofit_ceiling_rate} onChange={handleChange} type="number" step="0.01" placeholder="Retrofit Ceiling Rate" className="w-full p-2 border rounded-md" />
                           <input name="subfloor_rate" value={formData.subfloor_rate} onChange={handleChange} type="number" step="0.01" placeholder="Subfloor Rate" className="w-full p-2 border rounded-md" />
                           <input name="retrofit_subfloor_rate" value={formData.retrofit_subfloor_rate} onChange={handleChange} type="number" step="0.01" placeholder="Retrofit Subfloor Rate" className="w-full p-2 border rounded-md" />
                        </div>
                    </fieldset>

                    <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" className="w-full p-2 border rounded-md" rows="2" />
                    <input name="keywords" value={formData.keywords} onChange={handleChange} placeholder="Keywords (comma-separated)" className="w-full p-2 border rounded-md" />
                    
                    <div className="pt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Material</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaterialModal;