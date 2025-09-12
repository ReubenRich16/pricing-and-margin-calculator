// src/components/logistics/CreateJobModal.js
import React, { useState } from 'react';

const CreateJobModal = ({ suppliers, onSave, onClose }) => {
    const [type, setType] = useState('Site Delivery');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [address, setAddress] = useState('');
    const [supplierAddress, setSupplierAddress] = useState(suppliers[0]?.address || '');
    const [materials, setMaterials] = useState([{ name: '', qty: '', unit: '' }]);

    const handleAddMaterial = () => {
        setMaterials([...materials, { name: '', qty: '', unit: '' }]);
    };

    const handleMaterialChange = (index, field, value) => {
        const newMaterials = [...materials];
        newMaterials[index][field] = value;
        setMaterials(newMaterials);
    };

    const handleRemoveMaterial = (index) => {
        setMaterials(materials.filter((_, i) => i !== index));
    };
    
    const handleSave = () => {
        const finalAddress = type === 'Supplier Collection' ? suppliers.find(s => s.address === supplierAddress)?.name : address;
        if (!finalAddress || !startDate) {
            alert("Please provide an address/supplier and a start date.");
            return;
        }

        const jobData = {
            type,
            job_type: "Internal",
            start_date: startDate,
            source: "custom",
            address: finalAddress,
            materials: materials
                .filter(m => m.name && m.qty > 0 && m.unit)
                .map(m => ({ name: m.name, required: parseFloat(m.qty), allocated: 0, unit: m.unit })),
        };
        onSave(jobData);
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto">
            <div className="p-6">
                <h2 className="text-xl font-bold text-slate-800">Create Custom Job</h2>
                <div className="mt-4 space-y-4">
                    <div><label className="text-sm font-medium">Job Type</label><select value={type} onChange={e => setType(e.target.value)} className="w-full mt-1 border-slate-300 rounded-md"><option>Site Delivery</option><option>Site Pickup</option><option>Supplier Collection</option></select></div>
                    <div><label className="text-sm font-medium">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 border-slate-300 rounded-md"/></div>
                    {type === 'Supplier Collection' ? (
                        <div><label className="text-sm font-medium">Select Supplier</label><select value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} className="w-full mt-1 border-slate-300 rounded-md">{suppliers.map(s=><option key={s.name} value={s.address}>{s.name}</option>)}</select></div>
                    ) : (
                        <div><label className="text-sm font-medium">Address / Location</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full mt-1 border-slate-300 rounded-md" placeholder="e.g., 123 Job Site, Suburb"/></div>
                    )}
                    <div><h3 className="text-sm font-medium">Materials</h3><div className="mt-2 space-y-2">{materials.map((m,i)=>(<div key={i} className="flex gap-2 items-center"><input type="text" value={m.name} onChange={e=>handleMaterialChange(i,'name',e.target.value)} className="material-name flex-grow rounded-md" placeholder="Item Name"/><input type="number" value={m.qty} onChange={e=>handleMaterialChange(i,'qty',e.target.value)} className="material-qty w-20 rounded-md" placeholder="Qty"/><input type="text" value={m.unit} onChange={e=>handleMaterialChange(i,'unit',e.target.value)} className="material-unit w-24 rounded-md" placeholder="Unit"/><button onClick={()=>handleRemoveMaterial(i)} className="text-red-500 p-1">&times;</button></div>))}</div><button onClick={handleAddMaterial} className="mt-2 text-sm text-indigo-600 font-semibold">+ Add Item</button></div>
                </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 text-sm text-white bg-indigo-600 rounded-lg">Save Job</button>
            </div>
        </div>
    );
};

export default CreateJobModal;