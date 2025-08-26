// src/components/common/CSVImporter.js
import React, { useState } from 'react';
import { writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const CSVImporter = ({ isOpen, collectionRef, fieldMappings, onComplete }) => {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState('upload'); // upload, mapping, preview
    const [headers, setHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

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
                Object.keys(fieldMappings).forEach(csvHeader => {
                    const match = parsedHeaders.find(h => h.toLowerCase() === csvHeader.toLowerCase());
                    if (match) {
                        defaultMapping[csvHeader] = match;
                    }
                });
                setMapping(defaultMapping);
                setStep('mapping');
            } catch (err) {
                setError('Could not parse CSV headers.');
            }
        };
        reader.readAsText(f);
    };

    const handleMappingChange = (csvHeader, mappedHeader) => {
        setMapping(prev => ({ ...prev, [csvHeader]: mappedHeader }));
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

                let matchCsvHeader = null;
                for (const key in fieldMappings) {
                    if (fieldMappings[key].isMatchKey) {
                        matchCsvHeader = key;
                        break;
                    }
                }

                if (!matchCsvHeader) {
                    setError('A field mapping must be marked isMatchKey: true.');
                    setIsProcessing(false);
                    return;
                }

                const matchDbField = fieldMappings[matchCsvHeader].name;

                const existingSnapshot = await getDocs(collectionRef);
                const existingMap = new Map();
                existingSnapshot.forEach(d => {
                    const data = d.data();
                    if (data && data[matchDbField] !== undefined && data[matchDbField] !== null) {
                        existingMap.set(String(data[matchDbField]).trim(), d.id);
                    }
                });

                const toCreate = [];
                const toUpdate = [];
                const toSkip = [];

                for (const line of dataRows) {
                    const values = parseCSVLine(line);
                    if (values.length === 1 && values[0] === '') continue;

                    const rowData = {};
                    Object.keys(fieldMappings).forEach(csvHeader => {
                        const mappedHeader = mapping[csvHeader];
                        if (!mappedHeader) return;

                        const idx = headers.indexOf(mappedHeader);
                        let value = idx >= 0 ? values[idx] : '';
                        
                        const config = fieldMappings[csvHeader];
                        const dbField = config.name;

                        if (config.type === 'number') {
                            value = parseFloat(String(value).replace(/[$ ,]/g, '')) || 0;
                        } else if (config.type === 'array') {
                            value = String(value).split(',').map(s => s.trim()).filter(Boolean);
                        } else {
                            value = typeof value === 'string' ? value.trim() : value;
                        }
                        rowData[dbField] = value;
                    });

                    const missingRequired = Object.keys(fieldMappings).filter(csvHeader =>
                        fieldMappings[csvHeader].required &&
                        (rowData[fieldMappings[csvHeader].name] === undefined || rowData[fieldMappings[csvHeader].name] === '')
                    );

                    if (missingRequired.length > 0) {
                        toSkip.push({ ...rowData, _error: `Missing required fields` });
                        continue;
                    }

                    const matchValue = String(rowData[matchDbField] || '').trim();
                    if (matchValue && existingMap.has(matchValue)) {
                        toUpdate.push({ id: existingMap.get(matchValue), ...rowData });
                    } else {
                        toCreate.push(rowData);
                    }
                }

                setPreview({ toCreate, toUpdate, toSkip });
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
            onComplete();
        } catch (err) {
            setError('Import failed: ' + err.message);
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
                {step === 'upload' && (
                    <>
                        <h3 className="text-lg font-semibold mb-4">Import from CSV</h3>
                        <p className="text-sm text-gray-600 mb-2">Upload a CSV file to bulk add or update your data.</p>
                        <input type="file" accept=".csv" onChange={handleFileChange} className="w-full p-2 border rounded-md" />
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        <div className="mt-6 flex justify-end">
                            <button onClick={onComplete} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        </div>
                    </>
                )}
                {step === 'mapping' && (
                    <>
                         <h3 className="text-lg font-semibold mb-4">Map CSV Columns</h3>
                         <p className="text-sm text-gray-600 mb-2">Match your CSV columns to the database fields. The system will try to auto-match them.</p>
                         <div className="max-h-96 overflow-y-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-sm font-semibold p-2">CSV Header</th>
                                        <th className="text-left text-sm font-semibold p-2">Database Field</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {Object.keys(fieldMappings).map(csvHeader => (
                                    <tr key={csvHeader}>
                                        <td className="p-2 font-medium">{csvHeader} {fieldMappings[csvHeader].required && <span className="text-red-500">*</span>}</td>
                                        <td className="p-2">
                                            <select value={mapping[csvHeader] || ''} onChange={e => handleMappingChange(csvHeader, e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                                <option value="">-- Do not import --</option>
                                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                         </div>
                         <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={() => setStep('upload')} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
                            <button onClick={handlePreview} disabled={isProcessing} className="px-4 py-2 bg-blue-600 text-white rounded-md">{isProcessing ? "Processing..." : "Preview"}</button>
                         </div>
                    </>
                )}
                 {step === 'preview' && (
                     <>
                        <h3 className="text-lg font-semibold mb-4">Preview Import</h3>
                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                             <div className="bg-blue-100 p-2 rounded">
                                <div className="text-xl font-bold">{preview.toCreate.length}</div>
                                <div className="text-sm">New Records</div>
                             </div>
                             <div className="bg-green-100 p-2 rounded">
                                <div className="text-xl font-bold">{preview.toUpdate.length}</div>
                                <div className="text-sm">Records to Update</div>
                             </div>
                              <div className="bg-yellow-100 p-2 rounded">
                                <div className="text-xl font-bold">{preview.toSkip.length}</div>
                                <div className="text-sm">Skipped Records</div>
                             </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                        <div className="flex justify-end space-x-4 mt-4">
                            <button onClick={() => setStep('mapping')} className="px-4 py-2 bg-gray-200 rounded-md">Back</button>
                            <button onClick={handleImport} disabled={isProcessing} className="px-4 py-2 bg-green-600 text-white rounded-md">{isProcessing ? "Importing..." : "Confirm & Import"}</button>
                        </div>
                     </>
                 )}
            </div>
        </div>
    );
};

export default CSVImporter;