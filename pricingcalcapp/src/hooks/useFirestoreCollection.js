// src/hooks/useFirestoreCollection.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

// Ensure the "export" keyword is here
export const useFirestoreCollection = (collectionName) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!collectionName) {
            setLoading(false);
            return;
        };

        setLoading(true);
        setError(null);

        try {
            const collectionRef = collection(db, collectionName);
            const q = query(collectionRef);

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const docs = [];
                querySnapshot.forEach((doc) => {
                    docs.push({ id: doc.id, ...doc.data() });
                });
                setData(docs);
                setLoading(false);
            }, (err) => {
                console.error(`Error listening to ${collectionName}:`, err);
                setError(`Failed to load ${collectionName}. Please check your connection and try again.`);
                setLoading(false);
            });

            return () => unsubscribe();

        } catch (err) {
            console.error(`Error creating query for ${collectionName}:`, err);
            setError(`An unexpected error occurred while fetching ${collectionName}.`);
            setLoading(false);
        }

    }, [collectionName]);

    return { data, loading, error };
};