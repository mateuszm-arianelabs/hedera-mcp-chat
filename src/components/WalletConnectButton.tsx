import React, { useEffect } from 'react';
import { useWallet } from '../lib/wallet';

interface WalletConnectButtonProps {
    onConnected: (accountId: string, signer: any) => void;
    onDisconnected: () => void;
}

export default function WalletConnectButton({ onConnected, onDisconnected }: WalletConnectButtonProps) {
    const { connected, accountId, signer, connect, disconnect } = useWallet();

    useEffect(() => {
        if (connected && accountId && signer) {
            onConnected(accountId, signer);
        }
    }, [connected, accountId, signer, onConnected]);

    const handleClick = async () => {
        try {
            if (!connected) {
                await connect();
            } else {
                await disconnect();
                onDisconnected();
            }
        } catch (error) {
            console.error('Wallet connect error:', error);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
        >
            {connected ? `Disconnect ${accountId}` : 'Connect Wallet'}
        </button>
    );
} 