// src/components/quote/MaterialLineItemRow.js
import React, { useMemo } from 'react';

// Utility: Find material by ID and return full object
export function getMaterialById(materials, id) {
    if (!id) return null;
    return materials.find(m => m.id === id) || null;
}

const MaterialLineItemRow = ({
    materials,
    item,
    onChange,
    onRemove,
    shortlistOptions = [],
}) => {
    const materialObj = useMemo(() => getMaterialById(materials, item.materialId), [materials, item.materialId]);
    
    return (
        <div className="flex items-center space-x-2 py-2 border-b">
            <select
                value={item.materialId}
                onChange={e => {
                    const selectedMat = materials.find(m => m.id === e.target.value);
                    onChange({
                        ...item,
                        materialId: e.target.value,
                        materialName: selectedMat?.materialName || '',
                        unit: selectedMat?.unit || selectedMat?.unitOfMeasure || item.unit || '',
                    });
                }}
                className="w-2/5 p-2 border rounded-md bg-white"
                required
            >
                <option value="">Select Material</option>
                {shortlistOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <input
                type="number"
                min={0.01}
                step={0.01}
                value={item.quantity}
                onChange={e => onChange({ ...item, quantity: parseFloat(e.target.value) || 0 })}
                className="w-24 p-2 border rounded-md"
                placeholder="Qty"
                required
            />
            <input
                type="text"
                value={item.unit || ''}
                onChange={e => onChange({ ...item, unit: e.target.value })}
                className="w-20 p-2 border rounded-md"
                placeholder="Unit"
            />
            <input
                type="text"
                value={item.notes || ''}
                onChange={e => onChange({ ...item, notes: e.target.value })}
                className="flex-grow p-2 border rounded-md"
                placeholder="Notes/Description"
            />
            <button
                onClick={onRemove}
                type="button"
                className="text-red-500 hover:text-red-700 px-2"
                title="Remove"
            >
                &times;
            </button>
        </div>
    );
};

export default MaterialLineItemRow;