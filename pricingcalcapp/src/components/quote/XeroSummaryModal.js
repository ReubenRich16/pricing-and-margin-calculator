// src/components/quote/XeroSummaryModal.js
import React, { useState, useMemo } from 'react';
import { X, Copy } from 'lucide-react';
import QuoteSummary from './QuoteSummary';

const XeroSummaryModal = ({ worksheetData, calculations, onClose }) => {
    const [copied, setCopied] = useState(false);

    const summaryText = useMemo(() => {
        const groups = worksheetData.groups || [];
        let text = `Quote for: ${worksheetData.customerName || 'N/A'}\nSite: ${worksheetData.worksheetName || 'N/A'}\n\n`;
        groups.forEach(group => {
            if ((group.lineItems && group.lineItems.length > 0) || (group.labourItems && group.labourItems.length > 0)) {
                text += `--- ${group.groupName || 'Group'} ---\n`;
                (group.lineItems || []).forEach(item => {
                    if (!item) return;
                    const qty = item.quantity ?? '';
                    const uom = item.unitOfMeasure || item.unit || 'unit';
                    text += `- ${item.materialName || item.description || 'Item'} (${qty} ${uom})\n`;
                });
                (group.labourItems || []).forEach(item => {
                    if (!item) return;
                    const qty = item.quantity ?? '';
                    const uom = item.unit || 'unit';
                    text += `- Labour: ${item.description || 'Application'} (${qty} ${uom})\n`;
                });
                text += '\n';
            }
        });
        text += '--------------------------------\n';
        text += `Subtotal (ex. GST): $${calculations.subtotalExGst.toFixed(2)}\n`;
        text += `GST: $${calculations.gstAmount.toFixed(2)}\n`;
        text += `TOTAL (inc. GST): $${calculations.totalPriceIncGst.toFixed(2)}\n`;
        return text;
    }, [worksheetData, calculations]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summaryText);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (e) {
            console.error('Copy failed:', e);
            alert('Copy failed. Please select and copy manually.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Finalise for Xero</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Review the summary below. Copy this text and paste it into the Xero quote description.
                </p>
                <QuoteSummary calculations={calculations} showMarginColour={false} className="mb-6" />
                <pre
                    className="bg-gray-100 p-4 rounded-md text-sm whitespace-pre-wrap font-mono overflow-auto max-h-80"
                >
                    {summaryText}
                </pre>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleCopy}
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-40 justify-center"
                    >
                        <Copy size={16} className="mr-2" />
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default XeroSummaryModal;