#!/usr/bin/env node

/**
 * Refgrow MCP Server
 *
 * A Model Context Protocol server that wraps the Refgrow REST API,
 * allowing AI agents (Claude, GPT, Cursor) to manage affiliate programs.
 *
 * Configuration via environment variables:
 *   REFGROW_API_KEY  - API key with rgk_ prefix (required)
 *   REFGROW_API_URL  - Base URL (default: https://refgrow.com)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import type { RefgrowConfig } from "./types.js";

async function main(): Promise<void> {
  // --- Read configuration from environment ---
  const apiKey = process.env.REFGROW_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: REFGROW_API_KEY environment variable is required.\n" +
        "Generate an API key in your Refgrow project settings.\n" +
        "The key should start with 'rgk_'."
    );
    process.exit(1);
  }

  if (!apiKey.startsWith("rgk_")) {
    console.error(
      "Error: REFGROW_API_KEY must start with 'rgk_'.\n" +
        "Generate a valid API key in your Refgrow project settings."
    );
    process.exit(1);
  }

  const baseUrl = process.env.REFGROW_API_URL || "https://refgrow.com";

  const config: RefgrowConfig = { apiKey, baseUrl };

  // --- Create and configure MCP server ---
  const server = new McpServer({
    name: "refgrow",
    version: "1.0.0",
  });

  // Register all Refgrow tools
  registerTools(server, config);

  // --- Connect via stdio transport ---
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol messages)
  console.error("Refgrow MCP Server running on stdio");
  console.error(`  API URL: ${baseUrl}`);
  console.error(`  API Key: ${apiKey.substring(0, 8)}...`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
