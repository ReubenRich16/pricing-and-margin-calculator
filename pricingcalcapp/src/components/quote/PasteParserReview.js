import React from 'react';
import MaterialLineItemRow from './MaterialLineItemRow';

const formatItemDescription = (item) => {
  let description = item.description;

  if (item.productCount) {
    // Replace "_ panels" or "_ [unit]" placeholders
    description = description.replace(/_\s*(panels|bags|rolls|sheets)/gi, `${item.productCount} $1`);
    // Also handle just "_" if it precedes a unit that matches the extracted unit
    if (item.productUnit) {
       // Less strict replacement might be risky, sticking to explicit placeholders or the Unit
    }
  }

  if (item.thickness) {
    // Replace "_mm" with actual thickness
    description = description.replace(/_mm/gi, item.thickness);
  }
  
  return description;
};

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
        {group.lineItems.map((item, itemIdx) => {
          // Prepare display string
          const description = formatItemDescription(item);
          
          return (
            <li key={item.id || itemIdx} className="list-group-item">
              {item.isNoteGroup ? (
                <div className="text-muted d-block">
                  {item.notes.map((note, noteIdx) => (
                    <div key={noteIdx} style={{ whiteSpace: 'pre' }}>&nbsp;&nbsp;— {note}</div>
                  ))}
                </div>
              ) : (
                <div>
                  <div>
                    {'– '}
                    {description}
                    {item.colorHint && ` (MARKED ${item.colorHint})`}
                    {item.rValue && ` ${item.rValue}`}
                    {' – '}
                    {/* If description was updated with count, maybe we don't need to show it again? 
                        But keeping standard format "Desc - Qty" is good. 
                        If Product Count was NOT injected into description (because no placeholder), display it here.
                    */}
                    {item.productCount && !description.includes(`${item.productCount}`) 
                      ? `${item.productCount} ${item.productUnit || 'Panels'} (${item.quantity}${item.unit})` 
                      : `${item.quantity}${item.unit}`
                    }
                    
                    {item.specifications && item.specifications.width && ` (${item.specifications.width})`}
                    {item.isSupplyOnly && <span className="badge bg-secondary ms-2">Supply Only</span>}
                  </div>
                  {item.notes && item.notes.length > 0 && (
                    <small className="text-muted d-block mt-1">
                      {item.notes.map((note, i) => (
                        <div key={i}>— {note}</div>
                      ))}
                    </small>
                  )}
                </div>
              )}
            </li>
          );
        })}
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
