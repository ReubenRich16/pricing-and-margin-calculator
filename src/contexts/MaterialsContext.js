// src/contexts/MaterialsContext.js
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useAuth } from './AuthContext';

const MaterialsContext = createContext();

export const useMaterials = () => {
    return useContext(MaterialsContext);
};

const AuthenticatedMaterialsProvider = ({ children, currentUser }) => {
    const collectionPath = `artifacts/${currentUser.uid}/materials`;
    const { data: materials, loading, error } = useFirestoreCollection(collectionPath);

    const addMaterial = useCallback(async (material) => {
        await addDoc(collection(db, collectionPath), material);
    }, [collectionPath]);

    const updateMaterial = useCallback(async (id, updatedMaterial) => {
        const materialDoc = doc(db, 'artifacts', currentUser.uid, 'materials', id);
        await updateDoc(materialDoc, updatedMaterial);
    }, [currentUser.uid]);

    const deleteMaterial = useCallback(async (id) => {
        const materialDoc = doc(db, 'artifacts', currentUser.uid, 'materials', id);
        await deleteDoc(materialDoc);
    }, [currentUser.uid]);
    
    const value = useMemo(() => ({
        materials, loading, error, addMaterial, updateMaterial, deleteMaterial,
    }), [materials, loading, error, addMaterial, updateMaterial, deleteMaterial]);

    return <MaterialsContext.Provider value={value}>{children}</MaterialsContext.Provider>;
};

export const MaterialsProvider = ({ children }) => {
    const { currentUser } = useAuth();

    if (currentUser) {
        return <AuthenticatedMaterialsProvider currentUser={currentUser}>{children}</AuthenticatedMaterialsProvider>;
    }

    const emptyValue = {
        materials: [], loading: false, error: null,
        addMaterial: async () => console.error("Not authenticated"),
        updateMaterial: async () => console.error("Not authenticated"),
        deleteMaterial: async () => console.error("Not authenticated"),
    };
    
    return <MaterialsContext.Provider value={emptyValue}>{children}</MaterialsContext.Provider>;
};