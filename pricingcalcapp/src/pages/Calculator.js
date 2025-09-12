// src/pages/Calculator.js
import React, { useState } from 'react';
import PasteParser from '../components/quote/PasteParser';
import QuoteSummary from '../components/quote/QuoteSummary';
import { useMaterials } from '../contexts/MaterialsContext';
import { useLabour } from '../contexts/LabourContext';
import { calculateTotals } from '../utils/calculateTotals';
import { aggregateWorksheet } from '../utils/aggregation';
import PasteParserReview from '../components/quote/PasteParserReview'; // Import the new component

// Helper function to render worksheet data for display (will be replaced by PasteParserReview)
const renderWorksheetData = (data) => {
  if (!data || !data.groups) return <p>No data to display.</p>;
  
  return (
    <pre style={{ background: '#f4f4f4', padding: '1rem', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

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
  // New state for group toggles
  const [groupToggleState, setGroupToggleState] = useState({});

  const handleGroupToggle = (groupId) => {
    setGroupToggleState(prevState => ({
      ...prevState,
      [groupId]: !prevState[groupId] // Flip the boolean value
    }));
  };

  const handleDataFromParser = (parsedData) => {
    setRawWorksheetData(parsedData);

    if (parsedData && materials && materials.length > 0) {
      // Pass the materials list to the aggregation function
      const aggregatedData = aggregateWorksheet(parsedData, materials);
      setAggregatedWorksheetData(aggregatedData);

      // Initialize groupToggleState: all aggregated groups are ON (true) by default
      const initialToggleState = {};
      if (aggregatedData && aggregatedData.groups) {
        aggregatedData.groups.forEach(group => {
          initialToggleState[group.id] = true; // Default to aggregated view
        });
      }
      setGroupToggleState(initialToggleState);

      if (aggregatedData) {
        const calculatedTotals = calculateTotals(aggregatedData, materials, labourRates);
        setTotals(calculatedTotals);
      } else {
        setTotals({
            totalMaterialCost: 0,
            totalLabourCost: 0,
            totalCostExGst: 0,
            markupAmount: 0,
            subtotalExGst: 0,
            gstAmount: 0,
            totalPriceIncGst: 0,
            actualMargin: 0,
        });
      }
    } else {
        setTotals({
            totalMaterialCost: 0,
            totalLabourCost: 0,
            totalCostExGst: 0,
            markupAmount: 0,
            subtotalExGst: 0,
            gstAmount: 0,
            totalPriceIncGst: 0,
            actualMargin: 0,
        });
        setGroupToggleState({}); // Clear toggle state if no data
    }
  };
  
  if (materialsLoading || labourLoading) {
    return <div>Loading materials and labour data...</div>;
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        {/* Left Column: Input */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Paste Scope of Works</h5>
            </div>
            <div className="card-body">
              <PasteParser onParse={handleDataFromParser} />
            </div>
          </div>
          
          {/* Raw Parsed Output - for debugging, can be removed later */}
          <div className="card mt-4">
            <div className="card-header">
               <h5 className="card-title mb-0">Raw Parsed Output</h5>
            </div>
            <div className="card-body">
              {renderWorksheetData(rawWorksheetData)}
            </div>
          </div>
        </div>
        
        {/* Right Column: Aggregated Output & Summary */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
               <h5 className="card-title mb-0">Aggregated & Matched Output</h5>
            </div>
            <div className="card-body">
              {/* Use PasteParserReview to render the groups */}
              <PasteParserReview 
                rawWorksheetData={rawWorksheetData}
                aggregatedWorksheetData={aggregatedWorksheetData}
                groupToggleState={groupToggleState}
                onGroupToggle={handleGroupToggle}
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
