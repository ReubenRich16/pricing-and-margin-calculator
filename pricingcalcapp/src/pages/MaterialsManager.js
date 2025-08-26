// src/pages/MaterialsManager.js
import React, { useState, useMemo } from 'react';
import { PlusCircle, Upload, Trash } from 'lucide-react';
import { useMaterials } from '../contexts/MaterialsContext';
import FilterBar from '../components/common/FilterBar';
import ConfirmationModal from '../components/common/ConfirmationModal';
import MaterialModal from '../components/materials/MaterialModal';
import MaterialsTable from '../components/materials/MaterialsTable';
import CSVImporter from '../components/common/CSVImporter';
import { filterBySearchTerm } from '../utils/filter';
import { groupMaterials } from '../utils/materialsGrouping';
import { getMaterialsCollection, deleteEntireCollection } from '../firebase';

const baseFilterConfig = [
  { key: 'search', type: 'text', placeholder: 'Search name, category, supplier, brand...' },
];

// --- Material CSV Field Mappings ---
const materialFieldMappings = {
    'Supplier': { name: 'supplier' },
    'Brand Name': { name: 'brand' },
    'Product Name': { name: 'materialName', required: true, isMatchKey: true },
    'Application': { name: 'category' },
    'R-Value': { name: 'rValue' },
    'Thickness (mm)': { name: 'thickness', type: 'number' },
    'Length (mm)': { name: 'length', type: 'number' },
    'Width (mm)': { name: 'width', type: 'number' },
    'Coverage/Unit': { name: 'coverage', type: 'number' },
    'Coverage Unit': { name: 'coverageUnit' },
    'Unit': { name: 'unitOfMeasure' }, // Standardized
    'Density (kg/m³)': { name: 'density', type: 'number' },
    'Cost/Unit': { name: 'costPrice', type: 'number' },
    'S Cost/Unit': { name: 'sCostUnit', type: 'number' },
    'S+I Timber/Coverage Unit': { name: 's_i_timber', type: 'number' },
    'S+I Steel/Coverage Unit': { name: 's_i_steel', type: 'number' },
    'Retrofit (existing ceiling) S+I/Coverage Unit': { name: 'retrofit_ceiling_rate', type: 'number' },
    'Subfloor S+I/Coverage Unit': { name: 'subfloor_rate', type: 'number' },
    'Retrofit (Subfloor) S+I/Coverage Unit': { name: 'retrofit_subfloor_rate', type: 'number' },
    'Notes': { name: 'notes' },
    'Keywords': { name: 'keywords', type: 'array' },
};

const MaterialsManager = () => {
  const { materials = [], loading, error, addMaterial, updateMaterial, deleteMaterial } = useMaterials();

  const [filters, setFilters] = useState({ search: '', category: '', brand: '', supplier: '' });
  const [showDetails, setShowDetails] = useState(false);

  const [collapsedCat, setCollapsedCat] = useState({});
  const [collapsedBrand, setCollapsedBrand] = useState({});
  const [collapsedSupplier, setCollapsedSupplier] = useState({});
  const [collapsedProduct, setCollapsedProduct] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const [deleteState, setDeleteState] = useState({ open: false, material: null });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteDbConfirmOpen, setIsDeleteDbConfirmOpen] = useState(false);

  // Build dropdown options from current data
  const categoryOptions = useMemo(
    () => Array.from(new Set((materials || []).map(m => m.category).filter(Boolean))).sort(),
    [materials]
  );
  const brandOptions = useMemo(
    () => Array.from(new Set((materials || []).map(m => m.brand).filter(Boolean))).sort(),
    [materials]
  );
  const supplierOptions = useMemo(
    () => Array.from(new Set((materials || []).map(m => m.supplier).filter(Boolean))).sort(),
    [materials]
  );

  const filterConfig = useMemo(() => {
    const cfg = [...baseFilterConfig];
    cfg.push({ key: 'category', type: 'select', placeholder: 'Category', options: categoryOptions });
    cfg.push({ key: 'brand', type: 'select', placeholder: 'Brand', options: brandOptions });
    cfg.push({ key: 'supplier', type: 'select', placeholder: 'Supplier', options: supplierOptions });
    return cfg;
  }, [categoryOptions, brandOptions, supplierOptions]);

  // Text search across key fields
  const searched = useMemo(
    () => filterBySearchTerm(materials, filters.search, ['materialName', 'category', 'supplier', 'brand', 'rValue', 'notes', 'keywords']),
    [materials, filters.search]
  );

  // Exact dropdown filters
  const filteredMaterials = useMemo(() => {
    return searched.filter(m =>
      (filters.category ? m.category === filters.category : true) &&
      (filters.brand ? m.brand === filters.brand : true) &&
      (filters.supplier ? m.supplier === filters.supplier : true)
    );
  }, [searched, filters.category, filters.brand, filters.supplier]);

  const groupedMaterials = useMemo(() => groupMaterials(filteredMaterials), [filteredMaterials]);

  const handleAddNew = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    if (editingMaterial && editingMaterial.id) {
      await updateMaterial(editingMaterial.id, data);
    } else {
      await addMaterial(data);
    }
    setIsModalOpen(false);
    setEditingMaterial(null);
  };

  const requestDelete = (material) => setDeleteState({ open: true, material });
  const confirmDeleteNow = async () => {
    if (deleteState.material?.id) {
      await deleteMaterial(deleteState.material.id);
    }
    setDeleteState({ open: false, material: null });
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

  if (loading) return <div className="p-6">Loading materials...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Materials Manager</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetails(v => !v)}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {showDetails ? 'Hide Detail Columns' : 'Show Detail Columns'}
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center gap-2"
            >
              <Upload size={20} /> Import CSV
            </button>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusCircle size={20} /> Add New
            </button>
            <button
              onClick={() => setIsDeleteDbConfirmOpen(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 flex items-center gap-2"
            >
              <Trash size={20} /> Delete Database
            </button>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          filterConfig={filterConfig}
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
          onEdit={handleEdit}
          onDelete={requestDelete}
        />

        {filteredMaterials.length === 0 && (
          <div className="text-center text-gray-500 py-10">No materials match your filters.</div>
        )}
      </div>

      {isModalOpen && (
        <MaterialModal
          material={editingMaterial}
          onSave={handleSave}
          onClose={() => { setIsModalOpen(false); setEditingMaterial(null); }}
        />
      )}

      {deleteState.open && (
        <ConfirmationModal
          isOpen={deleteState.open}
          title="Delete Material"
          message={`Delete "${deleteState.material?.materialName || 'this material'}"?`}
          onConfirm={confirmDeleteNow}
          onClose={() => setDeleteState({ open: false, material: null })}
          confirmText="Delete"
        />
      )}

      {isImportOpen && (
        <CSVImporter
          isOpen={isImportOpen}
          collectionRef={getMaterialsCollection()}
          fieldMappings={materialFieldMappings}
          onComplete={() => setIsImportOpen(false)}
        />
      )}

      {isDeleteDbConfirmOpen && (
        <ConfirmationModal
          isOpen={isDeleteDbConfirmOpen}
          title="Delete Entire Materials Database"
          message="Are you absolutely sure? This will permanently delete all materials and cannot be undone."
          onConfirm={handleDeleteDatabase}
          onClose={() => setIsDeleteDbConfirmOpen(false)}
          confirmText="Delete"
        />
      )}
    </div>
  );
};

export default MaterialsManager;