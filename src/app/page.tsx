"use client";

import { useState } from 'react';
import WalletConnectButton from '@/components/WalletConnectButton';
import Chat from '@/components/Chat';
import TransactionPanel from '@/components/TransactionPanel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWallet } from '@/lib/wallet';
import Image from "next/image";
import {AnimatePresence, motion} from "motion/react"

interface Message {
  role: "user" | "assistant" | "tool" | "url";
  content: string;
}

type Payload = {
  txBytes: string;
} & Record<string, string | number | boolean>

export default function HomePage() {
  const { accountId, signTxBytes } = useWallet();
  const [transactionPayloadForPanel, setTransactionPayloadForPanel] = useState<Payload | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  // WalletConnectButton callbacks
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleWalletConnected = (connectedAccountId: string, _signer: any) => {
    toast.success(`Connected: ${connectedAccountId}`);
  };
  const handleWalletDisconnected = () => {
    toast.info('Wallet disconnected');
    // Clear any pending transaction
    setTransactionPayloadForPanel(null);
  };

  // Chat component callback
  const handleTransactionPrepared = (payload: Payload) => {
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
      const response = await signTxBytes(transactionPayloadForPanel.txBytes);
      console.log(response);

      if(response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Transaction signed and executed' }, {
          role: 'url', content: response
        }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Transaction signed and executed' }, {
          role: 'assistant', content: "Unfortunately the transaction cannot be approved, try again later."
        }]);
      }

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
      <header className="h-20 bg-opacity-80 flex justify-center px-6 shrink-0 pt-4">
        <div className="flex items-center justify-between w-full max-w-screen-xl bg-black/10 px-4 rounded-lg border-2 border-black/20">
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
        <AnimatePresence>
        {transactionPayloadForPanel && (
          <motion.div
              initial={{
                width: 0,
                opacity: 0,
              }}
              animate={{
                width: "auto",
                opacity: 1,
              }}
              exit={{
                width: 0,
                opacity: 0,
              }}
            className="flex"
          >
            <TransactionPanel
                payload={transactionPayloadForPanel}
                onSign={handleSignTransaction}
                onClose={handleClearTransactionPanel}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}
