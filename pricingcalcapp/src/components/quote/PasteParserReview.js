import React from 'react';
import MaterialLineItemRow from './MaterialLineItemRow';

const AggregatedGroupCard = ({ group, onGroupToggle }) => (
  <div className="card mb-3">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h6 className="mb-0">{group.groupName}</h6>
      <button 
        className="btn btn-sm btn-outline-secondary" 
        onClick={() => onGroupToggle(group.id)}
      >
        Show Raw
      </button>
    </div>
    <div className="card-body">
      <ul className="list-group list-group-flush">
        {group.lineItems.map((item, itemIdx) => (
          <li key={item.id || itemIdx} className="list-group-item">
            {item.isNoteGroup ? (
              <div className="text-muted d-block">
                {item.notes.map((note, noteIdx) => (
                  <div key={noteIdx} style={{ whiteSpace: 'pre' }}>&nbsp;&nbsp;— {note}</div>
                ))}
              </div>
            ) : (
              <>
                {'– '}
                {item.description}
                {item.colorHint && ` (MARKED ${item.colorHint})`}
                {item.rValue && ` ${item.rValue}`}
                {' – '}{item.quantity}{item.unit}
                {item.specifications && item.specifications.width && ` (${item.specifications.width})`}
                {item.isSupplyOnly && <span className="badge bg-secondary ms-2">Supply Only</span>}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const RawGroupCard = ({ group, onMergeGroup, onItemChange, onGroupToggle, isFirst }) => (
  <div className="card mb-3">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h6 className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{group.groupName}</h6>
      <div>
        {!isFirst && (
          <button 
            className="btn btn-sm btn-outline-secondary me-2" 
            onClick={() => onMergeGroup(group.id)}
          >
            Merge with Previous
          </button>
        )}
        <button 
          className="btn btn-sm btn-outline-primary" 
          onClick={() => onGroupToggle(group.id)}
        >
          Re-Aggregate
        </button>
      </div>
    </div>
    <div className="card-body">
      <ul>
        {group.lineItems.map((item, itemIdx) => (
          <MaterialLineItemRow 
            key={item.id || itemIdx} 
            item={item} 
            onItemChange={onItemChange} 
          />
        ))}
      </ul>
    </div>
  </div>
);

const PasteParserReview = ({ 
  rawWorksheetData, 
  aggregatedWorksheetData, 
  groupToggleState, 
  onGroupToggle, 
  onItemChange, 
  onMergeGroup 
}) => {
  if (!aggregatedWorksheetData || !aggregatedWorksheetData.groups || aggregatedWorksheetData.groups.length === 0) {
    return <p>No data to display. Paste text and click Parse.</p>;
  }

  return (
    <div>
      {aggregatedWorksheetData.groups.map(aggGroup => {
        const isAggregatedView = groupToggleState[aggGroup.id];

        if (isAggregatedView) {
          return (
            <AggregatedGroupCard 
              key={aggGroup.id} 
              group={aggGroup} 
              onGroupToggle={onGroupToggle} 
            />
          );
        } else {
          if (!rawWorksheetData || !rawWorksheetData.groups) {
            return <p key={aggGroup.id}>Raw data not available.</p>;
          }
          
          const rawSourceGroups = rawWorksheetData.groups.filter(rawGroup => 
            aggGroup.sourceGroupIds && aggGroup.sourceGroupIds.includes(rawGroup.id)
          );

          return (
            <div key={aggGroup.id}>
              {rawSourceGroups.map((rawGroup, index) => (
                <RawGroupCard 
                  key={rawGroup.id} 
                  group={rawGroup} 
                  onMergeGroup={onMergeGroup}
                  onItemChange={onItemChange}
                  onGroupToggle={onGroupToggle}
                  isFirst={index === 0 && rawWorksheetData.groups.findIndex(g => g.id === rawGroup.id) === 0}
                />
              ))}
            </div>
          );
        }
      })}
    </div>
  );
};

export default PasteParserReview;
