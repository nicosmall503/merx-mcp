# Session Management

The Session Management tools configure authentication credentials for the current MCP
session. They are typically the first tools an agent calls before performing any
authenticated operations. Once set, credentials persist for the duration of the session
and are used automatically by all tools that require them.

There are two credentials: a Merx API key (for account-level operations like trading,
balance checks, and order management) and a TRON private key (for on-chain operations
like transfers, swaps, and contract calls). The `set_api_key` tool stores the API key
in session context. The `set_private_key` tool accepts a TRON private key hexadecimal
string, derives the corresponding TRON address automatically via TronWeb, and stores
both for use by on-chain tools.

---

## set_api_key

Set your Merx API key for the current session. This unlocks all authenticated tools
including order creation, balance queries, standing orders, and monitors. API keys
start with `merx_sk_` and can be obtained via the `create_account` or `login` tools,
or from the Merx dashboard at merx.exchange.

If you already have an API key, use this tool directly. If you need to create an
account or log in, use `create_account` or `login` instead -- they set the API key
automatically.

**Auth:** none (this tool sets credentials)

**Input schema:**
```json
{
  "api_key": {
    "type": "string",
    "required": true,
    "description": "Your Merx API key (starts with merx_sk_)."
  }
}
```

**Example input:** `{ "api_key": "merx_sk_7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w" }`

**Example output:**
```
API Key Set:

Key:        merx_sk_7h8i...1v2w (truncated)
Status:     Valid
Account:    usr_a1b2c3d4e5f6
Balance:    84.200 TRX

The following tools are now available:
  - create_order, get_order, list_orders
  - ensure_resources
  - get_balance, get_deposit_info, get_transaction_history
  - create_standing_order, list_standing_orders
  - create_monitor, list_monitors
  - execute_intent, simulate
  - deposit_trx, enable_auto_deposit
```

**Related tools:** set_private_key, create_account, login

---

## set_private_key

Set your TRON private key for the current session. The tool derives the corresponding
TRON address automatically via TronWeb and stores both the key and address in session
context. This unlocks all on-chain tools including transfers, swaps, contract calls,
and deposits.

The private key is a 64-character hexadecimal string. It is stored only in memory for
the duration of the session and is never persisted to disk or transmitted to Merx
servers. All signing operations happen locally within the MCP server process.

**Auth:** none (this tool sets credentials)

**Input schema:**
```json
{
  "private_key": {
    "type": "string",
    "required": true,
    "description": "TRON private key (64-char hex string)."
  }
}
```

**Example input:** `{ "private_key": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" }`

**Example output:**
```
Private Key Set:

Derived address: TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
TRX balance:     1,245.320 TRX
Energy:          0
Bandwidth:       600 / 600

The following tools are now available:
  - transfer_trx, transfer_trc20, approve_trc20
  - call_contract
  - execute_swap
  - deposit_trx
  - execute_intent (on-chain steps)

Security note: Your private key is stored in memory only for this session.
It is never sent to Merx servers. All signing happens locally.
```

**Related tools:** set_api_key, create_account, get_account_info
