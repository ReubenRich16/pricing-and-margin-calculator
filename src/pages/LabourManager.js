// --- Labour Rates Database Management ---
// CRUD interface for labour rates, supports CSV import and grouped display.

import React, { useState, useEffect, useMemo } from 'react';
import { db, appId } from '../firebase'; // Remove 'auth' import
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2, Edit, Upload } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CSVImporter from '../components/common/CSVImporter';
import LabourModal from '../components/labour/LabourModal';

// --- CSV Field Mappings for Import ---
const labourFieldMappings = {
    'Application': { name: 'application', type: 'string', required: true },
    'Area': { name: 'area', type: 'string', required: true, isMatchKey: true },
    'Timber Frame': { name: 'timberRate', type: 'number' },
    'Steel Frame': { name: 'steelRate', type: 'number' },
    'Unit': { name: 'unit', type: 'string' },
    'Notes/Conditions': { name: 'notes', type: 'string' },
    'Keywords': { name: 'keywords', type: 'array' },
};

// --- Main LabourManager Component ---
const LabourManager = () => {
    const [labourRates, setLabourRates] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [rateToDelete, setRateToDelete] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    const labourRatesCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'labourRates');

    // --- Fetch labour rates in real-time ---
    useEffect(() => { 
        const unsub = onSnapshot(labourRatesCollectionRef, (snap) => setLabourRates(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        return () => unsub(); 
    }, []);

    // --- Group labour rates by application for display ---
    const groupedLabourRates = useMemo(() => { 
        const groupData = labourRates.reduce((acc, rate) => { 
            const category = rate.application || 'Uncategorized'; 
            (acc[category] = acc[category] || []).push(rate); 
            return acc; 
        }, {}); 
        return Object.entries(groupData).sort(([a], [b]) => a.localeCompare(b)); 
    }, [labourRates]);

    // --- Save/Create Labour Rate ---
    const handleSave = async (data) => {
        if (editingRate) await updateDoc(doc(labourRatesCollectionRef, editingRate.id), data); 
        else await addDoc(labourRatesCollectionRef, data);
        setIsModalOpen(false); setEditingRate(null);
    };

    // --- Delete Labour Rate ---
    const handleDelete = async () => { 
        if (!rateToDelete) return; 
        await deleteDoc(doc(labourRatesCollectionRef, rateToDelete.id)); 
        setRateToDelete(null); 
    };

    // --- Main Render ---
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Labour Rates Database</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setIsImporting(true)} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"><Upload size={18} className="mr-2" /> Import CSV</button>
                    <button onClick={() => { setEditingRate(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"><Plus size={18} className="mr-2" /> Add Labour Rate</button>
                </div>
            </div>
            <div className="space-y-6">
                {groupedLabourRates.map(([application, rates]) => (
                    <div key={application}>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">{application}</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area / Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timber Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Steel Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rates.map((rate) => (
                                        <tr key={rate.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.area}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(rate.timberRate || 0).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(rate.steelRate || 0).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => { setEditingRate(rate); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                                                <button onClick={() => setRateToDelete(rate)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <LabourModal rate={editingRate} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isImporting && <CSVImporter collectionRef={labourRatesCollectionRef} fieldMappings={labourFieldMappings} onComplete={() => setIsImporting(false)} />}
            {rateToDelete && (<ConfirmationModal title="Delete Labour Rate" message={`Are you sure you want to delete "${rateToDelete.area}"? This action cannot be undone.`} confirmText="Delete" onConfirm={handleDelete} onCancel={() => setRateToDelete(null)} />)}
        </div>
    );
};

export default LabourManager;
