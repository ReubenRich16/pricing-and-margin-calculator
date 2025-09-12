// src/components/logistics/EditMaterialsModal.js
import React, { useState } from 'react';

const EditMaterialsModal = ({ job, onSave, onClose }) => {
    const [allocations, setAllocations] = useState(job.materials.map(m => ({ ...m, newAllocation: m.allocated || 0 })));

    const handleAllocationChange = (index, value) => {
        const newAllocations = [...allocations];
        newAllocations[index].newAllocation = parseFloat(value) || 0;
        setAllocations(newAllocations);
    };

    const handleSave = () => {
        onSave(job.id, allocations);
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
            <div className="p-6">
                <h2 className="text-xl font-bold">Allocate Materials for {job.job_id}</h2>
                <div className="mt-4 space-y-3">
                    {allocations.map((m, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 items-center">
                            <span className="col-span-2 text-sm">{m.name}</span>
                            <input type="number" value={m.newAllocation} onChange={e => handleAllocationChange(index, e.target.value)} max={m.required} className="w-full rounded-md text-center" />
                            <span className="text-sm">/ {m.required} {m.unit}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg">Save Allocations</button>
            </div>
        </div>
    );
};

export default EditMaterialsModal;

