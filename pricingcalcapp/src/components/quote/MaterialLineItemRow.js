import React from 'react';

const MaterialLineItemRow = ({ item, onItemChange }) => {
  const itemStyle = {
    border: item.confidence === 'low' ? '1px solid #ffc107' : '1px solid transparent',
    backgroundColor: item.confidence === 'low' ? '#fffbeb' : 'transparent',
    padding: '0.5rem',
    marginBottom: '0.25rem',
    borderRadius: '0.25rem',
  };

  const handleTextChange = (e) => {
    onItemChange(item.id, { originalText: e.target.value });
  };

  const handleTypeChange = (e) => {
    onItemChange(item.id, { type: e.target.value });
  };

  const reconstructedText = `${item.description} ${item.colorHint ? `(${item.colorHint})` : ''} ${item.rValue || ''} – ${item.quantity}${item.unit}`;

  return (
    <li className="list-group-item" style={itemStyle}>
      <div className="d-flex justify-content-between align-items-center">
        <input
          type="text"
          value={reconstructedText}
          onChange={handleTextChange}
          className="form-control form-control-sm"
          style={{ flexGrow: 1 }}
        />
        <select
          value={item.type}
          onChange={handleTypeChange}
          className="form-select form-select-sm"
          style={{ width: '120px', marginLeft: '10px' }}
        >
          <option value="LINE_ITEM">Line Item</option>
          <option value="NOTE">Note</option>
          <option value="GROUP_HEADER">Group Header</option>
        </select>
      </div>
      {item.notes && item.notes.length > 0 && (
        <div className="mt-2" style={{ paddingLeft: '20px' }}>
          {item.notes.map((note, index) => (
            <div key={index} className="text-muted small">
              <em>{note}</em>
            </div>
          ))}
        </div>
      )}
    </li>
  );
};

export default MaterialLineItemRow;
