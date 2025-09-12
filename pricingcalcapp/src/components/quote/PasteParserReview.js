// src/components/quote/PasteParserReview.js
import React, { useState } from 'react';

// Helper component to render a single group (either raw or aggregated)
const GroupCard = ({ group, isAggregatedView, onGroupToggle }) => {
  const [hoveredItemId, setHoveredItemId] = useState(null);

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">{group.groupName}</h6>
        {isAggregatedView ? (
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={() => onGroupToggle(group.id)}
          >
            Show Raw
          </button>
        ) : (
          onGroupToggle && ( // Only render button if onGroupToggle is a function
            <button 
              className="btn btn-sm btn-outline-primary" 
              onClick={() => onGroupToggle(group.id)}
            >
              Re-Aggregate
            </button>
          )
        )}
      </div>
      <div className="card-body">
        <ul className="list-group list-group-flush">
          {group.lineItems.map((item, itemIdx) => (
            <li 
              key={item.id || itemIdx} 
              className="list-group-item"
              onMouseEnter={() => setHoveredItemId(item.id || itemIdx)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              {isAggregatedView ? (
                <>
                  {item.description === "Damp Course" ? (
                    `&nbsp;&nbsp;&nbsp;&nbsp;— ${item.originalText}` // Use originalText for Damp Course
                  ) : (
                    <>
                      {'– '}{/* En-dash for other items */}
                      {item.description} - {item.quantity}{item.unit}
                      {item.specifications && item.specifications.width && ` (${item.specifications.width})`}
                      {item.rValue && ` (${item.rValue})`}
                      {item.colorHint && ` (MARKED ${item.colorHint})`}
                    </>
                  )}
                  
                  {hoveredItemId === (item.id || itemIdx) && (
                    <span className="text-muted ml-2">
                      {item.location && ` [Location: ${item.location}]`}
                      {item.category && ` [Category: ${item.category}]`}
                    </span>
                  )}

                  {item.notes && item.notes.length > 0 && (
                    <div className="text-muted d-block"> {/* Changed from small to div */}
                      {item.notes.map((note, noteIdx) => (
                        <div key={noteIdx} style={{ whiteSpace: 'pre' }}>&nbsp;&nbsp;— {note}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Render originalText for raw view
                <>
                  {item.originalText}
                  <div className="text-muted" style={{ fontSize: '0.8em' }}>
                    {item.location && ` [Location: ${item.location}]`}
                    {item.category && ` [Category: ${item.category}]`}
                  </div>
                  {item.notes && item.notes.length > 0 && (
                    <div className="text-muted d-block"> {/* Changed from small to div */}
                      {item.notes.map((note, noteIdx) => (
                        <div key={noteIdx} style={{ whiteSpace: 'pre' }}>&nbsp;&nbsp;— {note}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};


const PasteParserReview = ({ rawWorksheetData, aggregatedWorksheetData, groupToggleState, onGroupToggle }) => {
  if (!aggregatedWorksheetData || !aggregatedWorksheetData.groups || aggregatedWorksheetData.groups.length === 0) {
    return <p>No aggregated data to display. Paste text and click Parse.</p>;
  }

  return (
    <div>
      {aggregatedWorksheetData.groups.map(aggGroup => {
        const isAggregatedView = groupToggleState[aggGroup.id];

        if (isAggregatedView) {
          // Render the aggregated group
          return (
            <GroupCard 
              key={aggGroup.id} 
              group={aggGroup} 
              isAggregatedView={true} 
              onGroupToggle={onGroupToggle} 
            />
          );
        } else {
          // Render the raw source groups
          if (!rawWorksheetData || !rawWorksheetData.groups) {
            return <p key={aggGroup.id}>Raw data not available.</p>;
          }
          
          // Find and render all raw groups that contributed to this aggregated group
          const rawSourceGroups = rawWorksheetData.groups.filter(rawGroup => 
            aggGroup.sourceGroupIds && aggGroup.sourceGroupIds.includes(rawGroup.id)
          );

          return (
            <div key={aggGroup.id}>
              {rawSourceGroups.map((rawGroup, index) => (
                <GroupCard 
                  key={rawGroup.id} 
                  group={rawGroup} 
                  isAggregatedView={false} 
                  onGroupToggle={index === 0 ? onGroupToggle : null} // Only show Re-Aggregate button on the first raw group
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