# Configuration

This guide covers all environment variables, client configurations, authentication
tiers, and troubleshooting for the merx MCP server.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MERX_API_KEY` | No | API key from merx.exchange dashboard. Unlocks trading tools. Format: `merx_sk_...` or `sk_test_...` |
| `TRON_PRIVATE_KEY` | No | 64-character hex private key for transaction signing. Never sent to any server. |
| `MERX_BASE_URL` | No | Override API endpoint. Default: `https://merx.exchange`. Use `https://testnet.merx.exchange` for Shasta testnet. |

All variables are optional. The server starts with zero configuration, exposing 22
read-only tools. Adding credentials unlocks more tools progressively.

---

## Client configurations

### Claude.ai (SSE transport)

Go to Settings > MCP Servers > Add Server. Enter the SSE URL:

```json
{
  "mcpServers": {
    "merx": {
      "url": "https://merx.exchange/mcp/sse"
    }
  }
}
```

No API key required for read-only access. Use `set_api_key` and `set_private_key`
tools within a conversation to unlock additional capabilities.

### Cursor (SSE transport)

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "merx": {
      "url": "https://merx.exchange/mcp/sse"
    }
  }
}
```

Or add globally via Cursor Settings > MCP.

### Claude Code (stdio transport)

```bash
claude mcp add merx -- npx merx
```

With environment variables for full access:

```bash
claude mcp add merx \
  --env MERX_API_KEY=merx_sk_your_key \
  --env TRON_PRIVATE_KEY=your_64_char_hex_key \
  -- npx merx
```

### Generic MCP client (stdio transport)

Any MCP client that supports stdio transport can use this configuration:

```json
{
  "mcpServers": {
    "merx": {
      "command": "npx",
      "args": ["merx"],
      "env": {
        "MERX_API_KEY": "merx_sk_your_key",
        "TRON_PRIVATE_KEY": "your_64_char_hex_key"
      }
    }
  }
}
```

### Generic MCP client (SSE transport)

Any MCP client that supports SSE transport:

```json
{
  "mcpServers": {
    "merx": {
      "url": "https://merx.exchange/mcp/sse"
    }
  }
}
```

---

## Graceful degradation

The server adapts its available toolset based on which credentials are provided.
This allows agents to start with zero setup and progressively unlock capabilities.

### Tier 1: No keys (22 tools)

Available immediately with zero configuration.

- **Price intelligence:** `get_prices`, `get_best_price`, `analyze_prices`, `get_price_history`, `compare_providers`
- **Resource estimation:** `estimate_transaction_cost`, `estimate_contract_call`
- **On-chain queries:** `get_account_info`, `get_trx_balance`, `get_trc20_balance`, `get_transaction`, `get_block`
- **Network utilities:** `get_chain_parameters`, `validate_address`, `convert_address`, `get_trx_price`, `get_transaction_history`
- **Agent convenience:** `explain_concept`, `suggest_duration`, `calculate_savings`, `list_providers`
- **Session management:** `set_api_key`, `set_private_key`

### Tier 2: API key (40 tools)

Unlocked by setting `MERX_API_KEY` or calling `set_api_key` in session.

Everything in Tier 1, plus:

- **Resource trading:** `create_order`, `get_order`, `list_orders`, `ensure_resources`
- **Account management:** `get_balance`, `get_deposit_info`, `search_transaction_history`
- **Standing orders:** `create_standing_order`, `list_standing_orders` (and management tools)
- **Monitors:** `create_monitor`, `list_monitors`
- **Onboarding:** `create_account`, `login`
- **Simulation:** `simulate`
- **Payments:** `enable_auto_deposit`

### Tier 3: API key + private key (52 tools)

Unlocked by additionally setting `TRON_PRIVATE_KEY` or calling `set_private_key`.

Everything in Tier 2, plus:

- **Token operations:** `transfer_trx`, `transfer_trc20`, `approve_trc20`
- **Smart contracts:** `call_contract`
- **DEX swaps:** `get_swap_quote`, `execute_swap`
- **Payments:** `deposit_trx`, `create_paid_order`, `pay_invoice`
- **Intent execution:** `execute_intent`
- **Token info:** `get_token_info`, `get_token_price`, `read_contract`

---

## Session-based authentication

For SSE connections where environment variables cannot be set, use the session
auth tools.

### set_api_key

```
Agent: set_api_key("merx_sk_abc123def456")
-> API key set for this session. 40 tools now available.
```

The key is stored in memory for the duration of the MCP session. It is never
persisted to disk or sent to external services beyond the Merx API.

### set_private_key

```
Agent: set_private_key("a]1b2c3d4e5f6...64_hex_chars")
-> Private key set. Address derived: THT49kLJ...
-> 52 tools now available.
```

The private key is used only for local transaction signing within the MCP process.
It is never transmitted to the Merx API or any other service.

### Session lifecycle

- Keys are set per session and held in memory only.
- When the MCP session ends (browser tab closes, Cursor restarts), keys are discarded.
- For stdio transport, set keys via environment variables to avoid re-entering them.

---

## Troubleshooting

### "Tool not available" or missing tools

The tool requires a higher authentication tier. Check which tier you are on:

- 22 tools visible: no credentials set. Call `set_api_key` to unlock trading tools.
- 40 tools visible: API key set but no private key. Call `set_private_key` for write tools.
- 52 tools visible: full access.

### "Invalid API key"

- Verify the key starts with `merx_sk_` (production) or `sk_test_` (testnet).
- Check that the key has not been revoked in the merx.exchange dashboard.
- Ensure there are no trailing spaces or newlines in the key value.

### "Connection refused" or timeout

- For SSE: verify `https://merx.exchange/mcp/sse` is reachable from your network.
- For stdio: verify `npx merx` runs successfully in your terminal.
- Check if a firewall or proxy is blocking outbound HTTPS connections.

### "Insufficient balance"

- Check your balance with `get_balance`.
- Deposit TRX via the merx.exchange dashboard or use `deposit_trx` to self-deposit.
- Alternatively, use x402 pay-per-use (`create_paid_order`) which requires no
  pre-funded balance.

### "Private key required" on write operations

Write operations (transfers, swaps, contract calls) require `TRON_PRIVATE_KEY`.
The key is used for local signing only. Set it via environment variable (stdio)
or `set_private_key` tool (SSE).

### Transaction stuck or failed

- Use `get_transaction` with the TX hash to check on-chain status.
- If the transaction shows `OUT_OF_ENERGY`, the delegation may have expired before
  broadcast. Increase the duration or reduce the delay between energy purchase and
  transaction broadcast.
- If the transaction shows `BANDWIDTH_NOT_ENOUGH`, the sender had insufficient
  bandwidth and the transaction was too large for the free daily allowance.
