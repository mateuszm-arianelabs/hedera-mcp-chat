'use client';
import Image from "next/image";
import { useWallet } from "../lib/wallet";

export default function Header() {
  const { connected, connect, disconnect, accountId } = useWallet();

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Image src="/favicon.ico" alt="Hedera Studio" width={32} height={32} />
        <span className="font-semibold text-lg">Hedera Studio</span>
      </div>
      <button
        onClick={connected ? disconnect : connect}
        className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {connected ? `Disconnect ${accountId ?? ""}` : "Connect Hedera Wallet"}
      </button>
    </header>
  );
} 