// src/components/labour/LabourModal.js
import React, { useState } from 'react';

const LabourModal = ({ rate, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        application: rate?.application || 'Bulk Insulation',
        description: rate?.description || '',
        timberRate: rate?.timberRate || '',
        steelRate: rate?.steelRate || '',
        unit: rate?.unit || 'm²',
        notes: rate?.notes || '',
        keywords: Array.isArray(rate?.keywords) ? rate.keywords.join(', ') : ''
    });

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            timberRate: parseFloat(formData.timberRate) || 0,
            steelRate: parseFloat(formData.steelRate) || 0,
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        });
    };

    const applicationCategories = [
        "Bulk Insulation", "Subfloor", "Retrofit Insulation", "Specialty Insulation",
        "Fire Protection", "Wall Wrap", "Acoustic Pipe Lag", "Rigid Panels/Soffit",
        "Labour Add Ons/Other"
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-4">{rate ? 'Edit Labour Rate' : 'Add New Labour Rate'}</h3>
                    <div className="space-y-4">
                        <select name="application" value={formData.application} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                            {applicationCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <input name="description" value={formData.description} onChange={handleChange} placeholder="Description (e.g., Ceiling Insulation)" className="w-full p-2 border rounded-md" required />
                        <input name="timberRate" value={formData.timberRate} onChange={handleChange} type="number" step="0.01" placeholder="Timber Frame Rate" className="w-full p-2 border rounded-md" />
                        <input name="steelRate" value={formData.steelRate} onChange={handleChange} type="number" step="0.01" placeholder="Steel Frame Rate" className="w-full p-2 border rounded-md" />
                        <select name="unit" value={formData.unit} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                            <option value="m²">m²</option>
                            <option value="lm">lm</option>
                            <option value="item">item</option>
                            <option value="Per level">Per level</option>
                            <option value="Dwelling">Dwelling</option>
                        </select>
                        <input name="keywords" value={formData.keywords} onChange={handleChange} placeholder="Keywords (comma-separated)" className="w-full p-2 border rounded-md" />
                        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes / Conditions" className="w-full p-2 border rounded-md" rows="2" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Rate</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabourModal;