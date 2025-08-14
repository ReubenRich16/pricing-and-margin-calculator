// --- Pricing Calculator Page ---
// Implements Quote Worksheet creation and editing, including Quote Groups and Line Items.
// Handles real-time margin and GST calculations, and Xero summary finalization.

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, X, Copy } from 'lucide-react';
import PasteParser from '../components/quote/PasteParser'; // <-- Added for R5.3
import XeroSummaryModal from '../components/quote/XeroSummaryModal'; // <-- Use imported component

// --- Line Item Subcomponent ---
// Renders a line item row in a quote group.
const LineItem = ({ item, lineIndex, onLineItemChange, onRemoveLineItem, materials }) => (
    <div className="bg-white p-3 rounded-md border border-gray-300 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-6">
            <select
                name="materialId"
                value={item.materialId}
                onChange={(e) => onLineItemChange(lineIndex, 'materialId', e.target.value)}
                className="w-full p-2 border-gray-300 rounded-md bg-white text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="">Select a material...</option>
                {materials.map(material => (
                    <option key={material.id} value={material.id}>
                        {material.materialName}
                    </option>
                ))}
            </select>
        </div>
        <div className="col-span-2">
            <input
                type="number"
                name="quantity"
                value={item.quantity}
                onChange={(e) => onLineItemChange(lineIndex, 'quantity', parseFloat(e.target.value) || 0)}
                placeholder="Qty"
                className="w-full p-2 border-gray-300 rounded-md text-sm"
            />
        </div>
        <div className="col-span-2">
            <p className="text-sm text-gray-600 p-2">{item.unitOfMeasure || 'unit'}</p>
        </div>
        <div className="col-span-2 flex justify-end">
            <button onClick={() => onRemoveLineItem(lineIndex)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                <X size={16}/>
            </button>
        </div>
    </div>
);

// --- Worksheet Group Subcomponent ---
// Renders a quote group and its line items.
const WorksheetGroup = ({ group, groupIndex, onGroupChange, onRemoveGroup, onAddLineItem, onRemoveLineItem, onLineItemChange, materials }) => (
    <div className="border border-gray-200 bg-gray-50/80 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3">
            <input
                value={group.groupName}
                onChange={(e) => onGroupChange(groupIndex, 'groupName', e.target.value)}
                placeholder="Group Name (e.g., First Floor Walls)"
                className="w-full p-2 border-gray-300 rounded-md font-semibold text-lg bg-transparent focus:bg-white"
            />
            <button onClick={() => onRemoveGroup(groupIndex)} className="ml-4 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                <Trash2 size={18}/>
            </button>
        </div>
        <div className="space-y-2">
            {(group.lineItems || []).map((item, lineIndex) => (
                <LineItem
                    key={item.lineItemId || lineIndex}
                    item={item}
                    lineIndex={lineIndex}
                    onLineItemChange={(idx, field, value) => onLineItemChange(groupIndex, idx, field, value)}
                    onRemoveLineItem={(idx) => onRemoveLineItem(groupIndex, idx)}
                    materials={materials}
                />
            ))}
        </div>
        <button onClick={() => onAddLineItem(groupIndex)} className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium mt-3">
            <Plus size={14} className="mr-1"/>Add Line Item
        </button>
    </div>
);

// --- Main Calculator Component ---
// Handles worksheet state, CRUD, live calculations, and rendering.
const Calculator = ({ worksheet, onBack }) => {
    const [worksheetData, setWorksheetData] = useState({
        worksheetName: '',
        customerName: '',
        status: 'Draft',
        marginPercentage: 25,
        groups: [],
    });
    const [materials, setMaterials] = useState([]);
    const [labourRates, setLabourRates] = useState([]); // <-- Added for R5.3
    const [isXeroModalOpen, setIsXeroModalOpen] = useState(false);

    // Centralized Firestore paths (replace 'default-app-id' with dynamic appId if needed)
    const worksheetsCollectionRef = collection(db, 'artifacts', 'default-app-id', 'public', 'data', 'worksheets');
    const materialsCollectionRef = collection(db, 'artifacts', 'default-app-id', 'public', 'data', 'materials');
    const labourRatesCollectionRef = collection(db, 'artifacts', 'default-app-id', 'public', 'data', 'labourRates'); // <-- Added for R5.3

    // Fetch materials in real-time
    useEffect(() => {
        const unsubscribe = onSnapshot(materialsCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMaterials(data);
        });
        return () => unsubscribe();
    }, []);

    // Fetch labour rates in real-time (R5.3)
    useEffect(() => {
        const unsubscribe = onSnapshot(labourRatesCollectionRef, (snapshot) => {
            setLabourRates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    // Set worksheet data from prop or reset for new worksheet
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
                status: 'Draft',
                marginPercentage: 25,
                groups: [],
            });
        }
    }, [worksheet]);

    // --- Calculation Engine ---
    // Computes all totals, GST, and margin values in real-time.
    const calculations = useMemo(() => {
        const GST_RATE = 0.10;
        let totalMaterialCost = 0;
        const totalLaborCost = 0;

        (worksheetData.groups || []).forEach(group => {
            (group.lineItems || []).forEach(item => {
                const material = materials.find(m => m.id === item.materialId);
                if (material) {
                    totalMaterialCost += (material.costPrice || 0) * (item.quantity || 0);
                }
            });
        });

        const totalCostExGst = totalMaterialCost + totalLaborCost;
        const marginPercentage = worksheetData.marginPercentage || 0;

        const marginDecimal = marginPercentage / 100;
        if (marginDecimal >= 1) {
            return { totalMaterialCost: 0, totalLaborCost: 0, totalCostExGst: 0, markupAmount: 0, subtotalExGst: 0, gstAmount: 0, totalPriceIncGst: 0, actualMargin: 0 };
        }

        const subtotalExGst = totalCostExGst === 0 ? 0 : totalCostExGst / (1 - marginDecimal);
        const markupAmount = subtotalExGst - totalCostExGst;
        const gstAmount = subtotalExGst * GST_RATE;
        const totalPriceIncGst = subtotalExGst + gstAmount;
        const actualMargin = subtotalExGst > 0 ? ((subtotalExGst - totalCostExGst) / subtotalExGst) * 100 : 0;

        return { totalMaterialCost, totalLaborCost, totalCostExGst, markupAmount, subtotalExGst, gstAmount, totalPriceIncGst, actualMargin };
    }, [worksheetData, materials]);

    // --- Worksheet Form Handlers ---
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setWorksheetData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    // Add Quote Group
    const addGroup = () => {
        const newGroup = {
            groupId: `group_${Date.now()}`,
            groupName: 'New Group',
            lineItems: [],
            laborItems: []
        };
        setWorksheetData(prev => ({ ...prev, groups: [...(prev.groups || []), newGroup] }));
    };

    // Remove Quote Group
    const removeGroup = (indexToRemove) => {
        setWorksheetData(prev => ({ ...prev, groups: prev.groups.filter((_, index) => index !== indexToRemove) }));
    };

    // Handle Group Edit
    const handleGroupChange = (index, field, value) => {
        const newGroups = [...worksheetData.groups];
        newGroups[index][field] = value;
        setWorksheetData(prev => ({ ...prev, groups: newGroups }));
    };

    // Add Material Line Item
    const addLineItem = (groupIndex) => {
        const newLineItem = {
            lineItemId: `item_${Date.now()}`,
            materialId: '',
            quantity: 1,
            unitOfMeasure: ''
        };
        const newGroups = [...worksheetData.groups];
        if (!newGroups[groupIndex].lineItems) {
            newGroups[groupIndex].lineItems = [];
        }
        newGroups[groupIndex].lineItems.push(newLineItem);
        setWorksheetData(prev => ({ ...prev, groups: newGroups }));
    };

    // Remove Material Line Item
    const removeLineItem = (groupIndex, lineIndexToRemove) => {
        const newGroups = [...worksheetData.groups];
        newGroups[groupIndex].lineItems = newGroups[groupIndex].lineItems.filter((_, index) => index !== lineIndexToRemove);
        setWorksheetData(prev => ({ ...prev, groups: newGroups }));
    };

    // Handle Line Item Edit
    const handleLineItemChange = (groupIndex, lineIndex, field, value) => {
        const newGroups = [...worksheetData.groups];
        const lineItem = newGroups[groupIndex].lineItems[lineIndex];
        lineItem[field] = value;

        if (field === 'materialId') {
            const selectedMaterial = materials.find(m => m.id === value);
            lineItem.unitOfMeasure = selectedMaterial ? selectedMaterial.unitOfMeasure : '';
            lineItem.materialName = selectedMaterial ? selectedMaterial.materialName : '';
            lineItem.costPrice = selectedMaterial ? selectedMaterial.costPrice : 0;
        }

        setWorksheetData(prev => ({ ...prev, groups: newGroups }));
    };

    // --- NEW for R5.3: Handler for parsed groups from PasteParser ---
    const handleParsedGroups = (parsedGroups) => {
        // Flatten parsedGroups to worksheet format expected by UI
        // Each group: { groupName, subgroups: [{ subgroupName, lineItems: [...] }] }
        // We'll treat each subgroup as a quote group in the worksheet
        const worksheetGroups = [];
        parsedGroups.forEach(group => {
            if (group.subgroups && group.subgroups.length > 0) {
                group.subgroups.forEach(subgroup => {
                    worksheetGroups.push({
                        groupId: `group_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                        groupName: `${group.groupName} - ${subgroup.subgroupName}`,
                        lineItems: (subgroup.lineItems || []).map(item => ({
                            ...item,
                            lineItemId: `item_${Date.now()}_${Math.random().toString(36).substr(2,5)}`
                        })),
                        laborItems: [] // Reserved for future
                    });
                });
            } else if (group.lineItems && group.lineItems.length > 0) {
                worksheetGroups.push({
                    groupId: `group_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                    groupName: group.groupName,
                    lineItems: (group.lineItems || []).map(item => ({
                        ...item,
                        lineItemId: `item_${Date.now()}_${Math.random().toString(36).substr(2,5)}`
                    })),
                    laborItems: []
                });
            }
        });
        setWorksheetData(prev => ({
            ...prev,
            groups: worksheetGroups
        }));
    };

    // --- Worksheet Save Handler ---
    const handleSave = async () => {
        const dataToSave = {
            ...worksheetData,
            summary: calculations,
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

    // --- Margin Color Utility ---
    const getMarginColor = (margin) => {
        if (margin >= 20) return 'bg-green-100 text-green-800';
        if (margin >= 10) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    // --- Main Render ---
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Worksheet Form & Groups */}
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">{worksheet?.id ? 'Edit Worksheet' : 'New Quote Worksheet'}</h2>
                        <button onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">Back to Dashboard</button>
                    </div>

                    {/* --- R5.3: Paste & Parse Section --- */}
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
                            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name</label>
                            <input type="text" name="customerName" id="customerName" value={worksheetData.customerName} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., John Smith" />
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
                            />
                        ))}
                    </div>
                    <button onClick={addGroup} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2">
                        <Plus size={16} className="mr-1"/>Add Quote Group
                    </button>
                </div>

                {/* Calculations Sidebar */}
                <div className="lg:col-span-1 lg:sticky top-24 bg-white p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Live Calculations</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Material Cost:</span><span className="font-medium">${calculations.totalMaterialCost.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Labour Cost:</span><span className="font-medium">${calculations.totalLaborCost.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span className="text-gray-800">Total Cost (ex. GST):</span><span>${calculations.totalCostExGst.toFixed(2)}</span></div>
                    </div>
                    <div className="space-y-2 text-sm border-t pt-2 mt-2">
                        <div className="flex justify-between"><span className="text-gray-600">Markup:</span><span className="font-medium">${calculations.markupAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold"><span className="text-gray-800">Subtotal (ex. GST):</span><span>${calculations.subtotalExGst.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">GST:</span><span className="font-medium">${calculations.gstAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="text-gray-800">Total Price (inc. GST):</span><span>${calculations.totalPriceIncGst.toFixed(2)}</span></div>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${getMarginColor(calculations.actualMargin)}`}>
                        <div className="text-sm font-bold uppercase tracking-wider">Actual Profit Margin</div>
                        <div className="text-4xl font-bold">{calculations.actualMargin.toFixed(2)}%</div>
                    </div>
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
            {isXeroModalOpen && (
                <XeroSummaryModal worksheetData={worksheetData} calculations={calculations} onClose={() => setIsXeroModalOpen(false)} />
            )}
        </>
    );
};

export default Calculator;
