import React, { useState, useMemo } from 'react';
import { useLabour } from '../contexts/LabourContext';
import { getLabourRatesCollection, deleteEntireCollection } from '../firebase';
import LabourModal from '../components/labour/LabourModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CSVImporter from '../components/common/CSVImporter';
import FilterBar from '../components/common/FilterBar';
import { PlusCircle, Edit, Trash2, ChevronDown, ChevronRight, Upload, Trash } from 'lucide-react';
<<<<<<< Updated upstream
import { filterBySearchTerm } from '../utils/filter';
=======
import { filterBySearchTerm } from '../utils/filter'; // <--- Import utility
>>>>>>> Stashed changes

const labourFilterConfig = [
  { key: 'search', type: 'text', placeholder: 'Search by description or application...' }
];

const LabourManager = () => {
    const { labourRates = [], loading, error, addLabourRate, updateLabourRate, deleteLabourRate } = useLabour();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isDeleteDbConfirmOpen, setIsDeleteDbConfirmOpen] = useState(false);
    const [currentRate, setCurrentRate] = useState(null);
    const [rateToDelete, setRateToDelete] = useState(null);
    const [filters, setFilters] = useState({ search: "" });
    const [collapsed, setCollapsed] = useState({});

    // Use centralized filter utility
    const filteredRates = useMemo(() =>
<<<<<<< Updated upstream
        filterBySearchTerm(labourRates, filters.search, ['description', 'application', 'notes', 'unit']),
        [labourRates, filters.search]
=======
        filterBySearchTerm(labourRates, searchTerm, ['description', 'application', 'notes', 'unit']),
        [labourRates, searchTerm]
>>>>>>> Stashed changes
    );

    const groupedRates = useMemo(() => {
        const grouped = filteredRates.reduce((acc, r) => {
            const category = r.application || 'Uncategorised';
            if (!acc[category]) acc[category] = [];
            acc[category].push(r);
            return acc;
        }, {});
        // Sort rates within each category
        for (const category in grouped) {
            grouped[category].sort((a, b) => a.description.localeCompare(b.description));
        }
        return grouped;
    },[filteredRates]);

    const handleSave = (data) => {
        if (currentRate) {
            updateLabourRate(currentRate.id, data);
        } else {
            addLabourRate(data);
        }
        setIsModalOpen(false);
    };

    const handleDeleteDatabase = async () => {
        try {
            await deleteEntireCollection('labourRates');
            alert('Labour rates database has been successfully cleared.');
        } catch (err) {
            alert('An error occurred while deleting the database.');
        }
        setIsDeleteDbConfirmOpen(false);
    };

    const labourFieldMappings = {
        'Area': { name: 'description', required: true, isMatchKey: true },
        'Application': { name: 'application' },
        'Timber Frame': { name: 'timberRate', type: 'number' },
        'Steel Frame': { name: 'steelRate', type: 'number' },
        'Unit': { name: 'unit' },
        'Keywords': { name: 'keywords', type: 'array' },
        'Notes/Conditions': { name: 'notes' },
    };

    if (loading) return <div className="p-4">Loading labour rates...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Labour Manager</h1>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setIsImportOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center gap-2"><Upload size={20} /> Import CSV</button>
                        <button onClick={() => { setCurrentRate(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"><PlusCircle size={20} /> Add New</button>
                         <button onClick={() => setIsDeleteDbConfirmOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 flex items-center gap-2"><Trash size={20} /> Delete Database</button>
                    </div>
                </div>

                <FilterBar
<<<<<<< Updated upstream
                  filters={filters}
                  onFilterChange={setFilters}
=======
                  filters={{ search: searchTerm }}
                  onFilterChange={updated => setSearchTerm(updated.search)}
>>>>>>> Stashed changes
                  filterConfig={labourFilterConfig}
                />

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    {Object.keys(groupedRates).sort().map(category => (
                         <div key={category}>
                            <button onClick={() => setCollapsed(p => ({...p, [category]: !p[category]}))} className="w-full flex justify-between items-center bg-gray-100 p-3 font-semibold text-left">
                                <span>{category} ({groupedRates[category].length})</span>
                                {collapsed[category] ? <ChevronRight size={20}/> : <ChevronDown size={20}/>}
                            </button>
                            {!collapsed[category] && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Timber Rate</th>
                                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Steel Rate</th>
                                                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
                                                <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {groupedRates[category].map(r => (
                                                <tr key={r.id}>
                                                    <td className="p-3 font-medium">{r.description}</td>
                                                    <td className="p-3">${(r.timberRate || 0).toFixed(2)}</td>
                                                    <td className="p-3">${(r.steelRate || 0).toFixed(2)}</td>
                                                    <td className="p-3">{r.unit}</td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => { setCurrentRate(r); setIsModalOpen(true); }} className="text-blue-500 mr-2"><Edit size={18}/></button>
                                                        <button onClick={() => { setRateToDelete(r); setIsConfirmOpen(true); }} className="text-red-500"><Trash2 size={18}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && <LabourModal rate={currentRate} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
<<<<<<< Updated upstream
            {isConfirmOpen && <ConfirmationModal title="Delete Labour Rate" message={`Delete ${rateToDelete?.description}?`} onConfirm={() => { deleteLabourRate(rateToDelete.id); setIsConfirmOpen(false); }} onClose={() => setIsConfirmOpen(false)} />}
            {isImportOpen && <CSVImporter isOpen={isImportOpen} collectionRef={getLabourRatesCollection()} fieldMappings={labourFieldMappings} onComplete={() => setIsImportOpen(false)} />}
=======
            {isConfirmOpen && <ConfirmationModal title="Delete Labour Rate" message={`Delete ${rateToDelete.description}?`} onConfirm={() => { deleteLabourRate(rateToDelete.id); setIsConfirmOpen(false); }} onClose={() => setIsConfirmOpen(false)} />}
            {isImportOpen && <CSVImporter collectionRef={getLabourRatesCollection()} fieldMappings={labourFieldMappings} onComplete={() => setIsImportOpen(false)} />}
>>>>>>> Stashed changes
            {isDeleteDbConfirmOpen && <ConfirmationModal title="Delete Entire Labour Database" message="Are you absolutely sure? This will permanently delete all labour rates and cannot be undone." onConfirm={handleDeleteDatabase} onClose={() => setIsDeleteDbConfirmOpen(false)} />}
        </div>
    );
};

export default LabourManager;