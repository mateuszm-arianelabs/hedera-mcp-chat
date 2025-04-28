"use client";
import Chat from './Chat';

interface ChatHostProps {
  onTransactionPrepared?: (payload: string) => void;
}

export default function ChatHost({ onTransactionPrepared = () => { } }: ChatHostProps) {
  return <Chat onTransactionPrepared={onTransactionPrepared} accountId={null} />;
} 