// src/contexts/CustomersContext.js
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useAuth } from './AuthContext';

const CustomersContext = createContext();

export const useCustomers = () => {
    return useContext(CustomersContext);
};

// This component now receives the user as a prop.
const AuthenticatedCustomersProvider = ({ children, currentUser }) => {
    const collectionPath = `artifacts/${currentUser.uid}/customers`;
    const { data: customers, loading, error } = useFirestoreCollection(collectionPath);

    const addCustomer = useCallback(async (customer) => {
        await addDoc(collection(db, collectionPath), customer);
    }, [collectionPath]);

    const updateCustomer = useCallback(async (id, updatedCustomer) => {
        const customerDoc = doc(db, 'artifacts', currentUser.uid, 'customers', id);
        await updateDoc(customerDoc, updatedCustomer);
    }, [currentUser.uid]);

    const deleteCustomer = useCallback(async (id) => {
        const customerDoc = doc(db, 'artifacts', currentUser.uid, 'customers', id);
        await deleteDoc(customerDoc);
    }, [currentUser.uid]);

    const value = useMemo(() => ({
        customers, loading, error, addCustomer, updateCustomer, deleteCustomer,
    }), [customers, loading, error, addCustomer, updateCustomer, deleteCustomer]);

    return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
};

// The main provider gets the user and passes it down as a prop.
export const CustomersProvider = ({ children }) => {
    const { currentUser } = useAuth();

    if (currentUser) {
        return <AuthenticatedCustomersProvider currentUser={currentUser}>{children}</AuthenticatedCustomersProvider>;
    }

    const emptyValue = {
        customers: [], loading: false, error: null,
        addCustomer: async () => console.error("Not authenticated"),
        updateCustomer: async () => console.error("Not authenticated"),
        deleteCustomer: async () => console.error("Not authenticated"),
    };

    return <CustomersContext.Provider value={emptyValue}>{children}</CustomersContext.Provider>;
};