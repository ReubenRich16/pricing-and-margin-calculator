// src/contexts/LabourContext.js
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useAuth } from './AuthContext';

const LabourContext = createContext();

export const useLabour = () => {
    return useContext(LabourContext);
};

// This component now receives the user as a prop, eliminating any timing issues.
const AuthenticatedLabourProvider = ({ children, currentUser }) => {
    const collectionPath = `artifacts/${currentUser.uid}/labourRates`;
    const { data: labourRates, loading, error } = useFirestoreCollection(collectionPath);

    const addLabourRate = useCallback(async (rate) => {
        await addDoc(collection(db, collectionPath), rate);
    }, [collectionPath]);

    const updateLabourRate = useCallback(async (id, updatedRate) => {
        const labourDoc = doc(db, 'artifacts', currentUser.uid, 'labourRates', id);
        await updateDoc(labourDoc, updatedRate);
    }, [currentUser.uid]);

    const deleteLabourRate = useCallback(async (id) => {
        const labourDoc = doc(db, 'artifacts', currentUser.uid, 'labourRates', id);
        await deleteDoc(labourDoc);
    }, [currentUser.uid]);

    const value = useMemo(() => ({
        labourRates, loading, error, addLabourRate, updateLabourRate, deleteLabourRate,
    }), [labourRates, loading, error, addLabourRate, updateLabourRate, deleteLabourRate]);

    return <LabourContext.Provider value={value}>{children}</LabourContext.Provider>;
};

// The main provider gets the user and passes it down as a prop.
export const LabourProvider = ({ children }) => {
    const { currentUser } = useAuth();

    if (currentUser) {
        return <AuthenticatedLabourProvider currentUser={currentUser}>{children}</AuthenticatedLabourProvider>;
    }

    const emptyValue = {
        labourRates: [], loading: false, error: null,
        addLabourRate: async () => console.error("Not authenticated"),
        updateLabourRate: async () => console.error("Not authenticated"),
        deleteLabourRate: async () => console.error("Not authenticated"),
    };

    return <LabourContext.Provider value={emptyValue}>{children}</LabourContext.Provider>;
};