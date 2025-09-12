// src/contexts/DriversContext.js
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useAuth } from './AuthContext';

const DriversContext = createContext();

export const useDrivers = () => useContext(DriversContext);

const AuthenticatedDriversProvider = ({ children, currentUser }) => {
    const collectionPath = `artifacts/${currentUser.uid}/drivers`;
    const { data: drivers, loading, error } = useFirestoreCollection(collectionPath);

    const addDriver = useCallback(async (driverData) => {
        await addDoc(collection(db, collectionPath), driverData);
    }, [collectionPath]);

    const updateDriver = useCallback(async (id, updatedData) => {
        const driverDoc = doc(db, collectionPath, id);
        await updateDoc(driverDoc, updatedData);
    }, [collectionPath]);

    const deleteDriver = useCallback(async (id) => {
        const driverDoc = doc(db, collectionPath, id);
        await deleteDoc(driverDoc);
    }, [collectionPath]);

    const value = useMemo(() => ({
        drivers, loading, error, addDriver, updateDriver, deleteDriver,
    }), [drivers, loading, error, addDriver, updateDriver, deleteDriver]);

    return <DriversContext.Provider value={value}>{children}</DriversContext.Provider>;
};

export const DriversProvider = ({ children }) => {
    const { currentUser } = useAuth();
    if (!currentUser) {
        const emptyValue = { drivers: [], loading: true, error: new Error("User not authenticated.") };
        return <DriversContext.Provider value={emptyValue}>{children}</DriversContext.Provider>;
    }
    return <AuthenticatedDriversProvider currentUser={currentUser}>{children}</AuthenticatedDriversProvider>;
};

