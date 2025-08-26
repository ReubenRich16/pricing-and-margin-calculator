import React, { useState, useMemo } from 'react';
import { useCustomers } from '../contexts/CustomersContext';
import CustomerModal from '../components/customers/CustomerModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import FilterBar from '../components/common/FilterBar';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { filterBySearchTerm } from '../utils/filter';

const customerFilterConfig = [
  { key: 'search', type: 'text', placeholder: 'Filter by name or contact...' }
];

const CustomerManager = () => {
    const { customers = [], loading, error, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [filters, setFilters] = useState({ search: "" });

    const handleAddNew = () => {
        setCurrentCustomer(null);
        setIsModalOpen(true);
    };

    const handleEdit = (customer) => {
        setCurrentCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (customer) => {
        setCustomerToDelete(customer);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
        }
        setIsConfirmModalOpen(false);
        setCustomerToDelete(null);
    };
    
    const handleSave = (customerData) => {
        if (currentCustomer) {
            updateCustomer(currentCustomer.id, customerData);
        } else {
            addCustomer(customerData);
        }
        setIsModalOpen(false);
        setCurrentCustomer(null);
    };

    // Use centralized filter utility
    const filteredData = useMemo(() =>
        filterBySearchTerm(customers, filters.search, ['name', 'contactPerson', 'email', 'phone']),
        [customers, filters.search]
    );

    if (loading) return <div className="p-4">Loading customers...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading customers: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Customer Manager</h1>
                    <button
                        onClick={handleAddNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <PlusCircle size={20} />
                        Add New Customer
                    </button>
                </div>
                
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  filterConfig={customerFilterConfig}
                />

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Person</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tags</th>
                                <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="p-3 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-gray-500">{customer.contactPerson}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                                    <td className="p-3 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            {customer.isBuilder && (
                                                <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Builder</span>
                                            )}
                                            {customer.customPricing && (
                                                <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-200 rounded-full">Custom Pricing</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-center">
                                        <button onClick={() => handleEdit(customer)} className="text-blue-500 hover:text-blue-700 mr-4 transition-colors"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(customer)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <CustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} customer={currentCustomer} />}
            {isConfirmModalOpen && <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={confirmDelete} title="Confirm Deletion" message={`Are you sure you want to delete ${customerToDelete?.name}?`} />}
        </div>
    );
};

export default CustomerManager;