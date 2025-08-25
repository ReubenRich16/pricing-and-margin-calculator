// src/pages/MaterialsManager.js
import React, { useState, useMemo } from 'react';
import { useMaterials } from '../contexts/MaterialsContext';
import { getMaterialsCollection, deleteEntireCollection } from '../firebase';
// The faulty import has been removed.
import MaterialModal from '../components/materials/MaterialModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CSVImporter from '../components/common/CSVImporter';
import FilterBar from '../components/common/FilterBar';
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronRight, Upload, Trash, Eye, EyeOff } from 'lucide-react';

// The configuration object is now correctly placed inside this file.
const MATERIAL_DATABASE_CONFIG = {
  categoryOrder: [
    "Bulk Insulation", "Fire Protection", "Subfloor", "Wall Wrap",
    "Acoustic Pipe Lagging", "Rigid Panels/Soffit", "Consumables",
    "Specialty Insulation", "Labour Add Ons/Other",
  ],
  brandOrder: [
    "Ecowool", "Earthwool", "Bradford", "Pink Batts", "Autex", "Kingspan", "Other",
  ],
  productNameSortOrder: {
    Ecowool: [
      "Thermal Ceiling & Floor Batt",
      "Acoustic Floor & Wall Batt",
    ],
  },
};

const getVisibleColumns = (materials) => {
    const columns = {
        thickness: false, density: false, s_i_timber: false, s_i_steel: false,
        length: false, width: false,
    };
    if (!materials || materials.length === 0) return columns;

    for (const mat of materials) {
        if (mat.thickness) columns.thickness = true;
        if (mat.density) columns.density = true;
        if (mat.s_i_timber) columns.s_i_timber = true;
        if (mat.s_i_steel) columns.s_i_steel = true;
        if (mat.length) columns.length = true;
        if (mat.width) columns.width = true;
    }
    return columns;
};

const MaterialsManager = () => {
    const { materials = [], loading, error, addMaterial, updateMaterial, deleteMaterial } = useMaterials();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isDeleteDbConfirmOpen, setIsDeleteDbConfirmOpen] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsed, setCollapsed] = useState({});
    const [showDetails, setShowDetails] = useState(false);

    const filteredMaterials = useMemo(() =>
        materials.filter(m =>
            Object.values(m).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ),
        [materials, searchTerm]
    );

    const { categoryOrder, brandOrder, productNameSortOrder } = MATERIAL_DATABASE_CONFIG;

    const groupedAndSortedMaterials = useMemo(() => {
        const sortedMaterials = [...filteredMaterials].sort((a, b) => {
            const catAIndex = categoryOrder.indexOf(a.category);
            const catBIndex = categoryOrder.indexOf(b.category);
            if (catAIndex !== catBIndex) {
                return (catAIndex === -1 ? Infinity : catAIndex) - (catBIndex === -1 ? Infinity : catBIndex);
            }

            const brandAIndex = brandOrder.indexOf(a.brand);
            const brandBIndex = brandOrder.indexOf(b.brand);
            if (brandAIndex !== brandBIndex) {
                return (brandAIndex === -1 ? Infinity : brandAIndex) - (brandBIndex === -1 ? Infinity : brandBIndex);
            }

            const customSort = productNameSortOrder[a.brand];
            if (customSort) {
                const indexA = customSort.indexOf(a.materialName);
                const indexB = customSort.indexOf(b.materialName);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            }
            if (a.materialName?.includes('Acoustic Partition') && b.materialName?.includes('Acoustic Partition')) return (b.density || 0) - (a.density || 0);
            if (a.category === 'Wall Wrap') return (b.coverage || 0) - (a.coverage || 0);
            const rValueA = parseFloat(a.rValue) || 0;
            const rValueB = parseFloat(b.rValue) || 0;
            if (rValueA !== rValueB) return rValueB - rValueA;
            if (a.thickness !== b.thickness) return (b.thickness || 0) - (a.thickness || 0);
            if (a.category === 'Fire Protection') return (b.density || 0) - (a.density || 0);

            return (a.materialName || '').localeCompare(b.materialName || '');
        });

        const grouped = sortedMaterials.reduce((acc, m) => {
            const category = m.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = { items: [] };
            }
            acc[category].items.push(m);
            return acc;
        }, {});
        
        for (const category in grouped) {
            grouped[category].visibleColumns = getVisibleColumns(grouped[category].items);
        }
        
        return grouped;
    }, [filteredMaterials, categoryOrder, brandOrder, productNameSortOrder]);

    const handleSave = (data) => {
        if (currentMaterial) {
            updateMaterial(currentMaterial.id, data);
        } else {
            addMaterial(data);
        }
        setIsModalOpen(false);
    };

    const handleDeleteDatabase = async () => {
        try {
            await deleteEntireCollection('materials');
            alert('Materials database has been successfully cleared.');
        } catch (err) {
            alert('An error occurred while deleting the database.');
        }
        setIsDeleteDbConfirmOpen(false);
    };
    
    const materialFieldMappings = {
        'Product Name': { name: 'materialName', required: true, isMatchKey: true }, 'Supplier': { name: 'supplier' }, 'Brand Name': { name: 'brand' }, 'Application': { name: 'category' }, 'R-Value': { name: 'rValue' }, 'Thickness (mm)': { name: 'thickness', type: 'number' }, 'Length (mm)': { name: 'length', type: 'number' }, 'Width (mm)': { name: 'width', type: 'number' }, 'Coverage/Unit': { name: 'coverage', type: 'number' }, 'Coverage Unit': { name: 'coverageUnit' }, 'Unit': { name: 'unitOfMeasure' }, 'Density (kg/m³)': { name: 'density', type: 'number' }, 'Cost/Unit': { name: 'costPrice', type: 'number', required: true }, 'S Cost/Unit': { name: 'sCostUnit', type: 'number' }, 'S+I Timber': { name: 's_i_timber', type: 'number' }, 'S+I Steel': { name: 's_i_steel', type: 'number' }, 'Retrofit (existing ceiling) S+I/Coverage Unit': { name: 'retrofit_ceiling_rate', type: 'number' }, 'Subfloor S+I/Coverage Unit': { name: 'subfloor_rate', type: 'number' }, 'Retrofit (Subfloor) S+I/Coverage Unit': { name: 'retrofit_subfloor_rate', type: 'number' }, 'Notes': { name: 'notes' }, 'Keywords': { name: 'keywords', type: 'array' },
    };

    if (loading) return <div className="p-4">Loading materials...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Materials Manager</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowDetails(!showDetails)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-300 flex items-center gap-2">
                            {showDetails ? <EyeOff size={20} /> : <Eye size={20} />}
                            {showDetails ? 'Hide Details' : 'Show Details'}
                        </button>
                        <button onClick={() => setIsImportOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center gap-2"><Upload size={20} /> Import CSV</button>
                        <button onClick={() => { setCurrentMaterial(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"><PlusCircle size={20} /> Add New</button>
                        <button onClick={() => setIsDeleteDbConfirmOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 flex items-center gap-2"><Trash size={20} /> Delete Database</button>
                    </div>
                </div>
                
                <FilterBar filter={searchTerm} setFilter={setSearchTerm} placeholder="Search all fields..." />

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    {Object.keys(groupedAndSortedMaterials).map(category => {
                        const { items, visibleColumns } = groupedAndSortedMaterials[category];
                        return (
                            <div key={category}>
                                <button onClick={() => setCollapsed(p => ({...p, [category]: !p[category]}))} className="w-full flex justify-between items-center bg-gray-100 p-3 font-semibold text-left">
                                    <span>{category} ({items.length})</span>
                                    {collapsed[category] ? <ChevronRight size={20}/> : <ChevronDown size={20}/>}
                                </button>
                                {!collapsed[category] && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Product Name</th>
                                                    <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Cost/Unit</th>
                                                    <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">S Cost/Unit</th>
                                                    {visibleColumns.s_i_timber && <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">S+I Timber</th>}
                                                    {visibleColumns.s_i_steel && <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">S+I Steel</th>}
                                                    {showDetails && visibleColumns.thickness && <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Thickness</th>}
                                                    {showDetails && visibleColumns.width && <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Width</th>}
                                                    {showDetails && visibleColumns.density && <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Density</th>}
                                                    <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {items.map(m => (
                                                    <tr key={m.id}>
                                                        <td className="p-3 font-medium text-sm">
                                                            {m.materialName}
                                                            <span className="block text-xs text-gray-500">{m.brand} {m.rValue && `| ${m.rValue}`}</span>
                                                        </td>
                                                        <td className="p-3 text-sm text-red-600 font-medium">${(m.costPrice || 0).toFixed(2)}</td>
                                                        <td className="p-3 text-sm font-semibold">${(m.sCostUnit || 0).toFixed(2)}</td>
                                                        {visibleColumns.s_i_timber && <td className="p-3 text-sm">${(m.s_i_timber || 0).toFixed(2)}</td>}
                                                        {visibleColumns.s_i_steel && <td className="p-3 text-sm">${(m.s_i_steel || 0).toFixed(2)}</td>}
                                                        {showDetails && visibleColumns.thickness && <td className="p-3 text-sm">{m.thickness}mm</td>}
                                                        {showDetails && visibleColumns.width && <td className="p-3 text-sm">{m.width}mm</td>}
                                                        {showDetails && visibleColumns.density && <td className="p-3 text-sm">{m.density}</td>}
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => { setCurrentMaterial(m); setIsModalOpen(true); }} className="text-blue-500 mr-2"><Edit size={18}/></button>
                                                            <button onClick={() => { setMaterialToDelete(m); setIsConfirmOpen(true); }} className="text-red-500"><Trash2 size={18}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {isModalOpen && <MaterialModal material={currentMaterial} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isConfirmOpen && <ConfirmationModal title="Delete Material" message={`Delete ${materialToDelete?.materialName}?`} onClose={() => setIsConfirmOpen(false)} onConfirm={() => { deleteMaterial(materialToDelete.id); setIsConfirmOpen(false); }} />}
            {isImportOpen && <CSVImporter collectionRef={getMaterialsCollection()} fieldMappings={materialFieldMappings} onComplete={() => setIsImportOpen(false)} />}
            {isDeleteDbConfirmOpen && <ConfirmationModal title="Delete Entire Materials Database" message="Are you absolutely sure? This will permanently delete all materials and cannot be undone." onConfirm={handleDeleteDatabase} onClose={() => setIsDeleteDbConfirmOpen(false)} />}
        </div>
    );
};

export default MaterialsManager;