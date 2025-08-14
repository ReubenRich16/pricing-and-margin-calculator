import React, { useState } from 'react';
import { writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Corrected Path

/**
 * CSVImporter - Step-based modal for bulk importing to Firestore
 * Features:
 * - Step 1: Upload CSV
 * - Step 2: Map CSV columns to DB fields
 * - Step 3: Preview records to create/update/skip
 * - Step 4: Commit batch import to Firestore
 * - Handles required fields, type casting, error handling
 */
const CSVImporter = ({ collectionRef, fieldMappings, onComplete }) => {
    // --- State ---
    const [file, setFile] = useState(null);
    const [step, setStep] = useState('upload'); // upload, mapping, preview
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // --- CSV parsing utility ---
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
    };

    // --- Step 1: File upload and header extraction ---
    const handleFileChange = (e) => {
        const f = e.target.files[0];
        setFile(f);
        setError('');
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                let lines = event.target.result.split(/\r\n|\n/);
                if (lines[0].charCodeAt(0) === 0xFEFF) {
                    lines[0] = lines[0].substring(1);
                }
                const parsedHeaders = parseCSVLine(lines[0]).map(h => h.trim());
                setHeaders(parsedHeaders);

                // Default mapping: auto-match header to fieldMappings by key
                const defaultMapping = {};
                Object.keys(fieldMappings).forEach((dbField) => {
                    const match = parsedHeaders.find(h => h.toLowerCase() === dbField.toLowerCase());
                    defaultMapping[dbField] = match || '';
                });
                setMapping(defaultMapping);
                setStep('mapping');
            } catch (err) {
                setError('Could not parse CSV headers.');
            }
        };
        reader.readAsText(f);
    };

    // --- Step 2: Manual mapping UI ---
    const handleMappingChange = (dbField, csvHeader) => {
        setMapping(prev => ({ ...prev, [dbField]: csvHeader }));
    };

    // --- Step 3: Preview import results ---
    const handlePreview = async () => {
        setError('');
        setIsProcessing(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                let lines = event.target.result.split(/\r\n|\n/);
                if (lines[0].charCodeAt(0) === 0xFEFF) {
                    lines[0] = lines[0].substring(1);
                }
                const mappedHeaders = headers;
                const dataRows = lines.slice(1).filter(l => l.trim());
                const data = dataRows.map(line => {
                    const values = parseCSVLine(line);
                    const obj = {};
                    Object.keys(fieldMappings).forEach(dbField => {
                        const csvHeader = mapping[dbField];
                        if (!csvHeader) return;
                        const idx = mappedHeaders.indexOf(csvHeader);
                        let value = values[idx] ?? '';
                        // Type casting
                        if (fieldMappings[dbField].type === 'number') value = parseFloat(String(value).replace('$', '').replace(',', '')) || 0;
                        if (fieldMappings[dbField].type === 'array') value = value.split(';').map(s => s.trim());
                        obj[dbField] = value;
                    });
                    return obj;
                });
                // Find match key
                const matchKey = Object.keys(fieldMappings).find(dbField => fieldMappings[dbField].isMatchKey);
                const matchKeyName = fieldMappings[matchKey]?.name || matchKey;
                const snapshot = await getDocs(collectionRef);
                const existingDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                let toCreate = [];
                let toUpdate = [];
                let toSkip = [];
                let errors = [];

                for (const row of data) {
                    // Check required fields
                    const missingRequired = Object.keys(fieldMappings).filter(dbField =>
                        fieldMappings[dbField].required && (!row[dbField] || row[dbField] === '')
                    );
                    if (missingRequired.length > 0 || !row[matchKey]) {
                        toSkip.push({ ...row, missingRequired });
                        continue;
                    }
                    const mappedRow = {};
                    Object.keys(fieldMappings).forEach(dbField => {
                        mappedRow[fieldMappings[dbField].name] = row[dbField];
                    });
                    const existing = existingDocs.find(d => d[matchKeyName] === mappedRow[matchKeyName]);
                    if (existing) toUpdate.push({ id: existing.id, ...mappedRow });
                    else toCreate.push(mappedRow);
                }
                setPreview({ toCreate, toUpdate, toSkip, errors });
                setStep('preview');
                setIsProcessing(false);
            };
            reader.readAsText(file);
        } catch (err) {
            setError('Error parsing CSV for preview: ' + (err.message || err));
            setIsProcessing(false);
        }
    };

    // --- Step 4: Commit batch import ---
    const handleImport = async () => {
        setIsProcessing(true);
        try {
            const batch = writeBatch(db);
            preview.toCreate.forEach(item => {
                const docRef = doc(collectionRef);
                batch.set(docRef, item);
            });
            preview.toUpdate.forEach(item => {
                const docRef = doc(collectionRef, item.id);
                batch.update(docRef, item);
            });
            await batch.commit();
            setStep('upload');
            setFile(null);
            setPreview(null);
            setHeaders([]);
            setMapping({});
            setError('');
            setIsProcessing(false);
            onComplete();
        } catch (err) {
            setError('Import failed: ' + err.message);
            setIsProcessing(false);
        }
    };

    // --- Mapping completeness checks ---
    const requiredFields = Object.keys(fieldMappings).filter(f => fieldMappings[f].required);
    const missingMappings = requiredFields.filter(dbField => !mapping[dbField]);
    const isMappingValid = missingMappings.length === 0;
    const canImport = file && isMappingValid;

    // --- UI rendering ---
    if (step === 'upload') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                    <h3 className="text-lg font-semibold mb-4">Import from CSV</h3>
                    <p className="text-sm text-gray-600 mb-2">Upload a CSV file to bulk update your data.</p>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="w-full p-2 border rounded-md" />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end">
                        <button onClick={onComplete} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'mapping') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
                    <h3 className="text-lg font-semibold mb-4">Map CSV Columns</h3>
                    <p className="text-sm text-gray-600 mb-2">Match your CSV columns to the required fields.</p>
                    <table className="min-w-full mb-6">
                        <thead>
                            <tr>
                                <th className="px-2 py-1 text-left text-xs font-semibold text-gray-500">Database Field</th>
                                <th className="px-2 py-1 text-left text-xs font-semibold text-gray-500">CSV Column</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(fieldMappings).map(dbField => (
                                <tr key={dbField}>
                                    <td className={`px-2 py-1 text-xs font-medium text-gray-600 ${fieldMappings[dbField].required ? 'font-bold text-red-600' : ''}`}>
                                        {dbField}
                                        {fieldMappings[dbField].required && <span className="text-red-500 ml-1">*</span>}
                                    </td>
                                    <td className="px-2 py-1">
                                        <select
                                            value={mapping[dbField]}
                                            onChange={(e) => handleMappingChange(dbField, e.target.value)}
                                            className={`w-full p-1 border rounded-md bg-white text-xs ${fieldMappings[dbField].required && !mapping[dbField] ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">-- No Mapping --</option>
                                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {missingMappings.length > 0 &&
                        <div className="text-red-500 text-sm mb-3">
                            Please map all required fields before proceeding: {missingMappings.join(', ')}
                        </div>
                    }
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                    <div className="flex justify-end space-x-4">
                        <button onClick={() => setStep('upload')} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button
                            onClick={handlePreview}
                            disabled={!isMappingValid}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${!isMappingValid ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >Preview Import</button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'preview') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl">
                    <h3 className="text-lg font-semibold mb-4">Preview Import</h3>
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                    <ul className="text-sm mb-4">
                        <li><strong>{preview.toCreate.length}</strong> new records will be created</li>
                        <li><strong>{preview.toUpdate.length}</strong> existing records will be updated</li>
                        {preview.toSkip.length > 0 && <li><strong>{preview.toSkip.length}</strong> rows will be skipped (missing required fields)</li>}
                    </ul>
                    {preview.toSkip.length > 0 && (
                        <div className="max-h-32 overflow-y-auto bg-red-50 rounded-md p-2 mb-4 text-xs font-mono text-red-700 border border-red-300">
                            {preview.toSkip.slice(0, 3).map((item, idx) => (
                                <div key={idx}>
                                    Skip: {JSON.stringify(item)}
                                    {item.missingRequired && <span> (Missing: {item.missingRequired.join(', ')})</span>}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="max-h-32 overflow-y-auto bg-gray-100 rounded-md p-2 mb-4 text-xs font-mono">
                        {preview.toCreate.slice(0, 3).map((item, idx) => <div key={idx}>Create: {JSON.stringify(item)}</div>)}
                        {preview.toUpdate.slice(0, 3).map((item, idx) => <div key={idx}>Update: {JSON.stringify(item)}</div>)}
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button onClick={() => setStep('mapping')} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
                        <button
                            onClick={handleImport}
                            disabled={isProcessing || preview.toCreate.length + preview.toUpdate.length === 0}
                            className={`px-4 py-2 bg-green-600 text-white rounded-md ${isProcessing || preview.toCreate.length + preview.toUpdate.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? 'Importing...' : 'Import Data'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CSVImporter;
