import React, { useState, useCallback } from 'react';
import PasteParser from '../components/quote/PasteParser';
import QuoteSummary from '../components/quote/QuoteSummary';
import { useMaterials } from '../contexts/MaterialsContext';
import { useLabour } from '../contexts/LabourContext';
import { calculateTotals } from '../utils/calculateTotals';
import { aggregateWorksheet } from '../utils/aggregation';
import PasteParserReview from '../components/quote/PasteParserReview';
import { parseWorksheetText } from '../utils/parser';

const Calculator = () => {
  const { materials, loading: materialsLoading } = useMaterials();
  const { labourRates, loading: labourLoading } = useLabour();
  
  const [rawWorksheetData, setRawWorksheetData] = useState(null);
  const [aggregatedWorksheetData, setAggregatedWorksheetData] = useState(null);
  const [totals, setTotals] = useState({
    totalMaterialCost: 0,
    totalLabourCost: 0,
    totalCostExGst: 0,
    markupAmount: 0,
    subtotalExGst: 0,
    gstAmount: 0,
    totalPriceIncGst: 0,
    actualMargin: 0,
  });
  const [groupToggleState, setGroupToggleState] = useState({});
  const [groupingMode, setGroupingMode] = useState('UNIT');

  const reprocessData = useCallback((worksheetData, mode = 'UNIT') => {
    if (worksheetData && materials && materials.length > 0) {
      console.log('--- Raw Parsed Data ---');
      console.log(JSON.stringify(worksheetData, null, 2));

      const aggregatedData = aggregateWorksheet(worksheetData, materials, mode);
      
      console.log('--- Aggregated Data ---');
      console.log(JSON.stringify(aggregatedData, null, 2));

      setAggregatedWorksheetData(aggregatedData);

      const initialToggleState = {};
      if (aggregatedData && aggregatedData.groups) {
        aggregatedData.groups.forEach(group => {
          initialToggleState[group.id] = true;
        });
      }
      setGroupToggleState(initialToggleState);

      if (aggregatedData) {
        const calculatedTotals = calculateTotals(aggregatedData, materials, labourRates);
        setTotals(calculatedTotals);
      }
    }
  }, [materials, labourRates]);

  const handleDataFromParser = (parsedData) => {
    setRawWorksheetData(parsedData);
    reprocessData(parsedData, groupingMode);
  };

  const handleGroupingModeChange = (newMode) => {
      setGroupingMode(newMode);
      if (rawWorksheetData) {
          reprocessData(rawWorksheetData, newMode);
      }
  };

  const handleItemChange = (itemId, changes) => {
    const updatedWorksheet = JSON.parse(JSON.stringify(rawWorksheetData));
    let itemFound = false;
    for (const group of updatedWorksheet.groups) {
      for (const item of group.lineItems) {
        if (item.id === itemId) {
          Object.assign(item, changes);
          itemFound = true;
          break;
        }
      }
      if (itemFound) break;
    }

    const updatedText = updatedWorksheet.groups.map(g => {
      const items = g.lineItems.map(i => i.originalText).join('\n');
      return `${g.groupName}\n${items}`;
    }).join('\n\n');
    
    // Pass materials to re-parser so auto-calc works during edits
    const newParsedData = parseWorksheetText(updatedText, materials);
    setRawWorksheetData(newParsedData);
    reprocessData(newParsedData, groupingMode);
  };

  const handleMergeGroup = (groupId) => {
    const updatedWorksheet = JSON.parse(JSON.stringify(rawWorksheetData));
    const groupIndex = updatedWorksheet.groups.findIndex(g => g.id === groupId);

    if (groupIndex > 0) {
      const currentGroup = updatedWorksheet.groups[groupIndex];
      const prevGroup = updatedWorksheet.groups[groupIndex - 1];
      
      prevGroup.groupName += `\n${currentGroup.groupName}`;
      prevGroup.lineItems.push(...currentGroup.lineItems);
      
      updatedWorksheet.groups.splice(groupIndex, 1);
      
      setRawWorksheetData(updatedWorksheet);
      reprocessData(updatedWorksheet, groupingMode);
    }
  };

  const handleGroupToggle = (groupId) => {
    const newAggregatedData = JSON.parse(JSON.stringify(aggregatedWorksheetData));
    const groupIndex = newAggregatedData.groups.findIndex(g => g.id === groupId);

    if (groupIndex !== -1) {
        const groupToToggle = newAggregatedData.groups[groupIndex];
        const rawSourceGroups = rawWorksheetData.groups.filter(rawGroup => 
            groupToToggle.sourceGroupIds && groupToToggle.sourceGroupIds.includes(rawGroup.id)
        );

        if (rawSourceGroups.length > 0) {
            // Using groupingMode from state
            const reaggregatedGroup = aggregateWorksheet({ groups: rawSourceGroups }, materials, groupingMode).groups[0];
            newAggregatedData.groups[groupIndex] = reaggregatedGroup;
            setAggregatedWorksheetData(newAggregatedData);
        }
    }

    setGroupToggleState(prevState => ({
      ...prevState,
      [groupId]: !prevState[groupId]
    }));
  };
  
  if (materialsLoading || labourLoading) {
    return <div>Loading materials and labour data...</div>;
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light border-bottom">
              <h5 className="card-title mb-0 text-dark">Paste Scope of Works</h5>
            </div>
            <div className="card-body">
              <PasteParser onParse={handleDataFromParser} />
            </div>
          </div>
        </div>
        
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light border-bottom d-flex justify-content-between align-items-center">
               <h5 className="card-title mb-0 text-dark">Review and Adjust</h5>
               <div className="btn-group" role="group">
                  <input type="radio" className="btn-check" name="groupingMode" id="modeUnit" autoComplete="off" 
                         checked={groupingMode === 'UNIT'} onChange={() => handleGroupingModeChange('UNIT')} />
                  <label className="btn btn-outline-primary btn-sm" htmlFor="modeUnit">By Unit</label>

                  <input type="radio" className="btn-check" name="groupingMode" id="modeBlock" autoComplete="off" 
                         checked={groupingMode === 'BLOCK'} onChange={() => handleGroupingModeChange('BLOCK')} />
                  <label className="btn btn-outline-primary btn-sm" htmlFor="modeBlock">By Block</label>

                  <input type="radio" className="btn-check" name="groupingMode" id="modeLevel" autoComplete="off" 
                         checked={groupingMode === 'LEVEL'} onChange={() => handleGroupingModeChange('LEVEL')} />
                  <label className="btn btn-outline-primary btn-sm" htmlFor="modeLevel">By Level</label>
              </div>
            </div>
            <div className="card-body">
              <PasteParserReview 
                rawWorksheetData={rawWorksheetData}
                aggregatedWorksheetData={aggregatedWorksheetData}
                groupToggleState={groupToggleState}
                onGroupToggle={handleGroupToggle}
                onItemChange={handleItemChange}
                onMergeGroup={handleMergeGroup}
              />
            </div>
          </div>
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <QuoteSummary calculations={totals} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
