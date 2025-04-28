import React from 'react';

interface TransactionPanelProps {
    payload: string;
    onSign: () => void;
    onClose: () => void;
}

export default function TransactionPanel({ payload, onSign, onClose }: TransactionPanelProps) {
    return (
        <div className="w-[350px] border-l border-gray-700 p-4 bg-gray-900 flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Prepared Transaction</h2>
            <textarea
                className="flex-1 w-full bg-gray-800 text-white p-2 rounded-lg resize-none"
                value={payload}
                readOnly
            />
            <div className="mt-4 flex gap-2">
                <button
                    onClick={onSign}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
                >
                    Sign & Execute
                </button>
                <button
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
} 