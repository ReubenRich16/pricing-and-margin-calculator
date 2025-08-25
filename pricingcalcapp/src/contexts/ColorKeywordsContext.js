// src/contexts/ColorKeywordsContext.js
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useAuth } from './AuthContext';

const ColorKeywordsContext = createContext();

export const useColorKeywords = () => {
    return useContext(ColorKeywordsContext);
};

// This uses a top-level collection, assuming colour keywords are shared across the whole company.
const AuthenticatedColorKeywordsProvider = ({ children }) => {
    const collectionPath = 'colourKeywords';
    const { data: colorKeywords, loading, error } = useFirestoreCollection(collectionPath);

    const addColorKeyword = useCallback(async (keywordData) => {
        await addDoc(collection(db, collectionPath), keywordData);
    }, [collectionPath]);

    const updateColorKeyword = useCallback(async (id, updatedData) => {
        const keywordDoc = doc(db, collectionPath, id);
        await updateDoc(keywordDoc, updatedData);
    }, [collectionPath]);

    const deleteColorKeyword = useCallback(async (id) => {
        const keywordDoc = doc(db, collectionPath, id);
        await deleteDoc(keywordDoc);
    }, [collectionPath]);

    const value = useMemo(() => ({
        colorKeywords, loading, error, addColorKeyword, updateColorKeyword, deleteColorKeyword,
    }), [colorKeywords, loading, error, addColorKeyword, updateColorKeyword, deleteColorKeyword]);

    return <ColorKeywordsContext.Provider value={value}>{children}</ColorKeywordsContext.Provider>;
};

export const ColorKeywordsProvider = ({ children }) => {
    const { currentUser } = useAuth();

    if (currentUser) {
        return <AuthenticatedColorKeywordsProvider>{children}</AuthenticatedColorKeywordsProvider>;
    }

    const emptyValue = {
        colorKeywords: [], loading: false, error: null,
        addColorKeyword: async () => console.error("Not authenticated"),
        updateColorKeyword: async () => console.error("Not authenticated"),
        deleteColorKeyword: async () => console.error("Not authenticated"),
    };
    
    return <ColorKeywordsContext.Provider value={emptyValue}>{children}</ColorKeywordsContext.Provider>;
};