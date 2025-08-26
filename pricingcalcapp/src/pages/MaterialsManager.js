// src/pages/MaterialsManager.js
// --- Materials Database Management ---
// Handles CRUD operations for materials with filtering and search functionality

import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import FilterBar from './FilterBar';
import MaterialForm from './MaterialForm';
import MaterialsList from './MaterialsList';

const MaterialsManager = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);

    // Filter configuration for the FilterBar
    const filterConfig = [
        { key: 'search', type: 'text', placeholder: 'Search materials...' },
        { key: 'category', type: 'select', placeholder: 'Filter by category', options: ['Bulk', 'Batts', 'Boards', 'Adhesives', 'Membranes'] },
        { key: 'supplier', type: 'select', placeholder: 'Filter by supplier', options: ['Bradford', 'Knauf', 'Earthwool', 'CSR', 'Fletcher'] }
    ];

    // Load materials from Firestore
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                setLoading(true);
                const materialsCollection = collection(db, 'materials');
                const materialsSnapshot = await getDocs(materialsCollection);
                const materialsList = materialsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMaterials(materialsList);
                setFilteredMaterials(materialsList);
            } catch (error) {
                console.error('Error fetching materials:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    // Apply filters whenever filters or materials change
    useEffect(() => {
        let filtered = materials;

        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(material => 
                material.name?.toLowerCase().includes(searchTerm) ||
                material.description?.toLowerCase().includes(searchTerm) ||
                material.category?.toLowerCase().includes(searchTerm) ||
                material.supplier?.toLowerCase().includes(searchTerm)
            );
        }

        // Category filter
        if (filters.category) {
            filtered = filtered.filter(material => material.category === filters.category);
        }

        // Supplier filter
        if (filters.supplier) {
            filtered = filtered.filter(material => material.supplier === filters.supplier);
        }

        setFilteredMaterials(filtered);
    }, [filters, materials]);

    // Handle material deletion
    const handleDelete = async (materialId) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            try {
                await deleteDoc(doc(db, 'materials', materialId));
                setMaterials(materials.filter(m => m.id !== materialId));
            } catch (error) {
                console.error('Error deleting material:', error);
            }
        }
    };

    // Handle material save (add or edit)
    const handleSave = (savedMaterial) => {
        if (editingMaterial) {
            // Update existing material
            setMaterials(materials.map(m => 
                m.id === savedMaterial.id ? savedMaterial : m
            ));
            setEditingMaterial(null);
        } else {
            // Add new material
            setMaterials([...materials, savedMaterial]);
        }
        setShowAddForm(false);
    };

    // Handle edit
    const handleEdit = (material) => {
        setEditingMaterial(material);
        setShowAddForm(true);
    };

    // Handle cancel form
    const handleCancel = () => {
        setShowAddForm(false);
        setEditingMaterial(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading materials...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Materials Database</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Add Material
                </button>
            </div>

            {/* Filter Bar */}
            <FilterBar 
                filters={filters} 
                onFilterChange={setFilters} 
                filterConfig={filterConfig}
            />

            {/* Material Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
                        <MaterialForm
                            material={editingMaterial}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            )}

            {/* Materials List */}
            <MaterialsList
                materials={filteredMaterials}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Empty state */}
            {filteredMaterials.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="text-gray-500 text-lg">
                        {materials.length === 0 ? 'No materials found. Add your first material!' : 'No materials match your filters.'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialsManager;