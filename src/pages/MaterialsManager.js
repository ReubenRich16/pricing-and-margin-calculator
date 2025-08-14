// --- Materials Database Management ---
// CRUD, CSV import, clear all, and collapsible category display.

import React, { useState, useEffect, useMemo } from 'react';
import { db, appId } from '../firebase'; // If src/pages, this is correct. Adjust if needed!
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, Edit, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CSVImporter from '../components/common/CSVImporter';
import MaterialModal from '../components/materials/MaterialModal';

// --- CSV Field Mappings ---
const materialFieldMappings = {
    'Supplier': { name: 'supplier', type: 'string' },
    'Brand Name': { name: 'brand', type: 'string' },
    'Product Name': { name: 'materialName', type: 'string', required: true, isMatchKey: true },
    'Application': { name: 'category', type: 'string' },
    'R-Value': { name: 'rValue', type: 'string' },
    'Thickness (mm)': { name: 'thickness', type: 'number' },
    'Length (mm)': { name: 'length', type: 'number' },
    'Width (mm)': { name: 'width', type: 'number' },
    'm²/LM (bag/sheet/roll)': { name: 'm2PerUnit', type: 'number' },
    'Pieces per bag': { name: 'piecesPerBag', type: 'number' },
    'bags/sheet/rolls per pack': { name: 'unitsPerPack', type: 'number' },
    'm²/LM per pack': { name: 'm2PerPack', type: 'number' },
    'Item # / Code': { name: 'itemCode', type: 'string' },
    'Density (kg/m³)': { name: 'density', type: 'string' },
    'Notes': { name: 'notes', type: 'string' },
    'Cost/(M²/LM)': { name: 'costPerM2', type: 'number'},
    'Cost/Unit': { name: 'costPerUnit', type: 'number' },
    'Cost/Pack': { name: 'costPerPack', type: 'number' },
    'Sale Cost (bag/sheet/roll)': { name: 'salePrice', type: 'number' },
    'S+I Timber': { name: 'supplyAndInstallRate', type: 'number' },
    'S+I Steel': { name: 'supplyAndInstallRateSteel', type: 'number' },
    'Retrofit (existing ceiling) Rate/m²': { name: 'retrofitRate', type: 'number' },
    'Subfloor Rate/m²': { name: 'subfloorRate', type: 'number' },
    'Retrofit (Subfloor) Rate/m²': { name: 'retrofitSubfloorRate', type: 'number' },
};

// --- Main MaterialsManager Component ---
const MaterialsManager = () => {
    const [materials, setMaterials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [openCategories, setOpenCategories] = useState({});

    const materialsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'materials');

    // --- Real-time fetch ---
    useEffect(() => {
        const unsubscribe = onSnapshot(materialsCollectionRef, (snapshot) => {
            setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    // --- Category grouping & ordering ---
    const processedMaterials = useMemo(() => {
        const categoryOrder = [
            "Bulk Insulation", "Fire Protection", "Subfloor", 
            "Acoustic Pipe Lag", "Wall Wrap", "Consumables", 
            "Rigid Wall/Soffit", "XPS"
        ];
        const groupedByCategory = materials.reduce((acc, material) => {
            const category = material.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(material);
            return acc;
        }, {});
        const orderedGroups = {};
        categoryOrder.forEach(cat => {
            if (groupedByCategory[cat]) {
                orderedGroups[cat] = groupedByCategory[cat];
            }
        });
        Object.keys(groupedByCategory).forEach(cat => {
            if (!orderedGroups[cat]) orderedGroups[cat] = groupedByCategory[cat];
        });
        return orderedGroups;
    }, [materials]);

    // --- CRUD Handlers ---
    const handleSave = async (data) => {
        if (editingMaterial) await updateDoc(doc(materialsCollectionRef, editingMaterial.id), data);
        else await addDoc(materialsCollectionRef, data);
        setIsModalOpen(false); setEditingMaterial(null);
    };

    const handleDelete = async () => {
        if (!materialToDelete) return;
        await deleteDoc(doc(materialsCollectionRef, materialToDelete.id));
        setMaterialToDelete(null);
    };
    
    const handleClearDatabase = async () => {
        const snapshot = await getDocs(materialsCollectionRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        setIsClearing(false);
    };

    // --- Collapsible category toggle ---
    const toggleCategory = (category) => {
        setOpenCategories(prev => ({...prev, [category]: !prev[category]}));
    };

    // --- Render ---
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Materials Database</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setIsImporting(true)} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                        <Upload size={18} className="mr-2" /> Import CSV
                    </button>
                    <button onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <Plus size={18} className="mr-2" /> Add Material
                    </button>
                    <button onClick={() => setIsClearing(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                        <Trash2 size={18} className="mr-2" /> Clear Database
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                {Object.entries(processedMaterials).map(([category, items]) => (
                    <div key={category} className="border rounded-lg">
                        <button onClick={() => toggleCategory(category)} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                            <h3 className="text-lg font-semibold text-gray-700">{category}</h3>
                            {openCategories[category] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {openCategories[category] && (
                             <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">R-Value</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {items.map((material) => (
                                            <tr key={material.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.materialName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.supplier}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.brand}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.rValue}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    ${(material.costPerUnit || material.costPrice || 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => { setEditingMaterial(material); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => setMaterialToDelete(material)} className="text-red-600 hover:text-red-900">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <MaterialModal
                    material={editingMaterial}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            {isImporting && (
                <CSVImporter
                    collectionRef={materialsCollectionRef}
                    fieldMappings={materialFieldMappings}
                    onComplete={() => setIsImporting(false)}
                />
            )}
            {isClearing && (
                <ConfirmationModal
                    title="Clear Database"
                    message="Are you sure you want to delete ALL materials?"
                    onConfirm={handleClearDatabase}
                    onCancel={() => setIsClearing(false)}
                />
            )}
            {materialToDelete && (
                <ConfirmationModal
                    title="Delete Material"
                    message={`Are you sure you want to delete "${materialToDelete.materialName}"?`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setMaterialToDelete(null)}
                />
            )}
        </div>
    );
};

export default MaterialsManager;
