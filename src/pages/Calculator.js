// src/pages/Calculator.js
import React, { useState, useEffect, useMemo } from 'react';
import { useMaterials } from '../contexts/MaterialsContext';
import { useLabour } from '../contexts/LabourContext';
import { useCustomers } from '../contexts/CustomersContext';
import { getWorksheetsCollection } from '../firebase';
import { addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Copy, Users } from 'lucide-react';
import PasteParser from '../components/quote/PasteParser';
import XeroSummaryModal from '../components/quote/XeroSummaryModal';
import QuoteSummary from '../components/quote/QuoteSummary';
import { calculateTotals } from '../utils/calculateTotals';
import CustomerSelectionModal from '../components/customers/CustomerSelectionModal';

const Calculator = ({ worksheet, onBack }) => {
    const { materials, loading: materialsLoading } = useMaterials();
    const { labourRates, loading: labourLoading } = useLabour();
    const { customers, loading: customersLoading } = useCustomers();

    const [worksheetData, setWorksheetData] = useState({
        worksheetName: '', customerName: '', customerId: '',
        status: 'Draft', marginPercentage: 25, groups: [],
    });
    const [worksheetsCollectionRef, setWorksheetsCollectionRef] = useState(null);
    const [isXeroModalOpen, setIsXeroModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [errorsByGroup, setErrorsByGroup] = useState({});

    useEffect(() => {
        setWorksheetsCollectionRef(getWorksheetsCollection());
    }, []);

    useEffect(() => {
        if (worksheet) {
            setWorksheetData({ ...worksheet, groups: worksheet.groups || [] });
        } else {
            setWorksheetData({
                worksheetName: '', customerName: '', customerId: '',
                status: 'Draft', marginPercentage: 25, groups: [],
            });
        }
    }, [worksheet]);

    useEffect(() => {
        const errorsByGroupTemp = {};
        (worksheetData.groups || []).forEach((group, gIdx) => {
            if (!group.lineItems) return;
            errorsByGroupTemp[gIdx] = {};
            group.lineItems.forEach((item, lIdx) => {
                const errors = {};
                if (!item.materialId) errors.materialId = 'Please select a material.';
                if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0)
                    errors.quantity = 'Quantity must be greater than zero.';
                errorsByGroupTemp[gIdx][lIdx] = errors;
            });
        });
        setErrorsByGroup(errorsByGroupTemp);
    }, [worksheetData]);

    const selectedCustomer = useMemo(() =>
        customers.find(c => c.id === worksheetData.customerId),
        [customers, worksheetData.customerId]
    );

    const calculations = useMemo(() =>
        calculateTotals(worksheetData, materials, labourRates, selectedCustomer),
        [worksheetData, materials, labourRates, selectedCustomer]
    );

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setWorksheetData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleCustomerSelect = (customer) => {
        setWorksheetData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
            marginPercentage: customer.customPricing
                ? customer.pricingRules?.materialMarkupPercentage ?? prev.marginPercentage
                : prev.marginPercentage
        }));
    };

    const addGroup = () => {
        setWorksheetData(prev => ({
            ...prev,
            groups: [...(prev.groups || []), {
                groupId: Date.now().toString(),
                groupName: '',
                lineItems: [],
                labourItems: []
            }]
        }));
    };

    const removeGroup = (groupIndex) => {
        setWorksheetData(prev => ({
            ...prev,
            groups: prev.groups.filter((_, idx) => idx !== groupIndex)
        }));
    };

    const handleGroupChange = (groupIndex, groupData) => {
        setWorksheetData(prev => ({
            ...prev,
            groups: prev.groups.map((group, idx) => idx === groupIndex ? { ...group, ...groupData } : group)
        }));
    };

    const addLineItem = (groupIndex) => {
        setWorksheetData(prev => ({
            ...prev,
            groups: prev.groups.map((group, idx) =>
                idx === groupIndex
                    ? { ...group, lineItems: [...(group.lineItems || []), { materialId: '', materialName: '', quantity: 1 }] }
                    : group
            )
        }));
    };

    const removeLineItem = (groupIndex, lineIndex) => {
        setWorksheetData(prev => ({
            ...prev,
            groups: prev.groups.map((group, idx) =>
                idx === groupIndex
                    ? { ...group, lineItems: group.lineItems.filter((_, lIdx) => lIdx !== lineIndex) }
                    : group
            )
        }));
    };

    const handleLineItemChange = (groupIndex, lineIndex, itemData) => {
        setWorksheetData(prev => ({
            ...prev,
            groups: prev.groups.map((group, idx) =>
                idx === groupIndex
                    ? {
                        ...group,
                        lineItems: group.lineItems.map((item, lIdx) =>
                            lIdx === lineIndex ? { ...item, ...itemData } : item
                        )
                    }
                    : group
            )
        }));
    };

    const handleParsedGroups = (parsedGroups) => {
        setWorksheetData(prev => ({
            ...prev,
            groups: parsedGroups.map(group => ({
                groupId: Date.now().toString() + Math.random().toString(36).slice(2, 7),
                groupName: group.groupName,
                lineItems: group.subgroups
                    ? group.subgroups.flatMap(sg => sg.lineItems || [])
                    : group.lineItems || [],
                labourItems: []
            }))
        }));
    };

    const handleSave = async () => {
        if (!worksheetsCollectionRef) return;
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

    const WorksheetGroup = ({
        group, groupIndex, onGroupChange, onRemoveGroup,
        onAddLineItem, onRemoveLineItem, onLineItemChange,
        materials, errorsByLine
    }) => (
        <div className="border rounded-md p-4 mb-4 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <input
                    type="text"
                    value={group.groupName}
                    onChange={e => onGroupChange(groupIndex, { groupName: e.target.value })}
                    className="text-lg font-semibold border-b w-2/3 bg-transparent"
                    placeholder="Group Name / Section"
                />
                <button onClick={() => onRemoveGroup(groupIndex)} className="text-red-600 hover:text-red-800 ml-4">
                    <Trash2 size={18} />
                </button>
            </div>
            <div className="space-y-3">
                {(group.lineItems || []).map((item, lineIndex) => (
                    <div key={lineIndex} className="flex items-center space-x-2">
                        <select
                            value={item.materialId}
                            onChange={e => {
                                const selectedMat = materials.find(m => m.id === e.target.value);
                                onLineItemChange(groupIndex, lineIndex, {
                                    materialId: e.target.value,
                                    materialName: selectedMat ? selectedMat.materialName : ''
                                });
                            }}
                            className={`w-1/3 p-2 border rounded-md bg-white ${errorsByLine[lineIndex]?.materialId ? 'border-red-500' : ''}`}
                        >
                            <option value="">Select Material</option>
                            {materials.map(mat => (
                                <option key={mat.id} value={mat.id}>{mat.materialName}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => onLineItemChange(groupIndex, lineIndex, { quantity: parseFloat(e.target.value) || 1 })}
                            className={`w-20 p-2 border rounded-md ${errorsByLine[lineIndex]?.quantity ? 'border-red-500' : ''}`}
                            placeholder="Qty"
                        />
                        <span className="text-gray-500">
                            {materials.find(m => m.id === item.materialId)?.unitOfMeasure || 'unit'}
                        </span>
                        <button onClick={() => onRemoveLineItem(groupIndex, lineIndex)} className="text-red-600 hover:text-red-800 ml-2">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                <button onClick={() => onAddLineItem(groupIndex)} className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                    <Plus size={16} className="mr-1" />Add Material Line
                </button>
            </div>
        </div>
    );

    if (materialsLoading || labourLoading || customersLoading) {
        return <div className="text-center p-8 text-gray-500">Loading Core Data...</div>;
    }

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
                        <Plus size={16} className="mr-1" />Add Quote Group
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
                            <Copy size={16} className="mr-2" />Finalise for Xero
                        </button>
                    </div>
                </div>
            </div>
            {isCustomerModalOpen && (
                <CustomerSelectionModal
                    customers={customers}
                    onSelect={handleCustomerSelect}
                    onClose={() => setIsCustomerModalOpen(false)}
                />
            )}
            {isXeroModalOpen && (
                <XeroSummaryModal worksheetData={worksheetData} calculations={calculations} onClose={() => setIsXeroModalOpen(false)} />
            )}
        </>
    );
};

export default Calculator;