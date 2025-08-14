import React from 'react';
import { Search, Filter } from 'lucide-react';

/**
 * FilterBar
 * Shared UI for search and filter controls.
 * 
 * Props:
 * - searchTerm, setSearchTerm
 * - filters, setFilters
 * - filterOptions: { [field]: [option1, ...] }
 * - showFilters, setShowFilters
 * - resetFilters
 * - fields: [{ key, label }]
 */
const FilterBar = ({
    searchTerm, setSearchTerm,
    filters, setFilters,
    filterOptions,
    showFilters, setShowFilters,
    resetFilters,
    fields
}) => (
    <div className="mb-6">
        <div className="flex space-x-2 mb-2">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-10 w-full p-2 border rounded-md"
                />
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-md ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
            >
                <Filter size={16} className="mr-2" /> Filters
            </button>
        </div>
        
        {showFilters && (
            <div className="bg-gray-50 p-4 rounded-md border">
                <div className={`grid grid-cols-1 md:grid-cols-${fields.length} gap-4`}>
                    {fields.map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <select 
                                value={filters[key]}
                                onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                                className="w-full p-2 border rounded-md bg-white"
                            >
                                <option value="">All {label}</option>
                                {filterOptions[key].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={resetFilters}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>
        )}
    </div>
);

export default FilterBar;
