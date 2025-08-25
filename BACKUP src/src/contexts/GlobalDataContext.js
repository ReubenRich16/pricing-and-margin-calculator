// src/contexts/GlobalDataContext.js
// Revised for Bug #1: Auth race & resilient listener lifecycle

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import {
    getMaterialsCollection,
    getLabourRatesCollection,
    getCustomersCollection,
    auth
} from '../firebase';
import { onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const GlobalDataContext = createContext();

export const GlobalDataProvider = ({ children }) => {
    const [materials, setMaterials] = useState([]);
    const [labourRates, setLabourRates] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Track current authenticated user UID
    const [userUid, setUserUid] = useState(null);

    // Store unsubscribe functions so we can clean up on user change
    const unsubRefs = useRef({ materials: null, labour: null, customers: null });

    // Listen for auth changes
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            setUserUid(user ? user.uid : null);
        });
        return () => unsubAuth();
    }, []);

    // Attach Firestore listeners when userUid changes
    useEffect(() => {
        // Cleanup any existing listeners
        Object.values(unsubRefs.current).forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        unsubRefs.current = { materials: null, labour: null, customers: null };

        if (!userUid) {
            // Waiting for authentication
            setIsLoading(true);
            setMaterials([]);
            setLabourRates([]);
            setCustomers([]);
            return;
        }

        setIsLoading(true);
        const materialsRef = getMaterialsCollection();
        const labourRatesRef = getLabourRatesCollection();
        const customersRef = getCustomersCollection();

        if (!(materialsRef && labourRatesRef && customersRef)) {
            // Should rarely occur once userUid is set
            setIsLoading(true);
            return;
        }

        let gotMaterials = false;
        let gotLabour = false;
        let gotCustomers = false;

        const maybeFinishLoading = () => {
            if (gotMaterials && gotLabour && gotCustomers) {
                setIsLoading(false);
            }
        };

        try {
            unsubRefs.current.materials = onSnapshot(
                materialsRef,
                snap => {
                    setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    gotMaterials = true;
                    maybeFinishLoading();
                },
                err => {
                    console.error('Materials listener error:', err);
                    gotMaterials = true;
                    maybeFinishLoading();
                }
            );
            unsubRefs.current.labour = onSnapshot(
                labourRatesRef,
                snap => {
                    setLabourRates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    gotLabour = true;
                    maybeFinishLoading();
                },
                err => {
                    console.error('Labour rates listener error:', err);
                    gotLabour = true;
                    maybeFinishLoading();
                }
            );
            unsubRefs.current.customers = onSnapshot(
                customersRef,
                snap => {
                    setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    gotCustomers = true;
                    maybeFinishLoading();
                },
                err => {
                    console.error('Customers listener error:', err);
                    gotCustomers = true;
                    maybeFinishLoading();
                }
            );
        } catch (e) {
            console.error('Failed to initialize data listeners:', e);
            setIsLoading(false);
        }

        return () => {
            Object.values(unsubRefs.current).forEach(unsub => {
                if (typeof unsub === 'function') unsub();
            });
        };
    }, [userUid]);

    const value = {
        materials,
        labourRates,
        customers,
        isLoading
    };

    return (
        <GlobalDataContext.Provider value={value}>
            {children}
        </GlobalDataContext.Provider>
    );
};

export const useGlobalData = () => {
    const context = useContext(GlobalDataContext);
    if (context === undefined) {
        throw new Error('useGlobalData must be used within a GlobalDataProvider');
    }
    return context;
};