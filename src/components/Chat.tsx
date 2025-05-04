'use client';
import { Dispatch, SetStateAction, useState } from "react";
import { handleChat, summaryToolResult } from "@/actions/handle-chat";
import { toast } from "react-toastify";

interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
}

interface ChatProps {
  onTransactionPrepared: (payload: string) => void;
  accountId: string | null;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export default function Chat({ onTransactionPrepared, accountId, messages, setMessages }: ChatProps) {
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
      const { text, toolResults } = await handleChat(accountId, input);

      if (toolResults.length > 0) {
        const toolResult = JSON.parse((toolResults[0].result.content as any)[0].text);

        if ("txBytes" in toolResult) {
          // Notify parent to handle transaction signing/execution
          setMessages((prev) => [...prev, {
            role: 'tool', content: "We prepared the transaction, please sign and execute it"
          }]);
          onTransactionPrepared(toolResult.txBytes);
          return;
        }

        const summary = await summaryToolResult(toolResults);
        setMessages((prev) => [...prev, { role: 'assistant', content: summary }, {
          role: 'tool', content: JSON.stringify(toolResult, null, 2)
        }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
      }


      // if (mcpClient) {
      //   const toolRes = await mcpClient.callTool({
      //     name: 'interact-with-hedera',
      //     args: { fullPrompt: input },
      //   });
      //   const payload = (toolRes as any).result ?? toolRes;
      //   if (typeof payload.txBytes === 'string') {
      //     const signature = await signTxBytes(payload.txBytes);
      //     setMessages((prev) => [
      //       ...prev,
      //       { role: 'assistant', content: `Transaction requires signature. Signed: ${signature}` },
      //     ]);
      //   } else if (payload.answer) {
      //     setMessages((prev) => [
      //       ...prev,
      //       { role: 'assistant', content: payload.answer },
      //     ]);
      //   } else {
      //     setMessages((prev) => [
      //       ...prev,
      //       { role: 'assistant', content: JSON.stringify(payload) },
      //     ]);
      //   }
      // } else {
      //   const { text } = await generateText({
      //     model: openai.chat('o3-mini'),
      //     messages: newMessages.map(({ role, content }) => ({ role, content })),
      //   });
      //   setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
      // }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
            {m.role === "tool" ? <pre className="inline-block text-black bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg">{m.content}</pre> : (
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
          <div className="text-left">
            <span className="inline-block bg-gray-200 italic text-gray-500 px-3 py-2 rounded-lg">
              AI is typing...
            </span>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          className="flex-1 border border-gray-300 text-black dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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