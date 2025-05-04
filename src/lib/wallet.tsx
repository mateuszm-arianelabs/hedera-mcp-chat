'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { DAppConnector } from "@hashgraph/hedera-wallet-connect";
import { LedgerId, Transaction } from "@hashgraph/sdk";
import { Buffer } from "buffer";
import type { SignClientTypes } from "@walletconnect/types";

interface WalletContextValue {
  connected: boolean;
  accountId: string | null;
  signer: any | null; // DAppSigner
  signTxBytes: (txBytesBase64: string) => Promise<any | null>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
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
  const [accountId, setAccountId] = useState<string | null>(null);
  const [signer, setSigner] = useState<any | null>(null);

  useEffect(() => {
    const init = async () => {
      // Initialize the connector (this will automatically try to restore any persisted WC session)
      await connector.init();

      // If the connector already has active signers after init that means an existing session was restored
      const existingSigners = connector.signers;
      if (existingSigners && existingSigners.length > 0) {
        const first = existingSigners[0];
        const acct = first.getAccountId().toString();
        setConnected(true);
        setAccountId(acct);
        setSigner(first);
        // persist first account
        localStorage.setItem("hederaAddress", acct);
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
      const first = signers[0];
      const acct = first.getAccountId().toString();
      setAccountId(acct);
      setSigner(first);
      // persist for resume
      localStorage.setItem("hederaAddress", acct);
    } catch (err) {
      console.error(err);
    }
  };

  const disconnect = async () => {
    // Disconnect all sessions
    await connector.disconnectAll();
    setConnected(false);
    setAccountId(null);
    setSigner(null);
    localStorage.removeItem("hederaAddress");
  };

  // Helper: sign and execute a base64-encoded transaction via WalletConnect
  const signTxBytes = async (txBytesBase64: string) => {
    if (!connected || accountId === null || signer === null) return null;
    try {
      const txBytes = Buffer.from(txBytesBase64, 'base64');
      let transaction: Transaction | null = null;
      try {
        transaction = Transaction.fromBytes(txBytes);
      } catch (err) {
        console.warn('Transaction.fromBytes failed, fallback to RPC', err);
      }

      if (transaction) {
        try {
          const executed = await transaction.executeWithSigner(signer);
          const receipt = await executed.getReceiptWithSigner(signer);
          return { transactionId: executed.transactionId.toString(), status: receipt.status.toString() };
        } catch (err) {
          console.error('executeWithSigner failed, fallback to wallet RPC', err);
        }
      }
      // Fallback: ask wallet to sign and execute using base64 directly
      const rpcResp = await connector.signAndExecuteTransaction({
        signerAccountId: `hedera:testnet:${accountId}`,
        transactionList: txBytesBase64,
      });

      console.log({ rpcResp })

      return (rpcResp as any).transactionId;
    } catch (err) {
      console.error('signTxBytes error:', err);
      return null;
    }
  };

  return (
    <WalletContext.Provider value={{ connected, accountId, signer, connect, disconnect, signTxBytes }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
} 