import React, { useState, useMemo } from 'react';
import { X, Copy } from 'lucide-react';

/**
 * XeroSummaryModal
 * 
 * Displays a summary of the current quote worksheet in a format that can be copied into Xero.
 * Props:
 * - worksheetData: The worksheet object with groups and line items.
 * - calculations: The calculations object (totals, GST, etc.).
 * - onClose: Function to close the modal.
 */
const XeroSummaryModal = ({ worksheetData, calculations, onClose }) => {
    const [copied, setCopied] = useState(false);

    // Format the quote summary for Xero
    const summaryText = useMemo(() => {
        let text = `Quote for: ${worksheetData.customerName || 'N/A'}\nSite: ${worksheetData.worksheetName || 'N/A'}\n\n`;
        worksheetData.groups.forEach(group => {
            if ((group.lineItems && group.lineItems.length > 0) || (group.laborItems && group.laborItems.length > 0)) {
                text += `--- ${group.groupName} ---\n`;
                // Material line items
                (group.lineItems || []).forEach(item => {
                    text += `- ${item.materialName} (${item.quantity} ${item.unitOfMeasure || 'unit'})\n`;
                    // Labour applications attached to this material line
                    if (item.labourApplications && item.labourApplications.length > 0) {
                        item.labourApplications.forEach(lab => {
                            const rate = lab.overrideRate && lab.overrideRate !== '' ? lab.overrideRate : lab.defaultRate;
                            text += `    • Labour: ${lab.area} (${lab.application}) ($${parseFloat(rate).toFixed(2)}/${lab.unit} x ${item.quantity} ${lab.unit})\n`;
                        });
                    }
                });
                // Labour line items (future-proof: if laborItems added)
                (group.laborItems || []).forEach(item => {
                    text += `- ${item.area} (${item.quantity} ${item.unit || 'unit'})\n`;
                });
                text += `\n`;
            }
        });
        text += `--------------------------------\nSubtotal (ex. GST): $${calculations.subtotalExGst.toFixed(2)}\nGST: $${calculations.gstAmount.toFixed(2)}\nTOTAL (inc. GST): $${calculations.totalPriceIncGst.toFixed(2)}\n`;
        return text;
    }, [worksheetData, calculations]);

    // Copy summary text to clipboard
    const handleCopy = () => {
        const textArea = document.createElement("textarea");
        textArea.value = summaryText;
        textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0";
        document.body.appendChild(textArea);
        textArea.focus(); textArea.select();
        try { 
            document.execCommand('copy'); 
            setCopied(true); 
            setTimeout(() => setCopied(false), 2000); 
        } catch (err) { 
            console.error('Failed to copy text: ', err); 
        }
        document.body.removeChild(textArea);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Finalize for Xero</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24}/></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Review the summary below. You can copy this text and paste it directly into the description field of a Xero quote.
                </p>
                <pre className="bg-gray-100 p-4 rounded-md text-sm whitespace-pre-wrap font-mono overflow-auto max-h-80">{summaryText}</pre>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleCopy} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-36 justify-center">
                        <Copy size={16} className="mr-2"/>{copied ? 'Copied!' : 'Copy Text'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default XeroSummaryModal;
