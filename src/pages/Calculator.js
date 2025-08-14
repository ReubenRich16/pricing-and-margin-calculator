// --- Pricing Calculator Page ---
// Now supports customer selection and custom pricing integration.

import React, { useState, useEffect, useMemo } from 'react';
import { db, appId } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, X, Copy, Users } from 'lucide-react';
import PasteParser from '../components/quote/PasteParser';
import XeroSummaryModal from '../components/quote/XeroSummaryModal';
import QuoteSummary from '../components/quote/QuoteSummary';
import { calculateTotals } from '../utils/calculateTotals';

const worksheetsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'worksheets');
const materialsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'materials');
const labourRatesCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'labourRates');
const customersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');

// --- Line Item & WorksheetGroup subcomponents are unchanged (see previous code) ---

const Calculator = ({ worksheet, onBack }) => {
    const [worksheetData, setWorksheetData] = useState({
        worksheetName: '',
        customerName: '',
        customerId: '',
        status: 'Draft',
        marginPercentage: 25,
        groups: [],
    });
    const [materials, setMaterials] = useState([]);
    const [labourRates, setLabourRates] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isXeroModalOpen, setIsXeroModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [errorsByGroup, setErrorsByGroup] = useState({});

    // --- Firestore fetches ---
    useEffect(() => {
        const unsubMaterials = onSnapshot(materialsCollectionRef, (snap) => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        const unsubLabour = onSnapshot(labourRatesCollectionRef, (snap) => setLabourRates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        const unsubCustomers = onSnapshot(customersCollectionRef, (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        return () => { unsubMaterials(); unsubLabour(); unsubCustomers(); };
    }, []);

    // --- Worksheet Data load ---
    useEffect(() => {
        if (worksheet) {
            setWorksheetData({
                ...worksheet,
                groups: worksheet.groups || []
            });
        } else {
            setWorksheetData({
                worksheetName: '',
                customerName: '',
                customerId: '',
                status: 'Draft',
                marginPercentage: 25,
                groups: [],
            });
        }
    }, [worksheet]);

    // --- Input Validation (unchanged) ---
    useEffect(() => {
        const errorsByGroupTemp = {};
        (worksheetData.groups || []).forEach((group, gIdx) => {
            if (!group.lineItems) return;
            errorsByGroupTemp[gIdx] = {};
            group.lineItems.forEach((item, lIdx) => {
                const errors = {};
                if (!item.materialId) {
                    errors.materialId = 'Please select a material.';
                }
                if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
                    errors.quantity = 'Quantity must be greater than zero.';
                }
                errorsByGroupTemp[gIdx][lIdx] = errors;
            });
        });
        setErrorsByGroup(errorsByGroupTemp);
    }, [worksheetData]);

    // --- Find selected customer ---
    const selectedCustomer = useMemo(() =>
        customers.find(c => c.id === worksheetData.customerId),
        [customers, worksheetData.customerId]
    );

    // --- Calculation Engine ---
    const calculations = useMemo(() =>
        calculateTotals(worksheetData, materials, labourRates, selectedCustomer),
        [worksheetData, materials, labourRates, selectedCustomer]
    );

    // --- Form Handlers ---
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setWorksheetData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    // --- Customer Selection ---
    const handleCustomerSelect = (customer) => {
        setWorksheetData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
            marginPercentage: customer.customPricing
                ? customer.pricingRules?.materialMarkupPercentage ?? prev.marginPercentage
                : prev.marginPercentage
        }));
        setIsCustomerModalOpen(false);
    };

    const CustomerSelectionModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Select Customer</h3>
                    <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full p-2 border rounded-md"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.map(customer => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {customer.name}
                                        {customer.isBuilder && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Builder
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.contactPerson}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.customPricing ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Custom ({customer.pricingRules?.materialMarkupPercentage ?? 25}% markup)
                                            </span>
                                        ) : 'Standard'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleCustomerSelect(customer)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Select
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    // --- Worksheet CRUD and group handlers are unchanged (see previous code) ---

    // --- Worksheet Save Handler ---
    const handleSave = async () => {
        let hasErrors = false;
        Object.values(errorsByGroup).forEach(groupErrors => {
            Object.values(groupErrors).forEach(lineErrors => {
                if (lineErrors.materialId || lineErrors.quantity) {
                    hasErrors = true;
                }
            });
        });
        if (hasErrors) {
            alert('Please fix all material and quantity errors before saving.');
            return;
        }
        const dataToSave = {
            ...worksheetData,
            summary: calculations,
            customerId: worksheetData.customerId,
            customerName: worksheetData.customerName,
            updatedAt: serverTimestamp(),
        };
        if (worksheetData.id) {
            const docRef = doc(worksheetsCollectionRef, worksheetData.id);
            await updateDoc(docRef, dataToSave);
        } else {
            dataToSave.createdAt = serverTimestamp();
            await addDoc(worksheetsCollectionRef, dataToSave);
        }
        onBack();
    };

    // --- Main Render ---
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">{worksheet?.id ? 'Edit Worksheet' : 'New Quote Worksheet'}</h2>
                        <button onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">Back to Dashboard</button>
                    </div>
                    <PasteParser
                        materials={materials}
                        labourRates={labourRates}
                        onParse={handleParsedGroups}
                        brand=""
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200 pb-6">
                        <div>
                            <label htmlFor="worksheetName" className="block text-sm font-medium text-gray-700">Worksheet Name / Address</label>
                            <input type="text" name="worksheetName" id="worksheetName" value={worksheetData.worksheetName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 123 Example St" />
                        </div>
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    name="customerName"
                                    id="customerName"
                                    value={worksheetData.customerName}
                                    onChange={handleInputChange}
                                    className="flex-grow px-3 py-2 bg-white border border-r-0 border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="e.g., John Smith"
                                    readOnly={!!worksheetData.customerId}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsCustomerModalOpen(true)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                                >
                                    <Users size={16} className="mr-1" />
                                    {worksheetData.customerId ? 'Change' : 'Select'}
                                </button>
                            </div>
                            {selectedCustomer?.customPricing && (
                                <p className="mt-1 text-xs text-green-600">
                                    Using custom pricing rules for this customer
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="marginPercentage" className="block text-sm font-medium text-gray-700">Target Margin (%)</label>
                            <input type="number" name="marginPercentage" id="marginPercentage" value={worksheetData.marginPercentage} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                    </div>
                    {/* Quote Groups */}
                    <div className="space-y-4">
                        {(worksheetData.groups || []).map((group, index) => (
                            <WorksheetGroup
                                key={group.groupId || index}
                                group={group}
                                groupIndex={index}
                                onGroupChange={handleGroupChange}
                                onRemoveGroup={removeGroup}
                                onAddLineItem={addLineItem}
                                onRemoveLineItem={removeLineItem}
                                onLineItemChange={handleLineItemChange}
                                materials={materials}
                                errorsByLine={errorsByGroup[index] || {}}
                            />
                        ))}
                    </div>
                    <button onClick={addGroup} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2">
                        <Plus size={16} className="mr-1"/>Add Quote Group
                    </button>
                </div>
                <div className="lg:col-span-1 lg:sticky top-24 bg-white p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Live Calculations</h3>
                    <QuoteSummary calculations={calculations} />
                    <div className="flex flex-col space-y-3 pt-4 border-t">
                        <button onClick={handleSave} className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-semibold">
                            {worksheetData.id ? 'Update Worksheet' : 'Save Worksheet'}
                        </button>
                        <button onClick={() => setIsXeroModalOpen(true)} className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-semibold flex items-center justify-center">
                            <Copy size={16} className="mr-2"/>Finalize for Xero
                        </button>
                    </div>
                </div>
            </div>
            {isCustomerModalOpen && <CustomerSelectionModal />}
            {isXeroModalOpen && (
                <XeroSummaryModal worksheetData={worksheetData} calculations={calculations} onClose={() => setIsXeroModalOpen(false)} />
            )}
        </>
    );
};

export default Calculator;
