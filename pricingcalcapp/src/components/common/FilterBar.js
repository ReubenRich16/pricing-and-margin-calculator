//src/components/common/FilterBar.js
import React from 'react';

const FilterBar = ({ filters = {}, onFilterChange, filterConfig = [] }) => {
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        onFilterChange({});
    };

    const hasActiveFilters = Object.values(filters).some(value => value && value.length > 0);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border">
            <div className="flex flex-wrap gap-4 items-center">
                {filterConfig.map((config) => (
                    <div key={config.key} className="flex flex-col">
                        {config.type === 'text' && (
                            <input
                                type="text"
                                placeholder={config.placeholder}
                                value={filters[config.key] || ''}
                                onChange={(e) => handleFilterChange(config.key, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                            />
                        )}
                        {config.type === 'select' && (
                            <select
                                value={filters[config.key] || ''}
                                onChange={(e) => handleFilterChange(config.key, e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                            >
                                <option value="">{config.placeholder}</option>
                                {(config.options || []).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
                
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    );
};

export default FilterBar;