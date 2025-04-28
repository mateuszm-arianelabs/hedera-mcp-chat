"use server";

import { createOpenAI } from "@ai-sdk/openai";
import { experimental_createMCPClient as createMCPClient, generateText } from "ai";

const openai = createOpenAI({
    compatibility: 'strict',
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const mcpClient = await createMCPClient({
    transport: {
        type: 'sse',
        url: process.env.NEXT_PUBLIC_MCP_URL!,
        headers: {
            "X-MCP-AUTH-TOKEN": "your-mcp-auth-token"
        }
    },
});

const mcpTools = await mcpClient.tools();

function generateTextWithTools(prompt: string) {
    return generateText({
        model: openai.chat('o3-mini'),
        tools: mcpTools,
        messages: [{ role: 'user', content: prompt }],
    })
}

export async function handleChat(input: string) {
    const { toolResults, text, finishReason } = await generateTextWithTools(input);

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
