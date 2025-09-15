import React from 'react';
import MaterialLineItemRow from './MaterialLineItemRow';

const GroupCard = ({ group, onMergeGroup, isFirst, onItemChange }) => {
  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{group.groupName}</h6>
        {!isFirst && (
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={() => onMergeGroup(group.id)}
          >
            Merge with Previous
          </button>
        )}
      </div>
      <div className="card-body">
        <ul className="list-group list-group-flush">
          {group.lineItems.map((item, itemIdx) => (
            <MaterialLineItemRow key={item.id || itemIdx} item={item} onItemChange={onItemChange} />
          ))}
        </ul>
      </div>
    </div>
  );
};

const PasteParserReview = ({ rawWorksheetData, onItemChange, onMergeGroup }) => {
  if (!rawWorksheetData || !rawWorksheetData.groups || rawWorksheetData.groups.length === 0) {
    return <p>No data to display. Paste text and click Parse.</p>;
  }

  return (
    <div>
      {rawWorksheetData.groups.map((group, index) => (
        <GroupCard 
          key={group.id} 
          group={group} 
          onMergeGroup={onMergeGroup}
          isFirst={index === 0}
          onItemChange={onItemChange}
        />
      ))}
    </div>
  );
};

export default PasteParserReview;
