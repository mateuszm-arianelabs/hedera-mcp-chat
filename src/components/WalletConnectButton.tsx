import React, {useEffect, useState} from 'react';
import { useWallet } from '@/lib/wallet';

interface WalletConnectButtonProps {
    onConnected: (accountId: string, signer: any) => void;
    onDisconnected: () => void;
}

export default function WalletConnectButton({ onConnected, onDisconnected }: WalletConnectButtonProps) {
    const [firstToast, setFirstToast] = useState<boolean>(false);
    const { connected, accountId, signer, connect, disconnect, isLoading } = useWallet();

    useEffect(() => {
        if (connected && accountId && signer && !firstToast) {
            onConnected(accountId, signer);
            setFirstToast(true);
        }
    }, [connected, accountId, signer, onConnected, firstToast]);

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
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
        >
            {isLoading ? 'Loading...' : connected ? `Disconnect ${accountId}` : 'Connect Wallet'}
        </button>
    );
} 