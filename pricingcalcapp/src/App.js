// src/App.js
// --- App Entry Component ---
// Handles user authentication and application initialization.
// Renders MainApplication when authenticated, or an error/loading screen otherwise.

import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import MainApplication from './components/layout/MainApplication';

// --- Main App Logic ---
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Authentication Flow ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            } else {
                try {
                    // Just sign in anonymously
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Automatic sign-in failed:", error);
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // --- Loading State ---
    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authenticating...</p></div>;
    }

    // --- Main Render ---
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {user ? <MainApplication /> : <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authentication failed. Please refresh.</p></div>}
        </div>
    );
};

export default App;