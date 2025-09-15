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

  const reprocessData = useCallback((worksheetData) => {
    if (worksheetData && materials && materials.length > 0) {
      const aggregatedData = aggregateWorksheet(worksheetData, materials);
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
    reprocessData(parsedData);
  };

  const handleItemChange = (itemId, newType) => {
    const updatedWorksheet = JSON.parse(JSON.stringify(rawWorksheetData));
    let itemFound = false;
    for (const group of updatedWorksheet.groups) {
      for (const item of group.lineItems) {
        if (item.id === itemId) {
          item.type = newType;
          itemFound = true;
          break;
        }
      }
      if (itemFound) break;
    }
    setRawWorksheetData(updatedWorksheet);
    reprocessData(updatedWorksheet);
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
      reprocessData(updatedWorksheet);
    }
  };

  const handleGroupToggle = (groupId) => {
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
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Paste Scope of Works</h5>
            </div>
            <div className="card-body">
              <PasteParser onParse={handleDataFromParser} />
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
               <h5 className="card-title mb-0">Review and Adjust</h5>
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
          <QuoteSummary calculations={totals} />
        </div>
      </div>
    </div>
  );
};

export default Calculator;
