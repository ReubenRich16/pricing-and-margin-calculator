// src/contexts/LabourContext.js
import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { useGlobalData } from './GlobalDataContext'; // Import global data hook
import { getLabourRatesCollection } from '../firebase';
import { addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const LabourContext = createContext();

export const LabourProvider = ({ children }) => {
    // --- Consume Global Data ---
    const { labourRates, isLoading: isGlobalDataLoading } = useGlobalData();

    // --- Local UI & Modal State (Data fetching is REMOVED) ---
    const [labourRatesCollectionRef, setLabourRatesCollectionRef] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [rateToDelete, setRateToDelete] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ application: '', unit: '' });

    useEffect(() => {
        setLabourRatesCollectionRef(getLabourRatesCollection());
    }, []);

    // --- Search, Filter, and Grouping logic now uses global `labourRates` state ---
    const FILTER_FIELDS_CONFIG = [
        { key: 'application', label: 'Application' },
        { key: 'unit', label: 'Unit' }
    ];
    const SEARCH_FIELDS = ['area', 'notes', 'application', 'keywords'];

    const filterOptions = useMemo(() => {
        const options = {};
        FILTER_FIELDS_CONFIG.forEach(({ key }) => {
            options[key] = [...new Set(labourRates.map(item => item[key]).filter(Boolean))].sort();
        });
        return options;
    }, [labourRates]);

    const filteredLabourRates = useMemo(() => {
        let result = [...labourRates];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                SEARCH_FIELDS.some(field =>
                    (Array.isArray(item[field]) && item[field].some(k => k.toLowerCase().includes(term))) ||
                    (typeof item[field] === 'string' && item[field].toLowerCase().includes(term))
                )
            );
        }
        Object.keys(filters).forEach(field => {
            if (filters[field]) {
                result = result.filter(item => item[field] === filters[field]);
            }
        });
        return result;
    }, [labourRates, searchTerm, filters]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ application: '', unit: '' });
    };

    const groupedLabourRates = useMemo(() => {
        const acc = filteredLabourRates.reduce((acc, rate) => {
            const category = rate.application || 'Uncategorized';
            (acc[category] = acc[category] || []).push(rate);
            return acc;
        }, {});
        return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredLabourRates]);

    // --- Handlers (these are unchanged) ---
    const handleSave = async (data) => {
        if (!labourRatesCollectionRef) return;
        if (editingRate) await updateDoc(doc(labourRatesCollectionRef, editingRate.id), data);
        else await addDoc(labourRatesCollectionRef, data);
        setIsModalOpen(false);
        setEditingRate(null);
    };

    const handleDelete = async () => {
        if (!rateToDelete || !labourRatesCollectionRef) return;
        await deleteDoc(doc(labourRatesCollectionRef, rateToDelete.id));
        setRateToDelete(null);
    };

    const openAddModal = () => {
        setEditingRate(null);
        setIsModalOpen(true);
    };

    const openEditModal = (rate) => {
        setEditingRate(rate);
        setIsModalOpen(true);
    };

    const value = {
        groupedLabourRates,
        isModalOpen,
        editingRate,
        rateToDelete,
        isImporting,
        showFilters,
        searchTerm,
        filters,
        filterOptions,
        FILTER_FIELDS_CONFIG,
        labourRatesCollectionRef,
        isLoading: isGlobalDataLoading,
        setIsModalOpen,
        setRateToDelete,
        setIsImporting,
        setShowFilters,
        setSearchTerm,
        setFilters,
        resetFilters,
        handleSave,
        handleDelete,
        openAddModal,
        openEditModal,
    };

    return <LabourContext.Provider value={value}>{children}</LabourContext.Provider>;
};

export const useLabour = () => {
    const context = useContext(LabourContext);
    if (context === undefined) {
        throw new Error('useLabour must be used within a LabourProvider');
    }
    return context;
};