// AU localisation: “Initializing” -> “Initialising”
import React from 'react';
import { useCustomers } from '../contexts/CustomersContext';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CustomerModal from '../components/customers/CustomerModal';

const CustomerManagerUI = () => {
    const {
        filteredCustomers,
        isModalOpen,
        editingCustomer,
        customerToDelete,
        searchTerm,
        isLoading,
        setIsModalOpen,
        setCustomerToDelete,
        setSearchTerm,
        handleSave,
        handleDelete,
        openAddModal,
        openEditModal,
    } = useCustomers();

    if (isLoading) {
        return <div className="text-center p-8 text-gray-500">Initialising Customer Database...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Customer Database</h2>
                <button
                    onClick={openAddModal}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    <Plus size={18} className="mr-2" /> Add Customer
                </button>
            </div>
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search customers..."
                    className="pl-10 w-full p-2 border rounded-md"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing Type</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {customer.name}
                                    {customer.isBuilder && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Builder
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.contactPerson}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.customPricing ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Custom Pricing
                                        </span>
                                    ) : (
                                        "Standard"
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(customer)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => setCustomerToDelete(customer)} className="text-red-600 hover:text-red-900">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No customers found matching your search criteria.
                    </div>
                )}
            </div>
            {isModalOpen && (
                <CustomerModal
                    customer={editingCustomer}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            {customerToDelete && (
                <ConfirmationModal
                    title="Delete Customer"
                    message={`Are you sure you want to delete "${customerToDelete.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setCustomerToDelete(null)}
                />
            )}
        </div>
    );
};

const CustomerManager = () => (
    <CustomerManagerUI />
);

export default CustomerManager;