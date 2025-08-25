import React, { useState, useEffect } from 'react';
import { getWorksheetsCollection } from '../firebase';
import { onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';

const Dashboard = ({ onEditWorksheet }) => {
    const [worksheets, setWorksheets] = useState([]);
    const [worksheetToDelete, setWorksheetToDelete] = useState(null);
    const [worksheetsCollectionRef, setWorksheetsCollectionRef] = useState(null);

    useEffect(() => {
        setWorksheetsCollectionRef(getWorksheetsCollection());
    }, []);

    useEffect(() => {
        if (!worksheetsCollectionRef) return;
        const unsubscribe = onSnapshot(worksheetsCollectionRef, (snapshot) => {
            setWorksheets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [worksheetsCollectionRef]);

    const handleDelete = async () => {
        if (!worksheetToDelete || !worksheetsCollectionRef) return;
        await deleteDoc(doc(worksheetsCollectionRef, worksheetToDelete.id));
        setWorksheetToDelete(null);
    };

    // AU spelling: Colour
    const getMarginColour = (margin) => {
        if (margin >= 20) return 'text-green-600';
        if (margin >= 10) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (!worksheetsCollectionRef) {
        return <div className="text-center p-8 text-gray-500">Initialising User Data...</div>;
    }

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">Quote Worksheets</h2>
                    <button onClick={() => onEditWorksheet(null)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <Plus size={18} className="mr-2" /> New Worksheet
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit Margin</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {worksheets.map((w) => (
                                <tr key={w.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.worksheetName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${(w.summary?.totalPriceIncGst || 0).toFixed(2)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getMarginColour(w.summary?.actualMargin)}`}>
                                        {(w.summary?.actualMargin || 0).toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => onEditWorksheet(w)} className="text-indigo-600 hover:text-indigo-900 mr-4">Open</button>
                                        <button onClick={() => setWorksheetToDelete(w)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {worksheetToDelete && (
                <ConfirmationModal
                    title="Delete Worksheet"
                    message={`Are you sure you want to delete "${worksheetToDelete.worksheetName}"? This action cannot be undone.`}
                    confirmText="Delete"
                    onConfirm={handleDelete}
                    onCancel={() => setWorksheetToDelete(null)}
                />
            )}
        </>
    );
};

export default Dashboard;