'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { DAppConnector } from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hashgraph/sdk";
import type { SignClientTypes } from "@walletconnect/types";

interface WalletContextValue {
  connected: boolean;
  accountIds: string[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTxBytes: (txBytesBase64: string) => Promise<string | null>; // returns signature or null
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
  console.log(process.env)
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
      // Initialize the connector
      await connector.init();
      const storedAddress = localStorage.getItem("hederaAddress");
      if (storedAddress) {
        // attempt to resume session
        try {
          await connector.openModal();
          setConnected(true);
          const signers = connector.signers;
          setAccountIds(signers.map((s) => s.getAccountId().toString()));
        } catch (err) {
          console.error(err);
        }
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

  const signTxBytes = async (txBytes: string) => {
    if (!connected) return null;
    try {
      // hedera_signMessage expects base64 string message param
      const result = await connector.signMessage({
        signerAccountId: `hedera:testnet:${accountIds[0]}`,
        message: txBytes,
      });
      return JSON.stringify(result);
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