import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import MainApplication from './components/MainApplication';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            } else {
                try {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) {
                        await signInWithCustomToken(auth, token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Automatic sign-in failed:", error);
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authenticating...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {user ? <MainApplication /> : <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authentication failed. Please refresh.</p></div>}
        </div>
    );
};

export default App;
