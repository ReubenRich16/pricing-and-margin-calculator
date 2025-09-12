// src/App.js
// --- App Entry Component ---
// Handles user authentication and application initialization.
// Renders MainApplication when authenticated, or an error/loading screen otherwise.

import React from 'react'; // No need for useState, useEffect
import MainApplication from './components/layout/MainApplication';
import { useAuth } from './contexts/AuthContext'; // Import useAuth

// --- Main App Logic ---
const App = () => {
    const { currentUser, loadingAuth } = useAuth(); // Consume AuthContext

    console.log("App: Rendering App - currentUser:", currentUser, "loadingAuth:", loadingAuth); // DEBUG

    // --- Loading State ---
    if (loadingAuth) {
        return <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authenticating...</p></div>;
    }

    // --- Main Render ---
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {currentUser ? <MainApplication /> : <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authentication failed. Please refresh.</p></div>}
        </div>
    );
};

export default App;