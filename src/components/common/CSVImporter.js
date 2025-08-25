// src/components/common/CSVImporter.js
// Bug #4: Performance improvement – prefetch existing docs once instead of N queries.

import React, { useState } from 'react';
import { writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const CSVImporter = ({ collectionRef, fieldMappings, onComplete }) => {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState('upload'); // upload, mapping, preview
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
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

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        setFile(f);
        setError('');
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                let lines = event.target.result.split(/\r\n|\n/);
                if (lines[0]?.charCodeAt(0) === 0xFEFF) {
                    lines[0] = lines[0].substring(1);
                }
                const parsedHeaders = parseCSVLine(lines[0]).map(h => h.trim());
                setHeaders(parsedHeaders);

                const defaultMapping = {};
                Object.keys(fieldMappings).forEach(dbField => {
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

    const handleMappingChange = (dbField, csvHeader) => {
        setMapping(prev => ({ ...prev, [dbField]: csvHeader }));
    };

    const handlePreview = async () => {
        setError('');
        setIsProcessing(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                let lines = event.target.result.split(/\r\n|\n/);
                if (lines[0]?.charCodeAt(0) === 0xFEFF) {
                    lines[0] = lines[0].substring(1);
                }
                const dataRows = lines.slice(1).filter(l => l.trim());

                const matchDbField = Object.keys(fieldMappings).find(f => fieldMappings[f].isMatchKey);
                if (!matchDbField) {
                    setError('A field mapping must be marked isMatchKey: true.');
                    setIsProcessing(false);
                    return;
                }
                const matchCsvHeader = mapping[matchDbField];
                if (!matchCsvHeader) {
                    setError('Please map the match key field.');
                    setIsProcessing(false);
                    return;
                }

                // Prefetch existing documents (suitable for moderate collection sizes)
                const existingSnapshot = await getDocs(collectionRef);
                const matchFieldName = fieldMappings[matchDbField].name;
                const existingMap = new Map();
                existingSnapshot.forEach(d => {
                    const data = d.data();
                    if (data && data[matchFieldName] !== undefined && data[matchFieldName] !== null) {
                        existingMap.set(String(data[matchFieldName]).trim(), d.id);
                    }
                });

                const toCreate = [];
                const toUpdate = [];
                const toSkip = [];
                const errors = [];

                for (const line of dataRows) {
                    const values = parseCSVLine(line);
                    if (values.length === 1 && values[0] === '') continue;

                    const rowData = {};
                    Object.keys(fieldMappings).forEach(dbField => {
                        const csvHeader = mapping[dbField];
                        if (!csvHeader) return;
                        const idx = headers.indexOf(csvHeader);
                        let value = idx >= 0 ? values[idx] : '';

                        if (fieldMappings[dbField].type === 'number') {
                            value = parseFloat(String(value).replace(/[$ ,]/g, '')) || 0;
                        } else if (fieldMappings[dbField].type === 'array') {
                            value = String(value)
                                .split(';')
                                .map(s => s.trim())
                                .filter(Boolean);
                        } else {
                            value = typeof value === 'string' ? value.trim() : value;
                        }
                        rowData[dbField] = value;
                    });

                    const missingRequired = Object.keys(fieldMappings).filter(dbField =>
                        fieldMappings[dbField].required &&
                        (rowData[dbField] === undefined || rowData[dbField] === '')
                    );
                    if (missingRequired.length > 0) {
                        toSkip.push({
                            ...rowData,
                            _error: `Missing required: ${missingRequired.join(', ')}`
                        });
                        continue;
                    }

                    const matchValueRaw = rowData[matchDbField];
                    const matchValueKey = matchValueRaw !== undefined && matchValueRaw !== null
                        ? String(matchValueRaw).trim()
                        : '';

                    const mappedRow = {};
                    Object.keys(rowData).forEach(dbField => {
                        mappedRow[fieldMappings[dbField].name] = rowData[dbField];
                    });

                    if (matchValueKey && existingMap.has(matchValueKey)) {
                        toUpdate.push({ id: existingMap.get(matchValueKey), ...mappedRow });
                    } else {
                        toCreate.push(mappedRow);
                    }
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

    const handleImport = async () => {
        if (!preview) return;
        setIsProcessing(true);
        try {
            const batch = writeBatch(db);
            preview.toCreate.forEach(item => {
                const docRef = doc(collectionRef);
                batch.set(docRef, item);
            });
            preview.toUpdate.forEach(item => {
                const { id, ...data } = item;
                const docRef = doc(collectionRef, id);
                batch.update(docRef, data);
            });
            await batch.commit();
            // Reset
            setStep('upload');
            setFile(null);
            setPreview(null);
            setHeaders([]);
            setMapping({});
            setError('');
            setIsProcessing(false);
            if (onComplete) onComplete();
        } catch (err) {
            setError('Import failed: ' + err.message);
            setIsProcessing(false);
        }
    };

    const requiredFields = Object.keys(fieldMappings).filter(f => fieldMappings[f].required);
    const missingMappings = requiredFields.filter(dbField => !mapping[dbField]);
    const isMappingValid = missingMappings.length === 0;

    if (step === 'upload') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                    <h3 className="text-lg font-semibold mb-4">Import from CSV</h3>
                    <p className="text-sm text-gray-600 mb-2">Upload a CSV file to bulk update your data.</p>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="w-full p-2 border rounded-md"
                    />
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
                    <p className="text-sm text-gray-600 mb-2">Match your CSV columns to database fields.</p>
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
                                <td className="px-2 py-1 text-sm font-medium text-gray-700">
                                    {dbField}
                                    {fieldMappings[dbField].required &&
                                        <span className="text-red-500 ml-1">*</span>}
                                    {fieldMappings[dbField].isMatchKey &&
                                        <span className="ml-2 text-xs font-semibold text-blue-600">(Match Key)</span>}
                                </td>
                                <td className="px-2 py-1">
                                    <select
                                        value={mapping[dbField] || ''}
                                        onChange={(e) => handleMappingChange(dbField, e.target.value)}
                                        className={`w-full p-1 border rounded-md bg-white text-sm ${fieldMappings[dbField].required && !mapping[dbField] ? 'border-red-500' : ''}`}
                                    >
                                        <option value="">-- Select Column --</option>
                                        {headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {missingMappings.length > 0 && (
                        <div className="text-red-500 text-sm mb-3">
                            Please map all required fields: {missingMappings.join(', ')}
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setStep('upload')}
                            className="px-4 py-2 bg-gray-200 rounded-md"
                        >
                            Back
                        </button>
                        <button
                            onClick={handlePreview}
                            disabled={!isMappingValid || isProcessing}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${(!isMappingValid || isProcessing) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? 'Processing...' : 'Preview Import'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'preview') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                    <h3 className="text-lg font-semibold mb-4">Preview Import</h3>
                    {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div className="bg-blue-50 p-3 rounded-md">
                            <div className="text-2xl font-bold text-blue-700">{preview?.toCreate.length || 0}</div>
                            <div className="text-sm font-medium text-blue-600">New Records</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                            <div className="text-2xl font-bold text-green-700">{preview?.toUpdate.length || 0}</div>
                            <div className="text-sm font-medium text-green-600">To Update</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-md">
                            <div className="text-2xl font-bold text-red-700">{preview?.toSkip.length || 0}</div>
                            <div className="text-sm font-medium text-red-600">Skipped</div>
                        </div>
                    </div>

                    {preview?.toSkip.length > 0 && (
                        <div className="max-h-32 overflow-y-auto bg-red-50 rounded-md p-2 mb-4 text-xs font-mono text-red-700 border border-red-300">
                            <p className="font-bold mb-1">Skipped Rows (first 5):</p>
                            {preview.toSkip.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="truncate">
                                    {JSON.stringify(item)}
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-gray-600 mb-2">
                        Data preview (first 5 of each):
                    </p>
                    <div className="max-h-32 overflow-y-auto bg-gray-100 rounded-md p-2 mb-4 text-xs font-mono">
                        {preview?.toCreate.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="text-blue-700 truncate">
                                Create: {JSON.stringify(item)}
                            </div>
                        ))}
                        {preview?.toUpdate.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="text-green-700 truncate">
                                Update: {JSON.stringify(item)}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setStep('mapping')}
                            className="px-4 py-2 bg-gray-200 rounded-md"
                        >
                            Back to Mapping
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={isProcessing || ((preview?.toCreate.length || 0) + (preview?.toUpdate.length || 0) === 0)}
                            className={`px-4 py-2 bg-green-600 text-white rounded-md ${(isProcessing || ((preview?.toCreate.length || 0) + (preview?.toUpdate.length || 0) === 0)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? 'Importing...' : 'Confirm and Import'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CSVImporter;