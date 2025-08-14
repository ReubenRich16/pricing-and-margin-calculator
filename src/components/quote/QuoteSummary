import React from 'react';

/**
 * QuoteSummary
 * Displays a summary of calculated totals for the current worksheet.
 * Props:
 * - calculations: result from calculateTotals
 * - className: optional Tailwind classes
 * - showMarginColour: if true, applies coloured box for margin % (default: true)
 */
const getMarginColour = (margin) => {
    if (margin >= 20) return 'bg-green-100 text-green-800';
    if (margin >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

const QuoteSummary = ({ calculations, className = '', showMarginColour = true }) => (
    <div className={`space-y-2 ${className}`}>
        <div className="flex justify-between text-sm">
            <span className="text-gray-600">Material Cost:</span>
            <span className="font-medium">${calculations.totalMaterialCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
            <span className="text-gray-600">Labour Cost:</span>
            <span className="font-medium">${calculations.totalLabourCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
            <span className="text-gray-800">Total Cost (ex. GST):</span>
            <span>${calculations.totalCostExGst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm border-t pt-2 mt-2">
            <span className="text-gray-600">Markup:</span>
            <span className="font-medium">${calculations.markupAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
            <span className="text-gray-800">Subtotal (ex. GST):</span>
            <span>${calculations.subtotalExGst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
            <span className="text-gray-600">GST:</span>
            <span className="font-medium">${calculations.gstAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span className="text-gray-800">Total Price (inc. GST):</span>
            <span>${calculations.totalPriceIncGst.toFixed(2)}</span>
        </div>
        {showMarginColour &&
            <div className={`p-4 rounded-lg text-center ${getMarginColour(calculations.actualMargin)}`}>
                <div className="text-sm font-bold uppercase tracking-wider">Actual Profit Margin</div>
                <div className="text-4xl font-bold">{calculations.actualMargin.toFixed(2)}%</div>
            </div>
        }
    </div>
);

export default QuoteSummary;
