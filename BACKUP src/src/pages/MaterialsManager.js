// AU localisation: “Initializing” -> “Initialising”
import React from 'react';
import { useMaterials } from '../contexts/MaterialsContext';
import { Plus, Trash2, Edit, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CSVImporter from '../components/common/CSVImporter';
import MaterialModal from '../components/materials/MaterialModal';
import FilterBar from '../components/common/FilterBar';

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

const MaterialsManagerUI = () => {
    const {
        groupedMaterials,
        isModalOpen,
        editingMaterial,
        materialToDelete,
        isImporting,
        isClearing,
        openCategories,
        showFilters,
        searchTerm,
        filters,
        filterOptions,
        FILTER_FIELDS_CONFIG,
        materialsCollectionRef,
        isLoading,
        setIsModalOpen,
        setMaterialToDelete,
        setIsImporting,
        setIsClearing,
        openAddModal,
        openEditModal,
        handleSave,
        handleDelete,
        handleClearDatabase,
        toggleCategory,
        setShowFilters,
        setSearchTerm,
        setFilters,
        resetFilters
    } = useMaterials();

    if (isLoading) {
        return <div className="text-center p-8 text-gray-500">Initialising Materials Database...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Materials Database</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setIsImporting(true)} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                        <Upload size={18} className="mr-2" /> Import CSV
                    </button>
                    <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <Plus size={18} className="mr-2" /> Add Material
                    </button>
                    <button onClick={() => setIsClearing(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                        <Trash2 size={18} className="mr-2" /> Clear Database
                    </button>
                </div>
            </div>

            <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                resetFilters={resetFilters}
                fields={FILTER_FIELDS_CONFIG}
            />

            <div className="space-y-4">
                {Object.entries(groupedMaterials).length > 0 ? (
                    Object.entries(groupedMaterials).map(([category, items]) => (
                        <div key={category} className="border rounded-lg">
                            <button onClick={() => toggleCategory(category)} className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100">
                                <h3 className="text-lg font-semibold text-gray-700">{category} ({items.length})</h3>
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
                                                        <button onClick={() => openEditModal(material)} className="text-indigo-600 hover:text-indigo-900 mr-4">
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
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No materials found matching your search criteria.
                        {(searchTerm || Object.values(filters).some(f => f)) && (
                            <button
                                onClick={resetFilters}
                                className="block mx-auto mt-2 text-blue-500 hover:underline"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {isModalOpen && <MaterialModal material={editingMaterial} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isImporting && <CSVImporter collectionRef={materialsCollectionRef} fieldMappings={materialFieldMappings} onComplete={() => setIsImporting(false)} />}
            {isClearing && <ConfirmationModal title="Clear Database" message="Are you sure you want to delete ALL materials?" onConfirm={handleClearDatabase} onCancel={() => setIsClearing(false)} />}
            {materialToDelete && <ConfirmationModal title="Delete Material" message={`Are you sure you want to delete "${materialToDelete.materialName}"?`} confirmText="Delete" onConfirm={handleDelete} onCancel={() => setMaterialToDelete(null)} />}
        </div>
    );
};

const MaterialsManager = () => (
    <MaterialsManagerUI />
);

export default MaterialsManager;