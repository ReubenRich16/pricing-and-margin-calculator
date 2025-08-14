import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmationModal
 * 
 * Purpose: 
 * - Reusable modal for confirming destructive actions (delete, clear, etc)
 * - Highly visible overlay, disables interaction with rest of app
 * 
 * Props:
 * - title (string): Modal header, e.g., "Delete Material"
 * - message (string): Explanatory message for user
 * - confirmText (string): Text for confirm button (default: "Confirm")
 * - onConfirm (function): Callback for user confirming action
 * - onCancel (function): Callback for user cancelling/closing modal
 * 
 * Accessibility: 
 * - Uses role="dialog" and aria-modal="true"
 * - Lucide icon is decorative (aria-hidden)
 */

const ConfirmationModal = ({
    title,
    message,
    confirmText = "Confirm",
    onConfirm,
    onCancel
}) => (
    // Overlay: covers entire viewport, centers modal
    <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
        role="dialog"
        aria-modal="true"
    >
        {/* Modal Card */}
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="sm:flex sm:items-start">
                {/* Alert Icon */}
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                {/* Title & Message */}
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">{message}</p>
                    </div>
                </div>
            </div>
            {/* Action Buttons: Confirm/Cancel */}
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                    type="button"
                    onClick={onConfirm}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                    {confirmText}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;
