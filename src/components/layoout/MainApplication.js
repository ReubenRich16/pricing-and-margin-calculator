import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase'; // Firebase config and authentication
import Dashboard from '../pages/Dashboard'; // Dashboard view
import MaterialsManager from '../pages/MaterialsManager'; // Materials CRUD
import LabourManager from '../pages/LabourManager'; // Labour CRUD
import Calculator from '../pages/Calculator'; // Quote worksheet calculator
import { Briefcase, Wrench, Hammer, LogOut } from 'lucide-react';

/**
 * MainApplication
 * 
 * Purpose:
 * - Top-level layout and navigation for the Pricing Calculator app.
 * - Handles primary views: Dashboard, Materials, Labour, Calculator.
 * - Manages worksheet navigation state (for editing/creating quotes).
 */
const MainApplication = () => {
    // --- State: Current view and active worksheet (for calculator) ---
    const [view, setView] = useState('dashboard');
    const [activeWorksheet, setActiveWorksheet] = useState(null);

    // --- Logout handler ---
    const handleLogout = async () => {
        await signOut(auth);
    };

    // --- Navigation handlers ---
    const navigateToCalculator = (worksheet) => {
        setActiveWorksheet(worksheet);
        setView('calculator');
    };
    const navigateToDashboard = () => {
        setActiveWorksheet(null);
        setView('dashboard');
    };

    return (
        <>
            {/* Header and Navigation */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center space-x-6">
                            <h1 className="text-xl font-bold text-gray-800">Pricing Calculator</h1>
                            <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                                {/* Dashboard Tab */}
                                <button
                                    onClick={navigateToDashboard}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                                >
                                    <Briefcase size={16} className="mr-2" />Dashboard
                                </button>
                                {/* Materials Tab */}
                                <button
                                    onClick={() => setView('materials')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${view === 'materials' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                                >
                                    <Wrench size={16} className="mr-2" />Materials
                                </button>
                                {/* Labour Tab */}
                                <button
                                    onClick={() => setView('labour')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${view === 'labour' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                                >
                                    <Hammer size={16} className="mr-2" />Labour
                                </button>
                            </nav>
                        </div>
                        {/* Logout */}
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Welcome!</span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-sm text-gray-500 hover:text-red-600"
                            >
                                <LogOut size={16} className="mr-1" />Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            {/* Main Content Area */}
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {view === 'dashboard' && <Dashboard onEditWorksheet={navigateToCalculator} />}
                {view === 'materials' && <MaterialsManager />}
                {view === 'labour' && <LabourManager />}
                {view === 'calculator' && <Calculator worksheet={activeWorksheet} onBack={navigateToDashboard} />}
            </main>
        </>
    );
};

export default MainApplication;
