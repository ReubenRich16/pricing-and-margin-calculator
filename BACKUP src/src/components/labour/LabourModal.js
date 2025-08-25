import React, { useState } from 'react';

/**
 * LabourModal
 * 
 * Purpose:
 * - Modal for adding/editing a Labour Rate entry.
 * - Handles all relevant fields, including application category, description, rates, unit, keywords, and notes.
 * 
 * Props:
 * - rate (object): Existing rate for edit, or undefined/null for adding new.
 * - onSave (function): Callback to save the entry (receives processed form data).
 * - onClose (function): Callback to close/cancel the modal.
 */

const LabourModal = ({ rate, onSave, onClose }) => {
    // --- State: form data for all fields ---
    const [formData, setFormData] = useState({
        application: rate?.application || 'Bulk Insulation',
        area: rate?.area || '',
        timberRate: rate?.timberRate || '',
        steelRate: rate?.steelRate || '',
        unit: rate?.unit || 'm²',
        notes: rate?.notes || '',
        keywords: Array.isArray(rate?.keywords) ? rate.keywords.join(', ') : ''
    });

    // --- Change handler for all fields ---
    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // --- Submit handler: processes types and parses keywords ---
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            timberRate: parseFloat(formData.timberRate) || 0,
            steelRate: parseFloat(formData.steelRate) || 0,
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        });
    };

    // --- Labour application categories (for dropdown) ---
    const applicationCategories = [
        "Bulk Insulation",
        "Subfloor",
        "Retrofit Insulation",
        "Specialty Insulation",
        "Fire Protection",
        "Wall Wrap",
        "Acoustic Pipe Lag",
        "Rigid Panels/Soffit",
        "Labour Add Ons/Other"
    ];

    return (
        // Modal overlay: disables interaction with rest of app
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-4">{rate ? 'Edit Labour Rate' : 'Add New Labour Rate'}</h3>
                    <div className="space-y-4">
                        {/* Application category dropdown */}
                        <select name="application" value={formData.application} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                            {applicationCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {/* Area/Description input */}
                        <input name="area" value={formData.area} onChange={handleChange} placeholder="Area / Description" className="w-full p-2 border rounded-md" required />
                        {/* Timber Rate input */}
                        <input name="timberRate" value={formData.timberRate} onChange={handleChange} type="number" step="0.01" placeholder="Timber Frame Rate" className="w-full p-2 border rounded-md" />
                        {/* Steel Rate input */}
                        <input name="steelRate" value={formData.steelRate} onChange={handleChange} type="number" step="0.01" placeholder="Steel Frame Rate" className="w-full p-2 border rounded-md" />
                        {/* Unit dropdown */}
                        <select name="unit" value={formData.unit} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                            <option value="m²">m²</option>
                            <option value="lm">lm</option>
                            <option value="item">item</option>
                            <option value="Per level">Per level</option>
                            <option value="Dwelling">Dwelling</option>
                        </select>
                        {/* Keywords input */}
                        <input name="keywords" value={formData.keywords} onChange={handleChange} placeholder="Keywords (comma-separated)" className="w-full p-2 border rounded-md" />
                        {/* Notes textarea */}
                        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes / Conditions" className="w-full p-2 border rounded-md" rows="2" />
                    </div>
                    {/* Action buttons */}
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
