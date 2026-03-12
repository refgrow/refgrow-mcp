# @refgrow/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that wraps the Refgrow REST API. This allows AI agents -- Claude Desktop, Cursor, ChatGPT, and other MCP-compatible clients -- to manage your affiliate program directly.

<a href="https://glama.ai/mcp/servers/refgrow/refgrow-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/refgrow/refgrow-mcp-server/badge" alt="Refgrow Server MCP server" />
</a>

## Prerequisites

- Node.js 18+
- A Refgrow account with an API key (generated in project settings)
- API keys start with `rgk_`

## Installation

```bash
npm install @refgrow/mcp
```

Or clone and build from source:

```bash
git clone https://github.com/refgrow/refgrow-mcp.git
cd refgrow-mcp
npm install
npm run build
```

## Configuration

The server requires two environment variables:

| Variable | Required | Default | Description |
|---|---|---|---|
| `REFGROW_API_KEY` | Yes | -- | Your Refgrow API key (starts with `rgk_`) |
| `REFGROW_API_URL` | No | `https://refgrow.com` | Base URL of your Refgrow instance |

### Getting an API Key

1. Log in to [Refgrow](https://refgrow.com)
2. Go to your project settings
3. Scroll to the **API Keys** section
4. Click **Generate API Key**
5. Copy the key (it starts with `rgk_` and is shown only once)

## Usage with Claude Desktop

Add this to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "refgrow": {
      "command": "npx",
      "args": ["-y", "@refgrow/mcp"],
      "env": {
        "REFGROW_API_KEY": "rgk_your_api_key_here"
      }
    }
  }
}
```

Or if installed globally / from source:

```json
{
  "mcpServers": {
    "refgrow": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server/dist/index.js"],
      "env": {
        "REFGROW_API_KEY": "rgk_your_api_key_here"
      }
    }
  }
}
```

## Usage with Cursor

In Cursor settings, add an MCP server with:

- **Name:** refgrow
- **Command:** `npx -y @refgrow/mcp`
- **Environment:** `REFGROW_API_KEY=rgk_your_api_key_here`

Or add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "refgrow": {
      "command": "npx",
      "args": ["-y", "@refgrow/mcp"],
      "env": {
        "REFGROW_API_KEY": "rgk_your_api_key_here"
      }
    }
  }
}
```

## Usage with Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "refgrow": {
      "command": "npx",
      "args": ["-y", "@refgrow/mcp"],
      "env": {
        "REFGROW_API_KEY": "rgk_your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### Affiliates

| Tool | Description |
|---|---|
| `list_affiliates` | List all affiliates with stats (clicks, signups, purchases, earnings) |
| `get_affiliate_details` | Get details for a specific affiliate by email |
| `create_affiliate` | Create a new affiliate with optional custom referral code |
| `update_affiliate` | Update affiliate email, referral code, status, or partner slug |
| `delete_affiliate` | Remove an affiliate from the project |

### Referrals

| Tool | Description |
|---|---|
| `list_referrals` | List referred users, filterable by affiliate or status |
| `get_referral_details` | Get details for a specific referred user by email |
| `create_referral` | Manually create a referred user record |

### Conversions

| Tool | Description |
|---|---|
| `list_conversions` | List conversions with filters for type, affiliate, date range, paid status |
| `get_conversion` | Get a specific conversion by ID |
| `create_conversion` | Create a conversion (signup/purchase) with auto-commission calculation |
| `update_conversion` | Update conversion details or mark as paid |
| `delete_conversion` | Delete a conversion record |

### Coupons

| Tool | Description |
|---|---|
| `list_coupons` | List coupon codes with affiliate info |
| `get_coupon` | Get a specific coupon by ID |
| `create_coupon` | Create a coupon linked to an affiliate (with optional Stripe/LemonSqueezy IDs) |
| `update_coupon` | Update coupon details |
| `delete_coupon` | Delete a coupon (also removes from Stripe if linked) |

## Example Conversations

Once connected, you can ask your AI agent things like:

- "Show me all active affiliates and their earnings"
- "Create a new affiliate for partner@example.com with referral code PARTNER2025"
- "List all unpaid conversions from the last 30 days"
- "How many signups did we get through affiliate referrals this month?"
- "Create a coupon code SAVE20 linked to affiliate ID 42"
- "Mark conversion #123 as paid"
- "Deactivate the affiliate with email old-partner@example.com"

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode for development
npm run dev

# Run the server (requires REFGROW_API_KEY env var)
REFGROW_API_KEY=rgk_your_key npm start
```

## Documentation

Full setup guide with examples and troubleshooting:
https://refgrow.com/docs/mcp-server

REST API reference (for direct HTTP integration):
https://refgrow.com/docs/api-reference

## License

MIT