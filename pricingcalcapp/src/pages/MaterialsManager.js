import React, { useState, useMemo } from 'react';
import { useMaterials } from '../contexts/MaterialsContext';
import { getMaterialsCollection, deleteEntireCollection } from '../firebase';
import MaterialModal from '../components/materials/MaterialModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CSVImporter from '../components/common/CSVImporter';
import FilterBar from '../components/common/FilterBar';
import { PlusCircle, Edit, Trash2, Upload, Trash, Eye, EyeOff } from 'lucide-react';
import MaterialsTable from '../components/materials/MaterialsTable';
import { groupMaterials } from '../utils/materialsGrouping';
import { filterBySearchTerm } from '../utils/filter';

const materialFilterConfig = [
  { key: 'search', type: 'text', placeholder: 'Search all fields...' }
];

const MaterialsManager = () => {
    const { materials = [], loading, error, addMaterial, updateMaterial, deleteMaterial } = useMaterials();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isDeleteDbConfirmOpen, setIsDeleteDbConfirmOpen] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [filters, setFilters] = useState({ search: "" });
    const [showDetails, setShowDetails] = useState(false);

    // Multi-level collapse state
    const [collapsedCat, setCollapsedCat] = useState({});
    const [collapsedBrand, setCollapsedBrand] = useState({});
    const [collapsedSupplier, setCollapsedSupplier] = useState({});
    const [collapsedProduct, setCollapsedProduct] = useState({});

    // Use centralized filter utility
    const filteredMaterials = useMemo(() =>
        filterBySearchTerm(materials, filters.search),
        [materials, filters.search]
    );

    // Multi-tier grouping
    const groupedMaterials = useMemo(() => groupMaterials(filteredMaterials), [filteredMaterials]);

    // Modal handlers
    const handleSave = (data) => {
        if (currentMaterial) updateMaterial(currentMaterial.id, data);
        else addMaterial(data);
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

    // CSV importer mapping
    const materialFieldMappings = {
        'Product Name': { name: 'materialName', required: true, isMatchKey: true },
        'Supplier': { name: 'supplier' },
        'Brand Name': { name: 'brand' },
        'Application': { name: 'category' },
        'R-Value': { name: 'rValue' },
        'Thickness (mm)': { name: 'thickness', type: 'number' },
        'Length (mm)': { name: 'length', type: 'number' },
        'Width (mm)': { name: 'width', type: 'number' },
        'Coverage/Unit': { name: 'coverage', type: 'number' },
        'Coverage Unit': { name: 'coverageUnit' },
        'Unit': { name: 'unitOfMeasure' },
        'Density (kg/m³)': { name: 'density', type: 'number' },
        'Cost/Unit': { name: 'costPrice', type: 'number', required: true },
        'S Cost/Unit': { name: 'sCostUnit', type: 'number' },
        'S+I Timber': { name: 's_i_timber', type: 'number' },
        'S+I Steel': { name: 's_i_steel', type: 'number' },
        'Retrofit (existing ceiling) S+I/Coverage Unit': { name: 'retrofit_ceiling_rate', type: 'number' },
        'Subfloor S+I/Coverage Unit': { name: 'subfloor_rate', type: 'number' },
        'Retrofit (Subfloor) S+I/Coverage Unit': { name: 'retrofit_subfloor_rate', type: 'number' },
        'Notes': { name: 'notes' },
        'Keywords': { name: 'keywords', type: 'array' },
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
                
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  filterConfig={materialFilterConfig}
                />

                <MaterialsTable
                    groupedMaterials={groupedMaterials}
                    collapsedCat={collapsedCat}
                    setCollapsedCat={setCollapsedCat}
                    collapsedBrand={collapsedBrand}
                    setCollapsedBrand={setCollapsedBrand}
                    collapsedSupplier={collapsedSupplier}
                    setCollapsedSupplier={setCollapsedSupplier}
                    collapsedProduct={collapsedProduct}
                    setCollapsedProduct={setCollapsedProduct}
                    showDetails={showDetails}
                    onEdit={m => { setCurrentMaterial(m); setIsModalOpen(true); }}
                    onDelete={m => { setMaterialToDelete(m); setIsConfirmOpen(true); }}
                />
            </div>

            {isModalOpen && <MaterialModal material={currentMaterial} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isConfirmOpen && <ConfirmationModal title="Delete Material" message={`Delete ${materialToDelete?.materialName}?`} onClose={() => setIsConfirmOpen(false)} onConfirm={() => { deleteMaterial(materialToDelete.id); setIsConfirmOpen(false); }} />}
            {isImportOpen && <CSVImporter collectionRef={getMaterialsCollection()} fieldMappings={materialFieldMappings} onComplete={() => setIsImportOpen(false)} />}
            {isDeleteDbConfirmOpen && <ConfirmationModal title="Delete Entire Materials Database" message="Are you absolutely sure? This will permanently delete all materials and cannot be undone." onConfirm={handleDeleteDatabase} onClose={() => setIsDeleteDbConfirmOpen(false)} />}
        </div>
    );
};

export default MaterialsManager;