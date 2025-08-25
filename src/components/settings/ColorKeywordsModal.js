// src/components/settings/ColorKeywordsModal.js
import React, { useState } from 'react';
import { useColorKeywords } from '../../contexts/ColorKeywordsContext';
import { X, PlusCircle, Trash2 } from 'lucide-react';

const ColorKeywordsModal = ({ onClose }) => {
    const { colorKeywords, addColorKeyword, updateColorKeyword, deleteColorKeyword } = useColorKeywords();
    const [newKeyword, setNewKeyword] = useState('');
    const [newColors, setNewColors] = useState('');

    const handleAdd = () => {
        if (!newKeyword.trim()) return;
        const colorsArray = newColors.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
        addColorKeyword({ keyword: newKeyword, colours: colorsArray });
        setNewKeyword('');
        setNewColors('');
    };

    const handleUpdate = (id, field, value) => {
        const keywordDoc = colorKeywords.find(k => k.id === id);
        if (!keywordDoc) return;
        
        let updatedData;
        if (field === 'colours') {
            const colorsArray = value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
            updatedData = { ...keywordDoc, colours: colorsArray };
        } else {
            updatedData = { ...keywordDoc, [field]: value };
        }
        
        const { id: docId, ...dataToUpdate } = updatedData;
        updateColorKeyword(id, dataToUpdate);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Manage Colour Keywords</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Keyword</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Associated Colours (comma-separated)</th>
                                <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(colorKeywords || []).map(item => (
                                <tr key={item.id}>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.keyword}
                                            onChange={(e) => handleUpdate(item.id, 'keyword', e.target.value)}
                                            className="w-full p-1 border rounded-md"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={(item.colours || []).join(', ')}
                                            onChange={(e) => handleUpdate(item.id, 'colours', e.target.value)}
                                            className="w-full p-1 border rounded-md"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => deleteColorKeyword(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {/* Row for adding a new item */}
                            <tr>
                                <td className="p-2">
                                    <input
                                        type="text"
                                        placeholder="New Keyword"
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        className="w-full p-1 border rounded-md"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="text"
                                        placeholder="RED, BLUE, GREEN"
                                        value={newColors}
                                        onChange={(e) => setNewColors(e.target.value)}
                                        className="w-full p-1 border rounded-md"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={handleAdd} className="text-green-600 hover:text-green-800"><PlusCircle size={18} /></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ColorKeywordsModal;