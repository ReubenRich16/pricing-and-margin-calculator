// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiAQfKywpTslewwSliAYHyxSV3LPVjgoQ",
  authDomain: "pricing-and-margin-calculator.firebaseapp.com",
  projectId: "pricing-and-margin-calculator",
  storageBucket: "pricing-and-margin-calculator.firebasestorage.app",
  messagingSenderId: "298417414795",
  appId: "1:298417414795:web:b82bc178c078c4bd9a6a8e",
  measurementId: "G-CYKYR2KNHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// --- Main App Component ---
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            } else {
                try {
                    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (token) {
                        await signInWithCustomToken(auth, token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Automatic sign-in failed:", error);
                    setLoading(false);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authenticating...</p></div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {user ? <MainApplication /> : <div className="h-screen flex items-center justify-center bg-gray-100"><p>Authentication failed. Please refresh.</p></div>}
        </div>
    );
};


// --- Main Application Layout ---
const MainApplication = () => {
    const [view, setView] = useState('dashboard'); // dashboard, materials, labour, calculator
    const [activeWorksheet, setActiveWorksheet] = useState(null);

    const handleLogout = async () => {
        await signOut(auth);
    };
    
    const navigateToCalculator = (worksheet) => {
        setActiveWorksheet(worksheet);
        setView('calculator');
    }

    const navigateToDashboard = () => {
        setActiveWorksheet(null);
        setView('dashboard');
    }

    return (
        <>
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center space-x-6">
                            <h1 className="text-xl font-bold text-gray-800">Pricing Calculator</h1>
                            <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                                <button onClick={navigateToDashboard} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}><Briefcase size={16} className="mr-2"/>Dashboard</button>
                                <button onClick={() => setView('materials')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${view === 'materials' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}><Wrench size={16} className="mr-2"/>Materials</button>
                                <button onClick={() => setView('labour')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${view === 'labour' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}><Hammer size={16} className="mr-2"/>Labour</button>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Welcome!</span>
                            <button onClick={handleLogout} className="flex items-center text-sm text-gray-500 hover:text-red-600"><LogOut size={16} className="mr-1"/>Logout</button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {view === 'dashboard' && <Dashboard onEditWorksheet={navigateToCalculator} />}
                {view === 'materials' && <MaterialsManager />}
                {view === 'labour' && <LabourManager />}
                {view === 'calculator' && <Calculator worksheet={activeWorksheet} onBack={navigateToDashboard} />}
            </main>
        </>
    );
};

// --- Confirmation Modal ---
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" onClick={onConfirm} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">
                        Confirm
                    </button>
                    <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CSV Importer Component ---
const CSVImporter = ({ collectionRef, fieldMappings, onComplete }) => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
    };

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

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file.');
            return;
        }
        setIsProcessing(true);
        setError('');

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csv = event.target.result;
                let lines = csv.split(/\r\n|\n/);

                if (lines[0].charCodeAt(0) === 0xFEFF) {
                    lines[0] = lines[0].substring(1);
                }
                
                const headers = parseCSVLine(lines[0]).map(h => h.trim());
                
                const requiredHeaders = Object.keys(fieldMappings);
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h) && fieldMappings[h].required);
                if (missingHeaders.length > 0) {
                    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
                }

                const data = lines.slice(1).map(line => {
                    if (!line.trim()) return null;
                    const values = parseCSVLine(line);
                    const obj = {};
                    headers.forEach((header, index) => {
                        if (requiredHeaders.includes(header)) {
                            obj[header] = values[index] || '';
                        }
                    });
                    return obj;
                }).filter(obj => obj && obj[requiredHeaders.find(h => fieldMappings[h].isMatchKey)]);

                const batch = writeBatch(db);
                const existingDocsQuery = await getDocs(collectionRef);
                const existingDocs = existingDocsQuery.docs.map(d => ({id: d.id, ...d.data()}));

                for (const item of data) {
                    const mappedItem = {};
                    for (const key in fieldMappings) {
                        const targetField = fieldMappings[key].name;
                        let value = item[key];

                        if(value === undefined) continue;

                        if (key === 'R-Value' && typeof value === 'string') {
                           value = value.replace('R', '');
                        }

                        if (fieldMappings[key].type === 'number') {
                            value = parseFloat(String(value).replace('$', '').replace(',', '')) || 0;
                        } else if (fieldMappings[key].type === 'array') {
                            value = value.split(';').map(s => s.trim());
                        }
                        mappedItem[targetField] = value;
                    }
                    
                    const matchKey = fieldMappings[requiredHeaders.find(h => fieldMappings[h].isMatchKey)].name;
                    const existingDoc = existingDocs.find(d => d[matchKey] === mappedItem[matchKey]);

                    if (existingDoc) {
                        const docRef = doc(db, collectionRef.path, existingDoc.id);
                        batch.update(docRef, mappedItem);
                    } else {
                        const docRef = doc(collectionRef);
                        batch.set(docRef, mappedItem);
                    }
                }

                await batch.commit();
                onComplete();
            } catch (err) {
                setError(`Import failed: ${err.message}`);
                console.error(err);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-lg font-semibold mb-4">Import from CSV</h3>
                <p className="text-sm text-gray-600 mb-2">Upload a CSV file to bulk update your data. The file must contain the following columns, exactly as written:</p>
                <div className="bg-gray-100 p-2 rounded-md text-xs font-mono mb-4 h-32 overflow-y-auto">
                    {Object.keys(fieldMappings).join(', ')}
                </div>
                <input type="file" accept=".csv" onChange={handleFileChange} className="w-full p-2 border rounded-md" />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={onComplete} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleImport} disabled={isProcessing} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">
                        {isProcessing ? 'Processing...' : 'Import Data'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Materials Manager Configuration ---
const MATERIAL_DATABASE_CONFIG = {
    categoryOrder: [
        'Bulk Insulation',
        'Fire Protection',
        'Subfloor',
        'Acoustic Pipe Lag',
        'Wall Wrap',
        'Consumables',
        'Rigid Wall, Soffit',
        'XPS'
    ],
    brandOrder: ['Ecowool', 'Earthwool', 'Polyester'],
    productNameSortOrder: {
        'Ecowool': ['Thermal Ceiling & Floor Batt', 'Acoustic Floor & Wall Batt', 'Acoustic Partition Batt', 'Acoustic Partition Rolls'],
        'Earthwool': ['Thermal Ceiling & Floor Batt', 'Acoustic Floor & Wall Batt', 'Acoustic Partition Batt', 'Acoustic Partition Rolls'],
        'Polyester': ['Thermal Ceiling & Floor Batt', 'Thermal Wall Batt', 'Acoustic Floor & Wall Batt']
    },
    kingspanSortOrder: ['Kooltherm K10', 'Kooltherm K12']
};

// --- Materials Manager ---
const MaterialsManager = () => {
    const [materials, setMaterials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [variantSelections, setVariantSelections] = useState({});
    const materialsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'materials');

    const materialFieldMappings = {
        'Supplier': { name: 'supplier', type: 'string' },
        'Brand Name': { name: 'brand', type: 'string' },
        'Product Name': { name: 'materialName', type: 'string', required: true, isMatchKey: true },
        'Application': { name: 'category', type: 'string' },
        'R-Value': { name: 'rValue', type: 'string' },
        'Thickness (mm)': { name: 'thickness', type: 'number' },
        'Length (mm)': { name: 'length', type: 'number' },
        'Width (mm)': { name: 'width', type: 'number' },
        'm²/LM (bag/sheet/roll)': { name: 'm2PerUnit', type: 'number' },
        'Pieces per bag': { name: 'piecesPerBag', type: 'number' },
        'bags/sheet/rolls per pack': { name: 'unitsPerPack', type: 'number' },
        'm²/LM per pack': { name: 'm2PerPack', type: 'number' },
        'Item # / Code': { name: 'itemCode', type: 'string' },
        'Density (kg/m³)': { name: 'density', type: 'string' },
        'Notes': { name: 'notes', type: 'string' },
        'Cost/(M²/LM)': { name: 'costPerM2', type: 'number'},
        'Cost/Unit': { name: 'costPerUnit', type: 'number' },
        'Cost/Pack': { name: 'costPerPack', type: 'number' },
        'Sale Cost (bag/sheet/roll)': { name: 'salePrice', type: 'number' },
        'S+I Timber': { name: 'supplyAndInstallRate', type: 'number' },
        'S+I Steel': { name: 'supplyAndInstallRateSteel', type: 'number' },
        'Retrofit (existing ceiling) Rate/m²': { name: 'retrofitRate', type: 'number' },
        'Subfloor Rate/m²': { name: 'subfloorRate', type: 'number' },
    };
    
    useEffect(() => {
        const unsubscribe = onSnapshot(materialsCollectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMaterials(data);
        });
        return () => unsubscribe();
    }, []);

    const processedMaterials = useMemo(() => {
        const { categoryOrder, brandOrder, productNameSortOrder, kingspanSortOrder } = MATERIAL_DATABASE_CONFIG;

        const variantMap = new Map();
        materials.forEach(material => {
            const key = `${material.materialName}-${material.rValue}-${material.thickness}-${material.density}-${material.supplier}-${material.brand}`;
            if (!variantMap.has(key)) {
                variantMap.set(key, []);
            }
            variantMap.get(key).push(material);
        });

        const uniqueProducts = Array.from(variantMap.values()).map(variants => {
            const isFireProtection = variants[0].category === 'Fire Protection';
            if (isFireProtection) {
                variants.sort((a, b) => (parseFloat(a.density) || 0) - (parseFloat(b.density) || 0));
            } else {
                variants.sort((a, b) => a.width - b.width);
            }
            return {
                key: variants[0].id,
                ...variants[0],
                variants 
            };
        });

        const groupedByCategory = uniqueProducts.reduce((acc, material) => {
            const category = material.category || 'Uncategorized';
            if (!acc[category]) acc[category] = {};
            
            if (category === 'Consumables') {
                const supplier = material.supplier || 'Unspecified';
                if (!acc[category][supplier]) acc[category][supplier] = {};
                const brand = material.brand || 'Unspecified';
                if (!acc[category][supplier][brand]) acc[category][supplier][brand] = { items: [] };
                acc[category][supplier][brand].items.push(material);
            } else {
                const brand = material.brand || 'Unspecified';
                if (!acc[category][brand]) acc[category][brand] = {};
                const supplier = material.supplier || 'Unspecified';
                if(!acc[category][brand][supplier]) acc[category][brand][supplier] = { items: [] };
                acc[category][brand][supplier].items.push(material);
            }
            return acc;
        }, {});
        
        const processBrands = (brands) => {
            const sortedBrands = {};
            const brandKeys = Object.keys(brands).sort((a, b) => {
                const indexA = brandOrder.indexOf(a);
                const indexB = brandOrder.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.localeCompare(b);
            });

            for (const brand of brandKeys) {
                const suppliers = brands[brand];
                const allSuppliers = new Set();
                Object.values(suppliers).forEach(supData => {
                    supData.items.forEach(item => {
                        if(item.supplier) allSuppliers.add(item.supplier);
                    });
                });

                for (const supplier in suppliers) {
                    const brandData = suppliers[supplier];
                    
                    const sortingRules = [
                        (a, b) => {
                            if (a.category === 'Consumables' && a.materialName.toLowerCase().includes('dampcourse')) {
                                return (b.width || 0) - (a.width || 0);
                            }
                            return 0;
                        },
                        (a, b) => {
                            const rValueA = parseFloat(a.rValue) || 0;
                            const rValueB = parseFloat(b.rValue) || 0;
                            if (rValueA !== rValueB) {
                                return rValueB - rValueA;
                            }

                            if (a.category === 'Fire Protection') {
                                const thicknessDiff = (b.thickness || 0) - (a.thickness || 0);
                                if (thicknessDiff !== 0) return thicknessDiff;
                                return (parseFloat(b.density) || 0) - (parseFloat(a.density) || 0);
                            }

                            if (['XPS', 'Rigid Wall, Soffit'].includes(a.category)) {
                                return (b.thickness || 0) - (a.thickness || 0);
                            }

                            if (a.category === 'Wall Wrap') {
                                return (b.width || 0) - (a.width || 0);
                            }
                            
                            return 0;
                        }
                    ];

                    brandData.items.sort((a, b) => {
                        for (const rule of sortingRules) {
                            const result = rule(a, b);
                            if (result !== 0) return result;
                        }
                        return 0;
                    });
                }
                sortedBrands[brand] = { suppliers: Array.from(allSuppliers), supplierData: suppliers };
            }
            return sortedBrands;
        };

        const orderedGroups = {};
        categoryOrder.forEach(cat => {
            if (groupedByCategory[cat]) {
                orderedGroups[cat] = processBrands(groupedByCategory[cat]);
            }
        });

        Object.keys(groupedByCategory).forEach(cat => {
            if (!orderedGroups[cat]) {
                orderedGroups[cat] = processBrands(groupedByCategory[cat]);
            }
        });

        return orderedGroups;
    }, [materials]);

    const handleVariantChange = (key, selectedId) => {
        setVariantSelections(prev => ({ ...prev, [key]: selectedId }));
    };
    
    const formatCell = (value, unit = '', prefix = '') => {
        if (value === 0 || value === null || value === undefined || value === '') return '-';
        if (prefix === '$') return `$${Number(value).toFixed(2)}`;
        if (prefix === 'R' && value) return `R${value}`;
        return `${value}${unit}`;
    };

    const getUnitLabels = (category) => {
        const catLower = category.toLowerCase();
        if (catLower.includes('bulk') || catLower.includes('fire')) {
            return { perUnit: 'm²/Bag', packUnit: 'Bags/Pack', costUnit: 'Cost/Bag' };
        }
        if (catLower.includes('subfloor') || (catLower.includes('wrap') && !catLower.includes('tape'))) {
            return { perUnit: 'm²/Roll', packUnit: 'Rolls/Pack', costUnit: 'Cost/Roll' };
        }
        if (catLower.includes('pipe lag')) {
            return { perUnit: 'LM/Roll', packUnit: 'Rolls/Pack', costUnit: 'Cost/Roll' };
        }
        if (catLower.includes('rigid') || catLower.includes('soffit') || catLower.includes('xps')) {
            return { perUnit: 'm²/Sheet', packUnit: 'Sheets/Pack', costUnit: 'Cost/Sheet' };
        }
        return { perUnit: 'm²/Unit', packUnit: 'Units/Pack', costUnit: 'Cost/Unit' };
    };

    const handleSave = async (data) => {
        if (editingMaterial) {
            await updateDoc(doc(materialsCollectionRef, editingMaterial.id), data);
        } else {
            await addDoc(materialsCollectionRef, data);
        }
        setIsModalOpen(false);
    };

    const handleClearDatabase = async () => {
        const snapshot = await getDocs(materialsCollectionRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        setIsClearing(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Materials Database</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setIsImporting(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"><Upload size={18} className="mr-2" /> Import from CSV</button>
                    <button onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"><Plus size={18} className="mr-2" /> Add Material</button>
                    <button onClick={() => setIsClearing(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"><Trash2 size={18} className="mr-2" /> Clear Database</button>
                </div>
            </div>
            <div className="space-y-8">
                {Object.entries(processedMaterials).map(([category, brands]) => {
                    const unitLabels = getUnitLabels(category);
                    const columns = [
                        { key: 'materialName', label: 'Product Name' }, { key: 'rValue', label: 'R-Value', prefix: 'R' },
                        { key: 'thickness', label: 'Thickness', suffix: 'mm' }, { key: 'length', label: 'Length', suffix: 'mm' },
                        { key: 'width', label: 'Width', suffix: 'mm' }, { key: 'm2PerUnit', label: unitLabels.perUnit },
                        { key: 'density', label: 'Density', suffix: ' kg/m³' }, { key: 'piecesPerBag', label: 'Pcs/Bag' },
                        { key: 'unitsPerPack', label: unitLabels.packUnit }, { key: 'costPerUnit', label: unitLabels.costUnit, prefix: '$' },
                        { key: 'salePrice', label: 'Sale Cost', prefix: '$' }, { key: 'supplyAndInstallRate', label: 'S+I Timber', prefix: '$' },
                        { key: 'supplyAndInstallRateSteel', label: 'S+I Steel', prefix: '$' }, { key: 'retrofitRate', label: 'Retrofit Rate', prefix: '$' },
                        { key: 'subfloorRate', label: 'Subfloor Rate', prefix: '$' },
                    ];

                    return (
                        <div key={category}>
                            <h2 className="text-2xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">{category}</h2>
                            <div className="space-y-6">
                                {Object.entries(brands).map(([brand, brandData]) => {
                                    const { supplierData, suppliers } = brandData;
                                    const allItems = Object.values(supplierData).flatMap(s => s.items);
                                    const visibleColumns = columns.filter(col => allItems.some(item => (item[col.key] || (item.variants && item.variants.some(v => v[col.key])))));
                                    
                                    return (
                                        <div key={brand}>
                                            <h3 className="text-lg font-semibold text-gray-600 mb-2">{brand} <span className="text-sm font-normal text-gray-400">({suppliers.join(', ')})</span></h3>
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            {visibleColumns.map(col => <th key={col.key} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col.label}</th>)}
                                                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    {Object.entries(supplierData).map(([supplier, supData], supIndex) => (
                                                        <tbody key={supplier} className={`bg-white ${supIndex > 0 ? 'border-t-2 border-gray-400' : ''}`}>
                                                            {supData.items.map((item) => {
                                                                const selectedVariantId = variantSelections[item.key] || item.variants[0].id;
                                                                const selectedVariant = item.variants.find(v => v.id === selectedVariantId) || item.variants[0];
                                                                
                                                                return (
                                                                    <tr key={item.key}>
                                                                        {visibleColumns.map(col => {
                                                                            const isVariantColumn = (category === 'Fire Protection' && col.key === 'density') || (category !== 'Fire Protection' && col.key === 'width');
                                                                            if (isVariantColumn && item.variants.length > 1) {
                                                                                return (
                                                                                    <td key={`${col.key}-variant`} className="px-3 py-2 whitespace-nowrap">
                                                                                        <select value={selectedVariantId} onChange={(e) => handleVariantChange(item.key, e.target.value)} className="p-1 border rounded-md bg-white text-sm">
                                                                                            {item.variants.map(v => <option key={v.id} value={v.id}>{formatCell(v[col.key], col.suffix)}</option>)}
                                                                                        </select>
                                                                                    </td>
                                                                                );
                                                                            }
                                                                            let value = selectedVariant[col.key];
                                                                            if (col.key === 'length' && (category === 'Acoustic Pipe Lag' || category === 'Wall Wrap' || category === 'Bulk Insulation' || category === 'Consumables') && value >= 2000) {
                                                                                value = value / 1000;
                                                                                return <td key={col.key} className="px-3 py-4 whitespace-nowrap">{formatCell(value, 'm')}</td>
                                                                            }
                                                                            return <td key={col.key} className="px-3 py-4 whitespace-nowrap">{formatCell(value, col.suffix, col.prefix)}</td>
                                                                        })}
                                                                        <td className="px-3 py-4 whitespace-nowrap text-right font-medium">
                                                                            <button onClick={() => { setEditingMaterial(selectedVariant); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                                                                            <button onClick={async () => { if(window.confirm('Delete?')) await deleteDoc(doc(materialsCollectionRef, selectedVariant.id)) }} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    ))}
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {isModalOpen && <MaterialModal material={editingMaterial} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isImporting && <CSVImporter collectionRef={materialsCollectionRef} fieldMappings={materialFieldMappings} onComplete={() => setIsImporting(false)} />}
            {isClearing && <ConfirmationModal title="Clear Material Database" message="Are you sure you want to delete all materials? This action cannot be undone." onConfirm={handleClearDatabase} onCancel={() => setIsClearing(false)} />}
        </div>
    );
};

const MaterialModal = ({ material, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        materialName: material?.materialName || '',
        brand: material?.brand || 'Ecowool',
        rValue: material?.rValue || '',
        thickness: material?.thickness || '',
        density: material?.density || '',
        costPerUnit: material?.costPerUnit || '',
        supplyAndInstallRate: material?.supplyAndInstallRate || '',
        supplyAndInstallRateSteel: material?.supplyAndInstallRateSteel || '',
        category: material?.category || 'Bulk Insulation',
        salePrice: material?.salePrice || '',
        m2PerUnit: material?.m2PerUnit || '',
        length: material?.length || '',
        width: material?.width || '',
        piecesPerBag: material?.piecesPerBag || '',
        costPerPack: material?.costPerPack || '',
        supplier: material?.supplier || '',
        unitsPerPack: material?.unitsPerPack || '',
        m2PerPack: material?.m2PerPack || '',
        itemCode: material?.itemCode || '',
        notes: material?.notes || '',
        retrofitRate: material?.retrofitRate || '',
        subfloorRate: material?.subfloorRate || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const numericFields = [
            'thickness', 'length', 'width', 'piecesPerBag', 'unitsPerPack',
            'costPerUnit', 'costPerPack', 'salePrice', 'supplyAndInstallRate', 
            'supplyAndInstallRateSteel', 'retrofitRate', 'subfloorRate', 'm2PerUnit', 'm2PerPack'
        ];
        const processedData = { ...formData };
        numericFields.forEach(field => {
            processedData[field] = parseFloat(processedData[field]) || 0;
        });
        onSave(processedData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-4">{material ? 'Edit Material' : 'Add Material'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                        <input name="materialName" value={formData.materialName} onChange={(e) => setFormData({...formData, materialName: e.target.value})} placeholder="Product Name" className="w-full p-2 border rounded-md" required />
                        <input name="brand" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="Brand Name" className="w-full p-2 border rounded-md" />
                        <input name="supplier" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} placeholder="Supplier" className="w-full p-2 border rounded-md" />
                        <input name="rValue" value={formData.rValue} onChange={(e) => setFormData({...formData, rValue: e.target.value})} type="text" placeholder="R-Value (e.g., 2.5HD)" className="w-full p-2 border rounded-md" />
                        <input name="thickness" value={formData.thickness} onChange={(e) => setFormData({...formData, thickness: e.target.value})} type="number" placeholder="Thickness (mm)" className="w-full p-2 border rounded-md" />
                        <input name="density" value={formData.density} onChange={(e) => setFormData({...formData, density: e.target.value})} placeholder="Density (e.g., HD, 11kg/m³)" className="w-full p-2 border rounded-md" />
                        <select name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded-md bg-white">
                            <option>Bulk Insulation</option><option>Soffit Panel</option><option>Acoustic</option><option>Fire Protection</option><option>Wall Wrap</option><option>Other</option>
                        </select>
                        <input name="itemCode" value={formData.itemCode} onChange={(e) => setFormData({...formData, itemCode: e.target.value})} placeholder="Item # / Code" className="w-full p-2 border rounded-md" />
                        <input name="length" value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value})} type="number" placeholder="Length (mm)" className="w-full p-2 border rounded-md" />
                        <input name="width" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value})} type="number" placeholder="Width (mm)" className="w-full p-2 border rounded-md" />
                        <input name="piecesPerBag" value={formData.piecesPerBag} onChange={(e) => setFormData({...formData, piecesPerBag: e.target.value})} type="number" placeholder="Pieces per Bag" className="w-full p-2 border rounded-md" />
                        <input name="unitsPerPack" value={formData.unitsPerPack} onChange={(e) => setFormData({...formData, unitsPerPack: e.target.value})} type="number" placeholder="Bags/Sheets per Pack" className="w-full p-2 border rounded-md" />
                        <input name="m2PerUnit" value={formData.m2PerUnit} onChange={(e) => setFormData({...formData, m2PerUnit: e.target.value})} type="number" step="0.01" placeholder="m²/LM per Unit" className="w-full p-2 border rounded-md" />
                        <input name="m2PerPack" value={formData.m2PerPack} onChange={(e) => setFormData({...formData, m2PerPack: e.target.value})} type="number" step="0.01" placeholder="m²/LM per Pack" className="w-full p-2 border rounded-md" />
                        <input name="costPerUnit" value={formData.costPerUnit} onChange={(e) => setFormData({...formData, costPerUnit: e.target.value})} type="number" step="0.01" placeholder="Cost per Unit (ex. GST)" className="w-full p-2 border rounded-md" required />
                        <input name="costPerPack" value={formData.costPerPack} onChange={(e) => setFormData({...formData, costPerPack: e.target.value})} type="number" step="0.01" placeholder="Cost/Pack" className="w-full p-2 border rounded-md" />
                        <input name="salePrice" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: e.target.value})} type="number" step="0.01" placeholder="Sale Price (per unit)" className="w-full p-2 border rounded-md" />
                        <input name="supplyAndInstallRate" value={formData.supplyAndInstallRate} onChange={(e) => setFormData({...formData, supplyAndInstallRate: e.target.value})} type="number" step="0.01" placeholder="S+I Rate Timber (ex. GST)" className="w-full p-2 border rounded-md" />
                        <input name="supplyAndInstallRateSteel" value={formData.supplyAndInstallRateSteel} onChange={(e) => setFormData({...formData, supplyAndInstallRateSteel: e.target.value})} type="number" step="0.01" placeholder="S+I Rate Steel (ex. GST)" className="w-full p-2 border rounded-md" />
                        <input name="retrofitRate" value={formData.retrofitRate} onChange={(e) => setFormData({...formData, retrofitRate: e.target.value})} type="number" step="0.01" placeholder="Retrofit Rate/m²" className="w-full p-2 border rounded-md" />
                        <input name="subfloorRate" value={formData.subfloorRate} onChange={(e) => setFormData({...formData, subfloorRate: e.target.value})} type="number" step="0.01" placeholder="Subfloor Rate/m²" className="w-full p-2 border rounded-md" />
                         <textarea name="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Notes" className="w-full p-2 border rounded-md md:col-span-3" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Labour Manager ---
const LabourManager = () => {
    const [labourRates, setLabourRates] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const labourRatesCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'labourRates');

    const labourFieldMappings = {
        'Application': { name: 'application', type: 'string', required: true },
        'Area': { name: 'area', type: 'string', required: true, isMatchKey: true },
        'Timber Frame': { name: 'timberRate', type: 'number' },
        'Steel Frame': { name: 'steelRate', type: 'number' },
        'Unit': { name: 'unit', type: 'string' },
        'Notes/Conditions': { name: 'notes', type: 'string' },
        'Keywords': { name: 'keywords', type: 'array' },
    };
    
    const labourCategoryOrder = ['Standard Insulation', 'Retrofit Insulation', 'Labour Add Ons/Other', 'Specialty Insulation', 'Wall Wrap', 'Acoustic Pipe Lag', 'Rigid Wall/Soffit'];

    useEffect(() => {
        const unsubscribe = onSnapshot(labourRatesCollectionRef, (snapshot) => {
            setLabourRates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);
    
    const groupedLabourRates = useMemo(() => {
        const groupData = labourRates.reduce((acc, rate) => {
            (acc[rate.application] = acc[rate.application] || []).push(rate);
            return acc;
        }, {});
        const orderedGroups = {};
        labourCategoryOrder.forEach(cat => {
            if (groupData[cat]) {
                orderedGroups[cat] = groupData[cat];
            }
        });
        Object.keys(groupData).forEach(cat => {
            if (!orderedGroups[cat]) {
                orderedGroups[cat] = groupData[cat];
            }
        });
        return orderedGroups;
    }, [labourRates]);

    const handleSave = async (data) => {
        if (editingRate) {
            await updateDoc(doc(labourRatesCollectionRef, editingRate.id), data);
        } else {
            await addDoc(labourRatesCollectionRef, data);
        }
        setIsModalOpen(false);
    };

    const handleClearDatabase = async () => {
        const snapshot = await getDocs(labourRatesCollectionRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        setIsClearing(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Labour Rates Database</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setIsImporting(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"><Upload size={18} className="mr-2" /> Import from CSV</button>
                    <button onClick={() => { setEditingRate(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"><Plus size={18} className="mr-2" /> Add Labour Rate</button>
                    <button onClick={() => setIsClearing(true)} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"><Trash2 size={18} className="mr-2" /> Clear Database</button>
                </div>
            </div>
            <div className="space-y-6">
                {Object.entries(groupedLabourRates).map(([application, rates]) => (
                    <div key={application}>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">{application || 'Uncategorized'}</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timber Frame Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Steel Frame Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rates.map((r) => (
                                        <tr key={r.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.area}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(r.timberRate || 0).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(r.steelRate || 0).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.unit}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => { setEditingRate(r); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4"><Edit size={18} /></button>
                                                <button onClick={async () => { if(window.confirm('Delete?')) await deleteDoc(doc(labourRatesCollectionRef, r.id)) }} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <LabourModal rate={editingRate} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isImporting && <CSVImporter collectionRef={labourRatesCollectionRef} fieldMappings={labourFieldMappings} onComplete={() => setIsImporting(false)} />}
            {isClearing && <ConfirmationModal title="Clear Labour Database" message="Are you sure you want to delete all labour rates? This action cannot be undone." onConfirm={handleClearDatabase} onCancel={() => setIsClearing(false)} />}
        </div>
    );
};

const LabourModal = ({ rate, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        area: rate?.area || '',
        timberRate: rate?.timberRate || '',
        steelRate: rate?.steelRate || '',
        unit: rate?.unit || 'm²',
        application: rate?.application || 'Standard Insulation',
        notes: rate?.notes || '',
        keywords: rate?.keywords?.join(', ') || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ 
            ...formData, 
            timberRate: parseFloat(formData.timberRate) || 0,
            steelRate: parseFloat(formData.steelRate) || 0,
            keywords: formData.keywords.split(',').map(k => k.trim())
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold mb-4">{rate ? 'Edit Labour Rate' : 'Add Labour Rate'}</h3>
                    <div className="space-y-4">
                        <input name="area" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} placeholder="Area (e.g., Ceiling Insulation)" className="w-full p-2 border rounded-md" required />
                        <select name="application" value={formData.application} onChange={(e) => setFormData({...formData, application: e.target.value})} className="w-full p-2 border rounded-md bg-white">
                            <option>Standard Insulation</option>
                            <option>Retrofit Insulation</option>
                            <option>Specialty Insulation</option>
                            <option>Labour Add Ons/Other</option>
                            <option>Wall Wrap</option>
                            <option>Acoustic Pipe Lag</option>
                            <option>Rigid Wall/Soffit</option>
                        </select>
                        <input name="timberRate" value={formData.timberRate} onChange={(e) => setFormData({...formData, timberRate: e.target.value})} type="number" step="0.01" placeholder="Timber Frame Rate (e.g., 1.50)" className="w-full p-2 border rounded-md" />
                        <input name="steelRate" value={formData.steelRate} onChange={(e) => setFormData({...formData, steelRate: e.target.value})} type="number" step="0.01" placeholder="Steel Frame Rate (e.g., 1.80)" className="w-full p-2 border rounded-md" />
                        <select name="unit" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full p-2 border rounded-md bg-white">
                            <option>m²</option><option>lm</option><option>item</option>
                        </select>
                        <input name="keywords" value={formData.keywords} onChange={(e) => setFormData({...formData, keywords: e.target.value})} placeholder="Keywords, comma, separated" className="w-full p-2 border rounded-md" />
                        <textarea name="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Notes/Conditions" className="w-full p-2 border rounded-md" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Dashboard ---
const Dashboard = ({ onEditWorksheet }) => {
    const [worksheets, setWorksheets] = useState([]);
    const worksheetsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'worksheets');

    useEffect(() => {
        const unsubscribe = onSnapshot(worksheetsCollectionRef, (snapshot) => {
            setWorksheets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Quote Worksheets</h2>
                <button onClick={() => onEditWorksheet(null)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"><Plus size={18} className="mr-2" /> New Worksheet</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit Margin</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {worksheets.map((w) => (
                            <tr key={w.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{w.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.siteAddress}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(w.totalCustomerPrice || 0).toFixed(2)}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${w.profitMarginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(w.profitMarginPercentage || 0).toFixed(2)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEditWorksheet(w)} className="text-indigo-600 hover:text-indigo-900 mr-4">Open</button>
                                    <button onClick={async () => { if(window.confirm('Delete?')) await deleteDoc(doc(worksheetsCollectionRef, w.id)) }} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Text Parser Utility ---
const PasteParser = ({ materials, labourRates, onParse, brand }) => {
    const [text, setText] = useState('');

    const levenshteinDistance = (a, b) => {
        if (!a || !b) return 100;
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        for (let i = 0; i <= a.length; i += 1) { matrix[0][i] = i; }
        for (let j = 0; j <= b.length; j += 1) { matrix[j][0] = j; }
        for (let j = 1; j <= b.length; j += 1) {
            for (let i = 1; i <= a.length; i += 1) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
            }
        }
        return matrix[b.length][a.length];
    };

    const handleParse = () => {
        if (!text.trim()) return;

        const findBestMaterialMatch = (searchText, parsedRValue) => {
            if (!searchText || materials.length === 0) return null;
            let bestMatch = null;
            let minDistance = Infinity;
            
            let filteredMaterials = materials.filter(m => m.brand === brand);
            if (parsedRValue) {
                filteredMaterials = filteredMaterials.filter(m => m.rValue === parsedRValue);
            }

            filteredMaterials.forEach(material => {
                const distance = levenshteinDistance(searchText.toLowerCase(), material.materialName.toLowerCase());
                if (distance < minDistance) {
                    minDistance = distance;
                    bestMatch = material;
                }
            });
            return minDistance < searchText.length / 1.5 ? bestMatch : null;
        };

        const findBestLabourMatch = (searchText) => {
            if (!searchText || labourRates.length === 0) return null;
            const applicationRates = labourRates.filter(r => r.application !== 'Labour Add Ons/Other' && r.application !== 'High Ceiling');
            for (const rate of applicationRates) {
                if (rate.keywords && rate.keywords.some(k => searchText.toLowerCase().includes(k))) {
                    return rate;
                }
            }
            return null;
        };

        const lines = text.split('\n');
        const newGroups = [];
        let currentGroup = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const itemMatch = trimmedLine.match(/^-?\s*(.+?)\s*–\s*(\d+(\.\d+)?)\s*(m²|lm)/i);
            if (itemMatch) {
                if (!currentGroup) {
                    currentGroup = { groupName: 'General', lineItems: [] };
                    newGroups.push(currentGroup);
                }
                const materialDescription = itemMatch[0];
                const materialNameForMatching = itemMatch[1].trim();
                const quantity = itemMatch[2];
                
                const rValueMatch = materialNameForMatching.match(/R(\d+(\.\d+)?(HD|NB)?)/i);
                const parsedRValue = rValueMatch ? rValueMatch[1] : null;

                const bestMaterial = findBestMaterialMatch(materialNameForMatching, parsedRValue);
                const bestLabour = findBestLabourMatch(materialNameForMatching);
                
                let autoPrice = '';
                if (bestMaterial && bestMaterial.supplyAndInstallRate > 0) {
                    autoPrice = (bestMaterial.supplyAndInstallRate * parseFloat(quantity)).toFixed(2);
                }
                
                currentGroup.lineItems.push({
                    description: materialDescription,
                    quantity: quantity || '',
                    materialId: bestMaterial ? bestMaterial.id : '',
                    labourApplicationId: bestLabour ? bestLabour.id : '',
                    labourAddons: { steelFrame: false, cutting: false, highCeiling: 'none' },
                    customerPrice: autoPrice,
                    priceIncludesGst: true,
                    parsedRValue: parsedRValue,
                    parsedApplication: bestLabour ? bestLabour.area : ''
                });
            } 
            else if (!trimmedLine.startsWith('-') && trimmedLine.length > 5) {
                currentGroup = { groupName: trimmedLine, lineItems: [] };
                newGroups.push(currentGroup);
            }
        });
        
        onParse(newGroups);
        setText('');
    };

    return (
        <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center"><FileText size={20} className="mr-2"/>Paste & Parse</h3>
            <p className="text-sm text-gray-500 mb-4">Paste your raw data below. The tool will automatically create groups, parse material lines, and attempt to match them to your database based on the selected brand.</p>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your data here..."
                className="w-full p-2 border rounded-md h-40 font-mono text-sm"
            />
            <div className="text-right mt-2">
                <button onClick={handleParse} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Parse Data</button>
            </div>
        </div>
    );
};


// --- Pricing Calculator ---
const Calculator = ({ worksheet, onBack }) => {
    const [materials, setMaterials] = useState([]);
    const [labourRates, setLabourRates] = useState([]);
    const [worksheetData, setWorksheetData] = useState({
        clientName: '',
        siteAddress: '',
        discountPercentage: 0,
        brand: 'Ecowool',
        groups: []
    });
    const [isXeroModalOpen, setIsXeroModalOpen] = useState(false);

    useEffect(() => {
        if (worksheet) {
            setWorksheetData({
                clientName: worksheet.clientName || '',
                siteAddress: worksheet.siteAddress || '',
                discountPercentage: worksheet.discountPercentage || 0,
                brand: worksheet.brand || 'Ecowool',
                groups: worksheet.groups || [],
                id: worksheet.id
            });
        } else {
             setWorksheetData({ clientName: '', siteAddress: '', discountPercentage: 0, brand: 'Ecowool', groups: [] });
        }
    }, [worksheet]);
    
    useEffect(() => {
        const materialsUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'materials'), (snapshot) => {
            setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const labourUnsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'labourRates'), (snapshot) => {
            setLabourRates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => {
            materialsUnsub();
            labourUnsub();
        };
    }, []);

    const calculations = useMemo(() => {
        let totalMaterialCost = 0;
        let totalLabourCost = 0;
        let totalCustomerPriceExGst = 0;

        worksheetData.groups.forEach(group => {
            group.lineItems.forEach(item => {
                const material = materials.find(m => m.id === item.materialId);
                const quantity = parseFloat(item.quantity) || 0;
                if (material) {
                    totalMaterialCost += quantity * material.costPerUnit;
                }

                const applicationLabour = labourRates.find(r => r.id === item.labourApplicationId);
                const isSteel = item.labourAddons.steelFrame;
                const applicationRate = applicationLabour ? (isSteel ? applicationLabour.steelRate : applicationLabour.timberRate) : 0;
                
                const highCeilingRate = labourRates.find(r => r.area === item.labourAddons.highCeiling)?.timberRate || 0; // Assuming timber rate for high ceiling
                const cuttingRate = (item.labourAddons.cutting && labourRates.find(r => r.application === 'Labour Add Ons/Other' && r.area.toLowerCase().includes('cutting'))?.timberRate) || 0;
                
                const combinedLabourRatePerSqM = (applicationRate || 0) + (highCeilingRate || 0) + (cuttingRate || 0);
                totalLabourCost += quantity * combinedLabourRatePerSqM;

                const customerPrice = parseFloat(item.customerPrice) || 0;
                totalCustomerPriceExGst += item.priceIncludesGst ? price / 1.1 : customerPrice;
            });
        });

        const totalInternalCost = totalMaterialCost + totalLabourCost;
        const profitAmount = totalCustomerPriceExGst - totalInternalCost;
        const profitMarginPercentage = totalCustomerPriceExGst > 0 ? (profitAmount / totalCustomerPriceExGst) * 100 : 0;
        
        return { totalMaterialCost, totalLabourCost, totalInternalCost, totalCustomerPrice: totalCustomerPriceExGst, profitAmount, profitMarginPercentage };
    }, [worksheetData, materials, labourRates]);

    const handleWorksheetChange = (e) => {
        setWorksheetData({ ...worksheetData, [e.target.name]: e.target.value });
    };

    const handleGroupChange = (groupIndex, field, value) => {
        const newGroups = [...worksheetData.groups];
        newGroups[groupIndex][field] = value;
        setWorksheetData({ ...worksheetData, groups: newGroups });
    };
    
    const handleLineItemChange = (groupIndex, lineIndex, field, value) => {
        const newGroups = [...worksheetData.groups];
        const lineItem = newGroups[groupIndex].lineItems[lineIndex];
        if (typeof field === 'string' && field.startsWith('labourAddons.')) {
            const addonField = field.split('.')[1];
            lineItem.labourAddons[addonField] = value;
        } else {
            lineItem[field] = value;
        }
        
        if (field === 'materialId' || field === 'labourAddons.steelFrame') {
            const material = materials.find(m => m.id === (field === 'materialId' ? value : lineItem.materialId));
            if (material) {
                const isSteel = field === 'labourAddons.steelFrame' ? value : lineItem.labourAddons.steelFrame;
                const rate = isSteel ? material.supplyAndInstallRateSteel : material.supplyAndInstallRate;
                if (rate > 0) {
                    lineItem.customerPrice = (rate * (parseFloat(lineItem.quantity) || 0)).toFixed(2);
                }
            }
        }
        
        setWorksheetData({ ...worksheetData, groups: newGroups });
    };
    
    const addGroup = () => {
        setWorksheetData(prev => ({ ...prev, groups: [...prev.groups, { groupName: '', lineItems: [] }] }));
    };
    
    const removeGroup = (index) => {
        setWorksheetData(prev => ({ ...prev, groups: prev.groups.filter((_, i) => i !== index) }));
    };

    const addLineItem = (groupIndex) => {
        const newGroups = [...worksheetData.groups];
        newGroups[groupIndex].lineItems.push({ description: '', quantity: '', materialId: '', labourApplicationId: '', labourAddons: { steelFrame: false, cutting: false, highCeiling: 'none' }, customerPrice: '', priceIncludesGst: true });
        setWorksheetData({ ...worksheetData, groups: newGroups });
    };

    const removeLineItem = (groupIndex, lineIndex) => {
        const newGroups = [...worksheetData.groups];
        newGroups[groupIndex].lineItems = newGroups[groupIndex].lineItems.filter((_, i) => i !== lineIndex);
        setWorksheetData({ ...worksheetData, groups: newGroups });
    };

    const handleSave = async () => {
        const dataToSave = { ...worksheetData, ...calculations, updatedAt: serverTimestamp() };
        if (worksheetData?.id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'worksheets', worksheetData.id), dataToSave);
        } else {
            const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'worksheets'), { ...dataToSave, createdAt: serverTimestamp() });
            setWorksheetData(prev => ({ ...prev, id: docRef.id }));
        }
        onBack();
    };
    
    const handleParseData = (parsedGroups) => {
        setWorksheetData(prev => ({ ...prev, groups: parsedGroups }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">{worksheet?.id ? 'Edit Worksheet' : 'New Worksheet'}</h2>
                    <button onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">Back to Dashboard</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b pb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Client Name</label>
                        <input name="clientName" value={worksheetData.clientName} onChange={handleWorksheetChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Site Address</label>
                        <input name="siteAddress" value={worksheetData.siteAddress} onChange={handleWorksheetChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                        <input name="discountPercentage" type="number" value={worksheetData.discountPercentage} onChange={handleWorksheetChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Primary Brand</label>
                        <select name="brand" value={worksheetData.brand} onChange={handleWorksheetChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                            <option>Ecowool</option><option>Earthwool</option>
                        </select>
                    </div>
                </div>
                
                <PasteParser materials={materials} labourRates={labourRates} onParse={handleParseData} brand={worksheetData.brand} />

                <div className="space-y-4">
                    {worksheetData.groups.map((group, groupIndex) => (
                        <WorksheetGroup 
                            key={groupIndex}
                            group={group}
                            groupIndex={groupIndex}
                            materials={materials}
                            labourRates={labourRates}
                            onGroupChange={(field, value) => handleGroupChange(groupIndex, field, value)}
                            onLineItemChange={(lineIndex, field, value) => handleLineItemChange(groupIndex, lineIndex, field, value)}
                            onAddLineItem={() => addLineItem(groupIndex)}
                            onRemoveLineItem={(lineIndex) => removeLineItem(groupIndex, lineIndex)}
                            onRemoveGroup={() => removeGroup(groupIndex)}
                        />
                    ))}
                </div>
                <button onClick={addGroup} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"><Plus size={16} className="mr-1"/>Add Quote Group</button>
            </div>

            <div className="lg:col-span-1 lg:sticky top-24 bg-white p-6 rounded-lg shadow-md space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Live Calculations</h3>
                
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Material Cost:</span><span className="font-medium">${calculations.totalMaterialCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Labour Cost:</span><span className="font-medium">${calculations.totalLabourCost.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-2"><span className="text-gray-800">Total Internal Cost:</span><span>${calculations.totalInternalCost.toFixed(2)}</span></div>
                </div>
                
                <div className="space-y-2 text-sm border-t pt-4">
                    <div className="flex justify-between font-bold text-base"><span className="text-gray-800">Customer Price (ex. GST):</span><span>${calculations.totalCustomerPrice.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base"><span className="text-gray-800">Profit Amount:</span><span>${calculations.profitAmount.toFixed(2)}</span></div>
                </div>

                <div className={`p-4 rounded-lg text-center ${calculations.profitMarginPercentage >= 20 ? 'bg-green-100 text-green-800' : calculations.profitMarginPercentage >= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    <div className="text-sm font-bold uppercase tracking-wider">Profit Margin</div>
                    <div className="text-4xl font-bold">{calculations.profitMarginPercentage.toFixed(2)}%</div>
                </div>

                <div className="flex flex-col space-y-3 pt-4 border-t">
                    <button onClick={handleSave} className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-semibold">Save Worksheet</button>
                    <button onClick={() => setIsXeroModalOpen(true)} className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-semibold flex items-center justify-center"><Copy size={16} className="mr-2"/>Finalize for Xero</button>
                </div>
            </div>
            {isXeroModalOpen && <XeroSummaryModal worksheetData={worksheetData} calculations={calculations} onClose={() => setIsXeroModalOpen(false)} />}
        </div>
    );
};

const WorksheetGroup = ({ group, groupIndex, materials, labourRates, onGroupChange, onLineItemChange, onAddLineItem, onRemoveLineItem, onRemoveGroup }) => {
    return (
        <div className="border rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between items-center mb-3">
                <input value={group.groupName} onChange={(e) => onGroupChange('groupName', e.target.value)} placeholder="Group Name (e.g., First Floor)" className="w-full p-2 border rounded-md font-semibold text-lg" />
                <button onClick={onRemoveGroup} className="ml-4 text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
            </div>
            <div className="space-y-3">
                {group.lineItems.map((item, lineIndex) => (
                    <LineItem 
                        key={lineIndex}
                        item={item}
                        lineIndex={lineIndex}
                        onLineItemChange={(field, value) => onLineItemChange(lineIndex, field, value)}
                        onRemoveLineItem={() => onRemoveLineItem(lineIndex)}
                        materials={materials}
                        labourRates={labourRates}
                    />
                ))}
                <button onClick={onAddLineItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center"><Plus size={14} className="mr-1"/>Add Line Item</button>
            </div>
        </div>
    );
};

const LineItem = ({ item, lineIndex, onLineItemChange, onRemoveLineItem, materials, labourRates }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const applicationRates = labourRates.filter(r => r.application !== 'Labour Add Ons/Other' && r.application !== 'High Ceiling');
    const highCeilingRates = labourRates.filter(r => r.application === 'High Ceiling');
    
    const filteredMaterials = useMemo(() => {
        if (!item.parsedRValue && !item.parsedApplication) return materials.filter(m => m.supplyAndInstallRate > 0);
        return materials.filter(m => {
            const rValueMatch = item.parsedRValue ? m.rValue === item.parsedRValue : true;
            
            const labourKeywords = labourRates.find(lr => lr.area === item.parsedApplication)?.keywords || [];
            const labourMatch = item.parsedApplication ? labourKeywords.some(k => (m.category || '').toLowerCase().includes(k)) : true;
            
            return rValueMatch && labourMatch && m.supplyAndInstallRate > 0;
        });
    }, [item.parsedRValue, item.parsedApplication, materials, labourRates]);

    return (
        <div className="bg-white border border-gray-200 rounded-md p-3">
            <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-800 flex-grow cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>{item.description}</p>
                <div className="flex items-center ml-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">$</span>
                        <input value={item.customerPrice} onChange={(e) => onLineItemChange('customerPrice', e.target.value)} type="number" step="0.01" placeholder="Price" className="w-32 p-2 border rounded-md pl-7" />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                            <button onClick={() => onLineItemChange('priceIncludesGst', !item.priceIncludesGst)} className={`text-xs px-2 h-full rounded-r-md ${item.priceIncludesGst ? 'bg-white text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                                {item.priceIncludesGst ? 'inc' : 'ex'}
                            </button>
                        </div>
                    </div>
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="ml-2 text-gray-500 hover:text-gray-700">{isCollapsed ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}</button>
                    <button onClick={onRemoveLineItem} className="ml-2 text-red-500 hover:text-red-700"><X size={16}/></button>
                </div>
            </div>
            {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Material</label>
                        <div className="flex items-center gap-2 mt-1">
                            <select value={item.materialId} onChange={(e) => onLineItemChange('materialId', e.target.value)} className="w-full p-2 border rounded-md bg-white text-sm">
                                <option value="">Select Material...</option>
                                {filteredMaterials.map(m => <option key={m.id} value={m.id}>{`R${m.rValue} - ${m.thickness}mm - ${m.materialName}`}</option>)}
                            </select>
                            <input value={item.quantity} onChange={(e) => onLineItemChange('quantity', e.target.value)} type="number" placeholder="Qty" className="w-24 p-2 border rounded-md text-sm" readOnly/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Labour</label>
                        <div className="mt-1 space-y-2">
                            <select value={item.labourApplicationId} onChange={(e) => onLineItemChange('labourApplicationId', e.target.value)} className="w-full p-2 border rounded-md bg-white text-sm">
                                <option value="">Select Application...</option>
                                {applicationRates.map(r => <option key={r.id} value={r.id}>{r.area}</option>)}
                            </select>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <label className="flex items-center text-xs"><input type="checkbox" checked={item.labourAddons.steelFrame} onChange={(e) => onLineItemChange('labourAddons.steelFrame', e.target.checked)} className="mr-1 h-3 w-3 rounded-sm"/>Steel</label>
                                <label className="flex items-center text-xs"><input type="checkbox" checked={item.labourAddons.cutting} onChange={(e) => onLineItemChange('labourAddons.cutting', e.target.checked)} className="mr-1 h-3 w-3 rounded-sm"/>Cutting</label>
                                <select value={item.labourAddons.highCeiling} onChange={(e) => onLineItemChange('labourAddons.highCeiling', e.target.value)} className="p-1 border rounded-md bg-white text-xs">
                                    <option value="none">Std Ceiling</option>
                                    {highCeilingRates.map(r => <option key={r.id} value={r.area}>{r.area}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const XeroSummaryModal = ({ worksheetData, calculations, onClose }) => {
    const [includeGst, setIncludeGst] = useState(true);

    const generateSummaryText = () => {
        let text = `Xero Quote Details for: ${worksheetData.siteAddress}\n\n`;
        
        worksheetData.groups.forEach(group => {
            const groupTotal = group.lineItems.reduce((total, item) => {
                const price = parseFloat(item.customerPrice) || 0;
                return total + (item.priceIncludesGst ? price / 1.1 : price);
            }, 0);

            text += `Line Item:\n`;
            text += `Description: ${group.groupName}\n`;
            group.lineItems.forEach(item => {
                text += `  - ${item.description}\n`;
            });
            text += `Price: $${groupTotal.toFixed(2)}\n\n`;
        });
        
        const totalCustomerPrice = calculations.totalCustomerPrice;
        const discountPercentage = parseFloat(worksheetData.discountPercentage) || 0;
        const discountAmount = totalCustomerPrice * (discountPercentage / 100);
        const subtotal = totalCustomerPrice - discountAmount;
        const gst = subtotal * 0.10;
        const total = subtotal + gst;

        if (discountAmount > 0) {
            text += `Discount: ${discountPercentage}% - Total: ($${discountAmount.toFixed(2)})\n\n`;
        }

        if (includeGst) {
            text += `Subtotal: $${subtotal.toFixed(2)}\n`;
            text += `GST: $${gst.toFixed(2)}\n`;
            text += `TOTAL: $${total.toFixed(2)}`;
        } else {
            text += `TOTAL (ex. GST): $${subtotal.toFixed(2)}`;
        }
        return text;
    };
    
    const [summaryText, setSummaryText] = useState(generateSummaryText());
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setSummaryText(generateSummaryText());
    }, [includeGst, worksheetData, calculations]);

    const handleCopy = () => {
        const textArea = document.createElement('textarea');
        textArea.value = summaryText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
        document.body.removeChild(textArea);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Copy-Paste for Xero</h3>
                    <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-3 text-sm font-medium text-gray-900">Show GST</span>
                            <div className="relative">
                                <input type="checkbox" checked={includeGst} onChange={() => setIncludeGst(!includeGst)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                        </label>
                        <button onClick={onClose} className="ml-6"><X size={24}/></button>
                    </div>
                </div>
                <pre className="bg-gray-100 p-4 rounded-md text-sm whitespace-pre-wrap font-sans overflow-auto max-h-96">
                    {summaryText}
                </pre>
                <div className="mt-6 flex justify-end">
                    <div className="flex space-x-4">
                        <button onClick={handleCopy} className="bg-blue-600 text-white px-4 py-2 rounded-md w-32">
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                        <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
