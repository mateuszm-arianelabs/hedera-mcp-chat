'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { DAppConnector } from "@hashgraph/hedera-wallet-connect";
import { LedgerId, Transaction } from "@hashgraph/sdk";
import type { SignClientTypes } from "@walletconnect/types";

interface WalletContextValue {
  connected: boolean;
  accountIds: string[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTxBytes: (txBytesBase64: string) => Promise<any | null>; // sends transaction and returns result or null
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // Define metadata and project ID for WalletConnect
  const metadata: SignClientTypes.Metadata = {
    name: "Hedera Studio",
    description: "Connect your Hedera wallet to use Hedera Studio",
    url: typeof window !== "undefined" ? window.location.origin : "",
    icons: typeof window !== "undefined" ? [`${window.location.origin}/favicon.ico`] : [],
  };
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID environment variable is not defined. Please add it to your .env file and restart the server.'
    );
  }
  const [connector] = useState(() => new DAppConnector(metadata, LedgerId.TESTNET, projectId!));
  const [connected, setConnected] = useState(false);
  const [accountIds, setAccountIds] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      // Initialize the connector (this will automatically try to restore any persisted WC session)
      await connector.init();

      // If the connector already has active signers after init that means an existing session was restored
      const existingSigners = connector.signers;
      if (existingSigners && existingSigners.length > 0) {
        setConnected(true);
        setAccountIds(existingSigners.map((s) => s.getAccountId().toString()));
        // persist first account for later use if not already saved
        localStorage.setItem("hederaAddress", existingSigners[0].getAccountId().toString());
      } else {
        // No existing session, clean up any stale storage
        localStorage.removeItem("hederaAddress");
      }
    };
    init();
  }, [connector]);

  const connect = async () => {
    try {
      await connector.openModal();
      setConnected(true);
      const signers = connector.signers;
      setAccountIds(signers.map((s) => s.getAccountId().toString()));
      // Persist the first account for session resume
      localStorage.setItem("hederaAddress", signers[0].getAccountId().toString());
    } catch (err) {
      console.error(err);
    }
  };

  const disconnect = async () => {
    // Disconnect all sessions
    await connector.disconnectAll();
    setConnected(false);
    setAccountIds([]);
    localStorage.removeItem("hederaAddress");
  };

  const signTxBytes = async (txBytesBase64: string) => {
    if (!connected) return null;
    try {
      // Use signAndExecuteTransaction to prompt the wallet to sign and send the transaction
      const result = await connector.signAndExecuteTransaction({
        signerAccountId: `hedera:testnet:${accountIds[0]}`,
        transactionList: txBytesBase64,
      });
      return result;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  return (
    <WalletContext.Provider value={{ connected, connect, disconnect, accountIds, signTxBytes }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
} 