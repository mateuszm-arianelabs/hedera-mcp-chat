"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { experimental_createMCPClient as createMCPClient, generateText } from "ai";

type Payload = {
    txBytes: string;
} & Record<string, string | number | boolean>

const openai = createOpenAI({
    compatibility: 'strict',
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

async function generateTextWithTools(accountId: string, prompt: string) {
    const mcpClient = await createMCPClient({
        transport: {
            type: 'sse',
            url: process.env.NEXT_PUBLIC_MCP_URL!,
            headers: {
                "X-MCP-AUTH-TOKEN": "your-mcp-auth-token",
                "X-HEDERA-ACCOUNT-ID": accountId
            }
        },
    });

    const mcpTools = await mcpClient.tools();

    return generateText({
        model: openai.chat('gpt-4o'),
        tools: mcpTools,
        messages: [{ role: 'user', content: prompt }],
    })
}

export async function handleChat(accountId: string, input: string, currentTransaction: Payload | null) {
    let prompt = input;

    if(currentTransaction) {
        prompt = `You're writing prompt to create new transaction ${currentTransaction.transactionType} and that's my current payload <payload>${JSON.stringify(currentTransaction)}</payload> now i want to edit this playload base on this input ${input}`
    }

    const { toolResults, text, finishReason } = await generateTextWithTools(accountId, prompt);

    console.log({ toolResults, text, finishReason });

    return { text, toolResults };
}

export async function summaryToolResult(toolResult: unknown) {
    const { text } = await generateText({
        model: openai.chat('gpt-4o'),
        system: `You are a helpful assistant that summarizes the results of a tool call in context of interacting with a Hedera blockchain.`,
        messages: [{ role: 'user', content: JSON.stringify(toolResult) }],
    })

    return text;
}
