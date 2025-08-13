import React, { useState } from 'react';

const MaterialModal = ({ material, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        materialName: material?.materialName || '',
        supplier: material?.supplier || '',
        brand: material?.brand || '',
        rValue: material?.rValue || '',
        thickness: material?.thickness || '',
        costPrice: material?.costPrice || '',
        unitOfMeasure: material?.unitOfMeasure || 'bag'
    });

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            costPrice: parseFloat(formData.costPrice) || 0
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-4">{material ? 'Edit Material' : 'Add New Material'}</h3>
                    <div className="space-y-4">
                        <input name="materialName" value={formData.materialName} onChange={handleChange} placeholder="Material Name" className="w-full p-2 border rounded-md" required />
                        <input name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Supplier" className="w-full p-2 border rounded-md" />
                        <select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                            <option value="bag">bag</option>
                            <option value="roll">roll</option>
                            <option value="m²">m²</option>
                            <option value="sheet">sheet</option>
                            <option value="item">item</option>
                        </select>
                        <input name="costPrice" value={formData.costPrice} onChange={handleChange} type="number" step="0.01" placeholder="Cost Price (ex. GST)" className="w-full p-2 border rounded-md" required />
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MaterialModal;