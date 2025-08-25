// src/contexts/CustomersContext.js
import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { useGlobalData } from './GlobalDataContext'; // Import global data hook
import { getCustomersCollection } from '../firebase';
import { addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const CustomersContext = createContext();

export const CustomersProvider = ({ children }) => {
    // --- Consume Global Data ---
    const { customers, isLoading: isGlobalDataLoading } = useGlobalData();

    // --- Local UI & Modal State (Data fetching is REMOVED) ---
    const [customersCollectionRef, setCustomersCollectionRef] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setCustomersCollectionRef(getCustomersCollection());
    }, []);

    // --- Search Logic now uses global `customers` state ---
    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return customers;
        const term = searchTerm.toLowerCase();
        return customers.filter(customer =>
            customer.name?.toLowerCase().includes(term) ||
            customer.contactPerson?.toLowerCase().includes(term) ||
            customer.email?.toLowerCase().includes(term) ||
            customer.phone?.toLowerCase().includes(term) ||
            customer.notes?.toLowerCase().includes(term)
        );
    }, [customers, searchTerm]);

    // --- Handlers (these are unchanged) ---
    const handleSave = async (data) => {
        if (!customersCollectionRef) return;
        if (editingCustomer) {
            await updateDoc(doc(customersCollectionRef, editingCustomer.id), data);
        } else {
            await addDoc(customersCollectionRef, data);
        }
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleDelete = async () => {
        if (!customerToDelete || !customersCollectionRef) return;
        await deleteDoc(doc(customersCollectionRef, customerToDelete.id));
        setCustomerToDelete(null);
    };

    const openAddModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const value = {
        filteredCustomers,
        isModalOpen,
        editingCustomer,
        customerToDelete,
        searchTerm,
        isLoading: isGlobalDataLoading,
        setIsModalOpen,
        setCustomerToDelete,
        setSearchTerm,
        handleSave,
        handleDelete,
        openAddModal,
        openEditModal,
    };

    return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
};

export const useCustomers = () => {
    const context = useContext(CustomersContext);
    if (context === undefined) {
        throw new Error('useCustomers must be used within a CustomersProvider');
    }
    return context;
};