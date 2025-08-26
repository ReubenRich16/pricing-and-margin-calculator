// src/utils/formatRValue.js

/**
 * Formats an R-value for display.
 * Always returns a string like "R6.0" or "R2.5".
 * If input is empty or falsy, returns an empty string.
 * If input already starts with "R", returns as-is.
 */
const formatRValue = rv =>
  rv ? (String(rv).toUpperCase().startsWith('R') ? String(rv) : `R${rv}`) : '';

export default formatRValue;