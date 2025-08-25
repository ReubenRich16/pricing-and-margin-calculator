// src/contexts/MaterialsContext.js
// Renamed from "MaterialsContext .js" (removed stray space).
// No functional changes beyond filename normalisation.

import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { useGlobalData } from './GlobalDataContext';
import { getMaterialsCollection, db } from '../firebase';
import { addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';

const MaterialsContext = createContext();

export const MaterialsProvider = ({ children }) => {
    const { materials, isLoading: isGlobalDataLoading } = useGlobalData();

    const [materialsCollectionRef, setMaterialsCollectionRef] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [openCategories, setOpenCategories] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ category: '', supplier: '', brand: '' });

    useEffect(() => {
        setMaterialsCollectionRef(getMaterialsCollection());
    }, []);

    const FILTER_FIELDS_CONFIG = [
        { key: 'category', label: 'Category' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'brand', label: 'Brand' }
    ];
    const SEARCH_FIELDS = ['materialName', 'supplier', 'brand', 'itemCode'];

    const filterOptions = useMemo(() => {
        const options = {};
        FILTER_FIELDS_CONFIG.forEach(({ key }) => {
            options[key] = [...new Set(materials.map(item => item[key]).filter(Boolean))].sort();
        });
        return options;
    }, [materials]);

    const filteredMaterials = useMemo(() => {
        let result = [...materials];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                SEARCH_FIELDS.some(field =>
                    item[field] && typeof item[field] === 'string' && item[field].toLowerCase().includes(term)
                )
            );
        }
        Object.keys(filters).forEach(field => {
            if (filters[field]) {
                result = result.filter(item => item[field] === filters[field]);
            }
        });
        return result;
    }, [materials, searchTerm, filters]);

    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ category: '', supplier: '', brand: '' });
    };

    const groupedMaterials = useMemo(() => {
        const categoryOrder = [
            'Bulk Insulation', 'Fire Protection', 'Subfloor', 'Acoustic Pipe Lag',
            'Wall Wrap', 'Consumables', 'Rigid Wall/Soffit', 'XPS'
        ];
        const acc = filteredMaterials.reduce((accum, material) => {
            const category = material.category || 'Uncategorized';
            if (!accum[category]) accum[category] = [];
            accum[category].push(material);
            return accum;
        }, {});
        const ordered = {};
        categoryOrder.forEach(cat => {
            if (acc[cat]) ordered[cat] = acc[cat];
        });
        Object.keys(acc).forEach(cat => {
            if (!ordered[cat]) ordered[cat] = acc[cat];
        });
        return ordered;
    }, [filteredMaterials]);

    const handleSave = async (data) => {
        if (!materialsCollectionRef) return;
        if (editingMaterial) {
            await updateDoc(doc(materialsCollectionRef, editingMaterial.id), data);
        } else {
            await addDoc(materialsCollectionRef, data);
        }
        setIsModalOpen(false);
        setEditingMaterial(null);
    };

    const handleDelete = async () => {
        if (!materialToDelete || !materialsCollectionRef) return;
        await deleteDoc(doc(materialsCollectionRef, materialToDelete.id));
        setMaterialToDelete(null);
    };

    const handleClearDatabase = async () => {
        if (!materialsCollectionRef) return;
        const snapshot = await getDocs(materialsCollectionRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        setIsClearing(false);
    };

    const openAddModal = () => {
        setEditingMaterial(null);
        setIsModalOpen(true);
    };

    const openEditModal = (material) => {
        setEditingMaterial(material);
        setIsModalOpen(true);
    };

    const toggleCategory = (category) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const value = {
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
        isLoading: isGlobalDataLoading,
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
    };

    return (
        <MaterialsContext.Provider value={value}>
            {children}
        </MaterialsContext.Provider>
    );
};

export const useMaterials = () => {
    const context = useContext(MaterialsContext);
    if (context === undefined) {
        throw new Error('useMaterials must be used within a MaterialsProvider');
    }
    return context;
};