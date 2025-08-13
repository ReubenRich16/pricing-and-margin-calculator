import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';

const appId = 'default-app-id';

const Dashboard = ({ onEditWorksheet }) => {
    const [worksheets, setWorksheets] = useState([]);
    const worksheetsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'worksheets');

    useEffect(() => {
        const unsubscribe = onSnapshot(worksheetsCollectionRef, (snapshot) => {
            setWorksheets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Quote Worksheets</h2>
                <button onClick={() => onEditWorksheet(null)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"><Plus size={18} className="mr-2" /> New Worksheet</button>
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.siteAddress}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(w.totalCustomerPrice || 0).toFixed(2)}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${w.profitMarginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(w.profitMarginPercentage || 0).toFixed(2)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEditWorksheet(w)} className="text-indigo-600 hover:text-indigo-900 mr-4">Open</button>
                                    <button onClick={async () => { if(window.confirm('Delete?')) await deleteDoc(doc(worksheetsCollectionRef, w.id)) }} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;