// src/components/customers/CustomerModal.js
import React, { useState } from 'react';
import { X } from 'lucide-react';

const DEFAULT_PRICING_RULES = {
    materialMarkupPercentage: 25,
    supplyOnlyDiscount: 0,
    supplyInstallDiscount: 0,
    categoryPricing: []
};

const CustomerModal = ({ isOpen, customer, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        contactPerson: customer?.contactPerson || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        isBuilder: customer?.isBuilder || false,
        customPricing: customer?.customPricing || false,
        notes: customer?.notes || '',
        pricingRules: customer?.pricingRules || DEFAULT_PRICING_RULES
    });
    const [showPricingRules, setShowPricingRules] = useState(formData.customPricing);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));

        if (name === 'customPricing') {
            setShowPricingRules(checked);
            if (!checked) {
                setFormData(prev => ({ ...prev, pricingRules: DEFAULT_PRICING_RULES }));
            }
        }
    };

    const handlePricingRuleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            pricingRules: {
                ...prev.pricingRules,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {customer ? 'Edit Customer' : 'Add New Customer'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24}/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company/Customer Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>
                    <div className="flex space-x-6">
                        <div className="flex items-center">
                            <input type="checkbox" name="isBuilder" id="isBuilder" checked={formData.isBuilder} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                            <label htmlFor="isBuilder" className="ml-2 block text-sm text-gray-700">Is a Builder</label>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" name="customPricing" id="customPricing" checked={formData.customPricing} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                            <label htmlFor="customPricing" className="ml-2 block text-sm text-gray-700">Has Custom Pricing</label>
                        </div>
                    </div>
                    {showPricingRules && (
                        <div className="border p-4 rounded-lg bg-gray-50">
                            <h4 className="font-medium text-gray-700 mb-3">Custom Pricing Rules</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Markup %</label>
                                    <input type="number" name="materialMarkupPercentage" value={formData.pricingRules.materialMarkupPercentage} onChange={handlePricingRuleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supply Only Discount %</label>
                                    <input type="number" name="supplyOnlyDiscount" value={formData.pricingRules.supplyOnlyDiscount} onChange={handlePricingRuleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">S+I Discount %</label>
                                    <input type="number" name="supplyInstallDiscount" value={formData.pricingRules.supplyInstallDiscount} onChange={handlePricingRuleChange} className="w-full p-2 border rounded-md" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2 border rounded-md" rows="3"></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            {customer ? 'Update Customer' : 'Add Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;