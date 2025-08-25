// AU localisation: “Initializing” -> “Initialising”
import React from 'react';
import { useLabour } from '../contexts/LabourContext';
import { Plus, Trash2, Edit, Upload } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CSVImporter from '../components/common/CSVImporter';
import LabourModal from '../components/labour/LabourModal';
import FilterBar from '../components/common/FilterBar';

const labourFieldMappings = {
    'Application': { name: 'application', type: 'string', required: true },
    'Area': { name: 'area', type: 'string', required: true, isMatchKey: true },
    'Timber Frame': { name: 'timberRate', type: 'number' },
    'Steel Frame': { name: 'steelRate', type: 'number' },
    'Unit': { name: 'unit', type: 'string' },
    'Notes/Conditions': { name: 'notes', type: 'string' },
    'Keywords': { name: 'keywords', type: 'array' },
};

const LabourManagerUI = () => {
    const {
        groupedLabourRates,
        isModalOpen,
        editingRate,
        rateToDelete,
        isImporting,
        showFilters,
        searchTerm,
        filters,
        filterOptions,
        FILTER_FIELDS_CONFIG,
        labourRatesCollectionRef,
        isLoading,
        setIsModalOpen,
        setRateToDelete,
        setIsImporting,
        setShowFilters,
        setSearchTerm,
        setFilters,
        resetFilters,
        handleSave,
        handleDelete,
        openAddModal,
        openEditModal,
    } = useLabour();

    if (isLoading) {
        return <div className="text-center p-8 text-gray-500">Initialising Labour Rates...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Labour Rates Database</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setIsImporting(true)} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"><Upload size={18} className="mr-2" /> Import CSV</button>
                    <button onClick={openAddModal} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"><Plus size={18} className="mr-2" /> Add Labour Rate</button>
                </div>
            </div>
            <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                resetFilters={resetFilters}
                fields={FILTER_FIELDS_CONFIG}
            />
            <div className="space-y-6">
                {groupedLabourRates.length > 0 ? (
                    groupedLabourRates.map(([application, rates]) => (
                        <div key={application}>
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">{application} ({rates.length})</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area / Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timber Rate</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Steel Rate</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {rates.map((rate) => (
                                            <tr key={rate.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.area}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(rate.timberRate || 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(rate.steelRate || 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rate.unit}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => openEditModal(rate)} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                                                    <button onClick={() => setRateToDelete(rate)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                     <div className="text-center py-8 text-gray-500">
                        No labour rates found matching your search criteria.
                        {(searchTerm || Object.values(filters).some(f => f)) && (
                            <button
                                onClick={resetFilters}
                                className="block mx-auto mt-2 text-blue-500 hover:underline"
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                )}
            </div>
            {isModalOpen && <LabourModal rate={editingRate} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isImporting && <CSVImporter collectionRef={labourRatesCollectionRef} fieldMappings={labourFieldMappings} onComplete={() => setIsImporting(false)} />}
            {rateToDelete && (<ConfirmationModal title="Delete Labour Rate" message={`Are you sure you want to delete "${rateToDelete.area}"? This action cannot be undone.`} confirmText="Delete" onConfirm={handleDelete} onCancel={() => setRateToDelete(null)} />)}
        </div>
    );
};

const LabourManager = () => (
    <LabourManagerUI />
);

export default LabourManager;