import React from 'react';
import { Search, Filter } from 'lucide-react';

/**
 * FilterBar
 * Shared UI for search and filter controls.
 *
 * Tailwind Note:
 * We replaced the dynamic class "md:grid-cols-${fields.length}" with a
 * deterministic mapping so Tailwind's JIT can detect and retain all
 * possible grid column classes during purging.
 */

const getResponsiveGridColsClass = (count) => {
    // Cap columns to a reasonable upper bound to avoid layout overflow.
    const c = Math.min(count, 5);
    switch (c) {
        case 1: return 'md:grid-cols-1';
        case 2: return 'md:grid-cols-2';
        case 3: return 'md:grid-cols-3';
        case 4: return 'md:grid-cols-4';
        case 5: return 'md:grid-cols-5';
        default: return 'md:grid-cols-1';
    }
};

const FilterBar = ({
    searchTerm, setSearchTerm,
    filters, setFilters,
    filterOptions,
    showFilters, setShowFilters,
    resetFilters,
    fields
}) => {
    const gridColsClass = getResponsiveGridColsClass(fields.length);

    return (
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
                    <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
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
};

export default FilterBar;