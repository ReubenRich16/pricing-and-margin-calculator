import React from 'react';

const MaterialLineItemRow = ({ item, onItemChange }) => {
  const itemStyle = {
    border: item.confidence === 'low' ? '2px solid yellow' : 'none',
    padding: '5px',
    marginBottom: '5px',
  };

  return (
    <li className="list-group-item" style={itemStyle}>
      <div className="d-flex justify-content-between align-items-center">
        <span>{item.originalText}</span>
        <select
          value={item.type}
          onChange={(e) => onItemChange(item.id, e.target.value)}
          className="form-select form-select-sm"
          style={{ width: '150px' }}
        >
          <option value="LINE_ITEM">Line Item</option>
          <option value="NOTE">Note</option>
          <option value="GROUP_HEADER">Group Header</option>
        </select>
      </div>
    </li>
  );
};

export default MaterialLineItemRow;
