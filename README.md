# HEDERA CHAT

## Demo project to show usage of [MCP Hedera Server](https://github.com/hedera-dev/mcp-server-hedera)

The main purpose of this project is to demonstrate a non-custodial flow for Hedera transactions created by the MCP Server. You chat your intent, the model decides whether to call the `interact-with-hedera` tool, which serves as a gateway to all MCP Server actions via Langchain.

## Local Quick Start

1. **Launch MCP Server services**

   * Follow setup instructions here: [https://hedera-mcp-docs.vercel.app/](https://hedera-mcp-docs.vercel.app/)

2. **Start services**

   ```bash
   pnpm run dev:lc    # Langchain service
   pnpm run dev:mcp   # MCP Server
   ```

3. **Clone this repo**

   ```bash
   git clone https://github.com/mateuszm-arianelabs/hedera-mcp-chat.git
   cd hedera-mcp-chat
   ```

4. **Install dependencies**

   ```bash
   pnpm install
   ```

5. **Create .env file**

   * Copy `.env.example` to `.env`
   * Fill in the required environment variables:

     ```env
     NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
     NEXT_PUBLIC_OPENAI_API_KEY=
     NEXT_PUBLIC_MCP_URL="http://localhost:3000/sse"
     ```
   * `NEXT_PUBLIC_MCP_URL` will remain `http://localhost:3000/sse` if you don’t change the default configuration of the MCP server.

6. **Run the chat**

   ```bash
   pnpm run dev
   ```

Open [http://localhost:3002](http://localhost:3002) and enjoy! 🎉
