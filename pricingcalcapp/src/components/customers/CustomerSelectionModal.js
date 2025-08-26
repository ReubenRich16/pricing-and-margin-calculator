// src/components/customers/CustomerSelectionModal.js
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const CustomerSelectionModal = ({ customers, onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) {
            return customers;
        }
        const term = searchTerm.toLowerCase();
        return (customers || []).filter(
            customer =>
                customer.name?.toLowerCase().includes(term) ||
                customer.contactPerson?.toLowerCase().includes(term) ||
                customer.email?.toLowerCase().includes(term)
        );
    }, [customers, searchTerm]);

    const handleSelect = (customer) => {
        onSelect(customer);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Select Customer</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full p-2 border rounded-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {customer.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.contactPerson}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.isBuilder && (
                                                <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Builder
                                                </span>
                                            )}
                                             {customer.customPricing && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Custom Pricing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleSelect(customer)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerSelectionModal;