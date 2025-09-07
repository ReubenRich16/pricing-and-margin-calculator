// src/components/common/FilterBar.js
import React from 'react';
import { Search } from 'lucide-react';

const FilterBar = ({ filters, onFilterChange, filterConfig }) => {

    const handleInputChange = (key, value) => {
        onFilterChange(prevFilters => ({
            ...prevFilters,
            [key]: value
        }));
    };

    const getResponsiveGridColsClass = (count) => {
        if (count <= 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
        if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    };

    const gridColsClass = getResponsiveGridColsClass(filterConfig.length);

    return (
        <div className={`mb-4 grid gap-4 ${gridColsClass} items-center`}>
            {filterConfig.map(config => {
                const { key, type, placeholder, options } = config;
                
                if (type === 'text') {
                    return (
                        <div key={key} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={filters[key] || ''}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                placeholder={placeholder || "Search..."}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            />
                        </div>
                    );
                }

                if (type === 'select') {
                    return (
                         <div key={key} className="relative">
                             <select
                                value={filters[key] || ''}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{placeholder || `Filter by ${key}`}</option>
                                {(options || []).map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    );
                }
                
                return null;
            })}
        </div>
    );
};

export default FilterBar;