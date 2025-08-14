import { useState, useMemo } from 'react';

/**
 * useSearchFilters
 * Centralizes search/filter state and filtering logic.
 * 
 * @param {Array} items - The data array to filter.
 * @param {Object} config - { filterFields: Array, searchFields: Array }
 * @returns [filteredItems, searchTerm, setSearchTerm, filters, setFilters, resetFilters]
 */
export default function useSearchFilters(items, { filterFields, searchFields }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState(
        Object.fromEntries(filterFields.map(f => [f, '']))
    );

    // --- Filter options (unique values from items) ---
    const filterOptions = useMemo(() => {
        const options = {};
        filterFields.forEach(field => {
            options[field] = [...new Set(items.map(item => item[field]).filter(Boolean))];
        });
        return options;
    }, [items, filterFields]);

    // --- Filtered results ---
    const filteredItems = useMemo(() => {
        let result = [...items];
        // Apply search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                searchFields.some(field =>
                    typeof item[field] === 'string' && item[field].toLowerCase().includes(term)
                )
            );
        }
        // Apply filters
        filterFields.forEach(field => {
            if (filters[field]) {
                result = result.filter(item => item[field] === filters[field]);
            }
        });
        return result;
    }, [items, searchTerm, filters, filterFields, searchFields]);

    const resetFilters = () => {
        setSearchTerm('');
        setFilters(Object.fromEntries(filterFields.map(f => [f, ''])));
    };

    return [filteredItems, searchTerm, setSearchTerm, filters, setFilters, filterOptions, resetFilters];
}
