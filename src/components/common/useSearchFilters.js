import { useState, useMemo } from 'react';

/**
 * useSearchFilters
 * Centralizes search/filter state and filtering logic for any dataset.
 *
 * @param {Array} items - The data to filter.
 * @param {Object} config - { filterFields: Array, searchFields: Array }
 * @returns [filteredItems, searchTerm, setSearchTerm, filters, setFilters, filterOptions, resetFilters]
 */
export default function useSearchFilters(items, { filterFields, searchFields }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState(
        Object.fromEntries(filterFields.map(f => [f, '']))
    );

    // Unique options for each filter field
    const filterOptions = useMemo(() => {
        const options = {};
        filterFields.forEach(field => {
            options[field] = [...new Set(items.map(item => item[field]).filter(Boolean))];
        });
        return options;
    }, [items, filterFields]);

    const filteredItems = useMemo(() => {
        let result = [...items];
        // Apply search
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
