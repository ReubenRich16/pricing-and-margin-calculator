// src/contexts/AuthContext.js - Attempting to force re-compilation
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        console.log("AuthContext: useEffect - Setting up auth state listener."); // DEBUG
        const unsubscribe = onAuthStateChanged(auth, async user => {
            console.log("AuthContext: onAuthStateChanged triggered. User:", user); // DEBUG
            if (user) {
                setCurrentUser(user);
                setLoading(false);
                console.log("AuthContext: User found, setting currentUser and loading=false."); // DEBUG
            } else {
                console.log("AuthContext: No user found. Attempting anonymous sign-in..."); // DEBUG
                try {
                    const userCredential = await signInAnonymously(auth);
                    setCurrentUser(userCredential.user); // Set user from credential
                    setLoading(false);
                    console.log("AuthContext: Anonymous sign-in successful. User:", userCredential.user); // DEBUG
                } catch (error) {
                    console.error("AuthContext: Anonymous sign-in failed:", error); // DEBUG
                    setLoading(false); // Ensure loading is false even on error
                }
            }
        });

        return () => {
            console.log("AuthContext: useEffect cleanup - Unsubscribing from auth listener."); // DEBUG
            unsubscribe();
        };
    }, []);

    const value = useMemo(() => ({
        currentUser,
        loadingAuth: loading
    }), [currentUser, loading]);

    console.log("AuthContext: Rendering AuthProvider - currentUser:", currentUser, "loadingAuth:", loading); // DEBUG

    return (
        <AuthContext.Provider value={value}>
            {/* Render children only when authentication state is resolved */}
            {loading ? (
                <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authenticating...</p></div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};