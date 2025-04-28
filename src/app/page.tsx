"use client";

import { useState } from 'react';
import Head from 'next/head';
import WalletConnectButton from '@/components/WalletConnectButton';
import Chat from '@/components/Chat';
import TransactionPanel from '@/components/TransactionPanel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from '../lib/wallet';

export default function HomePage() {
  const { accountId, signTxBytes } = useWallet();
  const [transactionPayloadForPanel, setTransactionPayloadForPanel] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  // WalletConnectButton callbacks
  const handleWalletConnected = (connectedAccountId: string, _signer: any) => {
    toast.success(`Connected: ${connectedAccountId}`);
  };
  const handleWalletDisconnected = () => {
    toast.info('Wallet disconnected');
    // Clear any pending transaction
    setTransactionPayloadForPanel(null);
  };

  // Chat component callback
  const handleTransactionPrepared = (payload: string) => {
    setTransactionPayloadForPanel(payload);
  };

  const handleClearTransactionPanel = () => {
    setTransactionPayloadForPanel(null);
  };

  // Signing logic triggered from TransactionPanel
  const handleSignTransaction = async () => {
    if (!signTxBytes || !transactionPayloadForPanel) {
      toast.error('No transaction or wallet signer available');
      return;
    }
    const toastId = toast.loading('Signing & executing transaction...');
    try {
      const response = await signTxBytes(transactionPayloadForPanel);
      // Display raw response or success message
      toast.update(toastId, {
        render: response ? JSON.stringify(response) : 'Transaction failed or rejected',
        type: response ? 'success' : 'error',
        isLoading: false,
        autoClose: 5000,
      });
      handleClearTransactionPanel();
    } catch (error: any) {
      console.error('signTxBytes error:', error);
      toast.update(toastId, {
        render: `Error: ${error.message || String(error)}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-dark-gray-1 to-dark-gray-2 text-white font-sans">
      <Head>
        <title>Hedera Agent AI</title>
        <meta name="description" content="AI Agent with Hedera integration" />
        <link rel="icon" href="/hedera-logo-white.svg" />
      </Head>
      <ToastContainer theme="dark" position="bottom-right" />
      <header className="h-16 bg-black bg-opacity-80 flex justify-center px-6 shrink-0">
        <div className="flex items-center justify-between w-full max-w-screen-xl">
          <h1 className="text-xl font-semibold">Hedera Agent AI</h1>
          <WalletConnectButton
            onConnected={handleWalletConnected}
            onDisconnected={handleWalletDisconnected}
          />
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden w-full max-w-screen-xl mx-auto">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Chat onTransactionPrepared={handleTransactionPrepared} accountId={accountId} />
        </div>
        {transactionPayloadForPanel && (
          <TransactionPanel
            payload={transactionPayloadForPanel}
            onSign={handleSignTransaction}
            onClose={handleClearTransactionPanel}
          />
        )}
      </main>
    </div>
  );
}
