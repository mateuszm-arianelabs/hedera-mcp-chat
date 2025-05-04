"use client";

import { useState } from 'react';
import WalletConnectButton from '@/components/WalletConnectButton';
import Chat from '@/components/Chat';
import TransactionPanel from '@/components/TransactionPanel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from '@/lib/wallet';
import Image from "next/image";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
}

export default function HomePage() {
  const { accountId, signTxBytes } = useWallet();
  const [transactionPayloadForPanel, setTransactionPayloadForPanel] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

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
      return;
    }
    const toastId = toast.loading('Signing & executing transaction...');
    try {
      const response = await signTxBytes(transactionPayloadForPanel);
      console.log(response);

      setMessages((prev) => [...prev, { role: 'assistant', content: 'Transaction signed and executed' }, {
        role: 'tool', content: JSON.stringify(response, null, 2)
      }]);

      toast.update(toastId, {
        render: response ? JSON.stringify(response) : 'Transaction failed or rejected',
        type: response ? 'success' : 'error',
        isLoading: false,
        autoClose: 5000,
      });


      // Display raw response or success message
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
      <ToastContainer theme="dark" position="bottom-right" />
      <header className="h-16 bg-black/10 bg-opacity-80 flex justify-center px-6 shrink-0">
        <div className="flex items-center justify-between w-full max-w-screen-xl">
          <div className="flex items-center gap-2">
            <Image src="/hedera-hbar-logo.png" height={40} width={40} alt="hedera logo"/>
            <h1 className="text-xl font-semibold text-black/80">Hedera Chat</h1>
          </div>
          <WalletConnectButton
              onConnected={handleWalletConnected}
            onDisconnected={handleWalletDisconnected}
          />
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden w-full max-w-screen-xl mx-auto">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Chat onTransactionPrepared={handleTransactionPrepared} accountId={accountId} messages={messages} setMessages={setMessages} />
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
