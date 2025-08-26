// src/hooks/useFirestoreCollection.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

export const useFirestoreCollection = (collectionName) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // If collectionName is null or undefined (e.g., while waiting for user auth),
        // don't try to fetch.
        if (!collectionName) {
            setData([]);
            setLoading(false);
            return;
        };

        setLoading(true);
        setError(null);

        try {
            const collectionRef = collection(db, collectionName);
            const q = query(collectionRef);

            // onSnapshot listens for real-time updates
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

            // Cleanup subscription on component unmount
            return () => unsubscribe();

        } catch (err) {
            console.error(`Error creating query for ${collectionName}:`, err);
            setError(`An unexpected error occurred while fetching ${collectionName}.`);
            setLoading(false);
        }

    }, [collectionName]); // Re-run effect if collectionName changes

    return { data, loading, error };
};