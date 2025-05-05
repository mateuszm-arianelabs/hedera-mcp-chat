import React from 'react';

type Payload = {
    txBytes: string;
} & Record<string, string | number | boolean>

interface TransactionPanelProps {
    payload: Payload;
    onSign: () => void;
    onClose: () => void;
}

export default function TransactionPanel({ payload, onSign, onClose }: TransactionPanelProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {txBytes: _txBytes, ...payloadToDisplay} = payload;

    return (
        <div className="w-[350px] p-4 m-4 mr-0 flex flex-col border-l border-gray-300">
            <h2 className="text-lg font-semibold mb-2 text-black/80">Prepared Transaction</h2>
            <textarea
                className="flex-1 w-full bg-white text-black p-2 rounded-lg resize-none border"
                value={JSON.stringify(payloadToDisplay, null, 2)}
                readOnly
            />
            <div className="mt-4 flex gap-2">
                <button
                    onClick={onSign}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg"
                >
                    Sign & Execute
                </button>
                <button
                    onClick={onClose}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
} 