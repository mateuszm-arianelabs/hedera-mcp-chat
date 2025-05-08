import { Dispatch, SetStateAction, useState } from "react";
import { handleChat, summaryToolResult } from "@/actions/handle-chat";
import { toast } from "react-toastify";
import Link from "next/link";
import {LoaderCircle, RotateCw} from "lucide-react";

interface Message {
  role: "user" | "assistant" | "tool" | "url";
  content: string;
}

type Payload = {
  txBytes: string;
} & Record<string, string | number | boolean>

interface ChatProps {
  onTransactionPrepared: (payload: Payload) => void;
  accountId: string | null;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  currentTransaction: Payload | null
}

export default function Chat({ onTransactionPrepared, accountId, messages, setMessages, currentTransaction }: ChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!accountId) {
      toast.error("No account ID found");
      return;
    }

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      const { text, toolResults } = await handleChat(accountId, input, currentTransaction);

      if (toolResults.length > 0) {
        const toolResult = JSON.parse((toolResults[0].result.content as any)[0].text);

        if ("txBytes" in toolResult) {
          // Notify parent to handle transaction signing/execution
          setMessages((prev) => [...prev, {
            role: 'assistant', content: "We prepared the transaction, please sign and execute it"
          }]);
          const transactionDetails = await fetch("http://localhost:3003", {
            method: "POST",
            body: JSON.stringify({
              txBytes: toolResult.txBytes
            }),
            headers: {
              'Content-Type': "application/json",
            }
          })
          const transactionData = await transactionDetails.json()
          onTransactionPrepared({...toolResult, ...transactionData});
          return;
        }

        const summary = await summaryToolResult(toolResults);
        setMessages((prev) => [...prev, { role: 'assistant', content: summary }, {
          role: 'tool', content: JSON.stringify(toolResult, null, 2)
        }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Error occurs during processing chat" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
            {m.role ==="url" ? <Link className="inline-block text-wrap break-all max-w-[500px] bg-gray-200 dark:bg-gray-700 text-black px-3 py-2 rounded-lg" target="_blank" href={`https://hashscan.io/testnet/transaction/${m.content}`} >{`https://hashscan.io/testnet/transaction/${m.content}`}</Link> :
            m.role === "tool" ? <pre className="inline-block text-black bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg">{m.content}</pre> : (
              <span
                className={
                  m.role === "user"
                    ? "inline-block text-wrap break-all max-w-[500px] bg-indigo-500 text-white px-3 py-2 rounded-lg"
                    : "inline-block text-wrap break-all max-w-[500px] text-black bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg"
                }
              >
                {m.content}
              </span>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="text-left inline-flex bg-gray-200 italic text-gray-500 px-3 py-2 rounded-lg flex gap-2 items-center">
            <span>
              AI is typing...
            </span>
            <LoaderCircle className="animate-spin"/>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-2">
        <input
          className="flex-1 border border-gray-400 text-black dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
        />
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          onClick={handleSend}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Send'}
        </button>
      </div>
    </div>
  );
} 