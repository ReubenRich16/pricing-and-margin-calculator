// src/utils/filter.js

/**
 * Bulletproof filter utility for searching objects by a search term.
 * - Checks all property values in each object.
 * - Case-insensitive.
 * - Handles strings, numbers, booleans, arrays.
 * - Never throws on .toLowerCase; always returns '' for null/undefined/objects.
 * 
 * @param {Array<Object>} data - Array of objects to filter
 * @param {string} searchTerm - Search string (case-insensitive)
 * @param {Array<string>} fields - Optional: only check these fields (if provided)
 * @returns {Array<Object>} filtered array
 */
export function filterBySearchTerm(data, searchTerm, fields = null) {
    if (!Array.isArray(data)) return [];
    if (!searchTerm || !searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();

    return data.filter(item => {
        // If fields specified, only consider those keys; otherwise, all top-level fields
        const values = fields ? fields.map(f => item[f]) : Object.values(item);

        return values.some(val => {
            if (typeof val === 'string') {
                return val.toLowerCase().includes(term);
            }
            if (typeof val === 'number' || typeof val === 'boolean') {
                return String(val).toLowerCase().includes(term);
            }
            if (Array.isArray(val)) {
                // Search all array elements
                return val.some(v =>
                    typeof v === 'string'
                        ? v.toLowerCase().includes(term)
                        : typeof v === 'number' || typeof v === 'boolean'
                            ? String(v).toLowerCase().includes(term)
                            : false
                );
            }
            return false; // null, undefined, object
        });
    });
}