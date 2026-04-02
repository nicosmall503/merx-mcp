# Merx MCP Server -- Tool Reference

Complete reference for all 54 tools exposed by the Merx MCP server.
Tools are grouped into 15 categories. Each entry shows the tool name, authentication
requirements, input parameters, and a brief usage example.

Auth levels:
- **none** -- no credentials needed, public data only
- **API key** -- requires a Merx API key set via `set_api_key`
- **Private key** -- requires the caller to supply or have stored a TRON private key

---

## 1. Price Intelligence (5 tools)

### get_prices
| Field | Value |
|-------|-------|
| Category | Price Intelligence |
| Description | Fetch current energy prices from all active providers. Returns provider name, price in SUN, minimum order, and available capacity. |
| Auth | none |
| Params | `duration_hours` (number, optional) -- rental period filter, default 1h |
| Example | `get_prices({ duration_hours: 24 })` returns a table with Netts at 22 SUN, CatFee at 27 SUN, etc. |

### get_best_price
| Field | Value |
|-------|-------|
| Category | Price Intelligence |
| Description | Return the single cheapest provider for a given energy amount and duration. |
| Auth | none |
| Params | `energy_amount` (number, required) -- energy in SUN; `duration_hours` (number, optional) |
| Example | `get_best_price({ energy_amount: 65000 })` returns Netts at 22 SUN with total cost 1.43 TRX. |

### compare_providers
| Field | Value |
|-------|-------|
| Category | Price Intelligence |
| Description | Side-by-side comparison of two or more providers on price, fill rate, uptime, and average delegation speed. |
| Auth | none |
| Params | `providers` (string[], required) -- provider slugs; `energy_amount` (number, optional) |
| Example | `compare_providers({ providers: ["netts", "catfee"], energy_amount: 65000 })` |

### analyze_prices
| Field | Value |
|-------|-------|
| Category | Price Intelligence |
| Description | Statistical analysis of price history: mean, median, percentiles, volatility, and trend direction over the requested window. |
| Auth | none |
| Params | `window` (string, optional) -- `1h`, `24h`, `7d`, `30d`; `provider` (string, optional) |
| Example | `analyze_prices({ window: "24h" })` returns 24h stats across all providers. |

### get_price_history
| Field | Value |
|-------|-------|
| Category | Price Intelligence |
| Description | Time-series price data for charting or analysis. Returns timestamped price points per provider. |
| Auth | none |
| Params | `provider` (string, optional); `from` (ISO string, optional); `to` (ISO string, optional); `interval` (string, optional) |
| Example | `get_price_history({ provider: "netts", interval: "1h", from: "2026-03-29T00:00:00Z" })` |

---

## 2. Resource Estimation (2 tools)

### estimate_transaction_cost
| Field | Value |
|-------|-------|
| Category | Resource Estimation |
| Description | Estimate energy and bandwidth needed for a transaction type (TRX transfer, TRC-20 transfer, contract call). Returns required resources and cost with and without Merx energy. |
| Auth | none |
| Params | `transaction_type` (string, required) -- `transfer_trx`, `transfer_trc20`, `contract_call`; `contract_address` (string, optional); `amount` (number, optional) |
| Example | `estimate_transaction_cost({ transaction_type: "transfer_trc20" })` returns 65,000 energy needed, 14.1 TRX burned vs 1.43 TRX via Merx (savings 89%). |

### estimate_contract_call
| Field | Value |
|-------|-------|
| Category | Resource Estimation |
| Description | Dry-run a smart contract call to measure exact energy consumption without broadcasting. |
| Auth | none |
| Params | `contract_address` (string, required); `function_selector` (string, required); `parameters` (string[], optional); `caller` (string, optional) |
| Example | `estimate_contract_call({ contract_address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", function_selector: "transfer(address,uint256)", parameters: ["TYaddr...", "1000000"] })` |

---

## 3. Resource Trading (4 tools)

### create_order
| Field | Value |
|-------|-------|
| Category | Resource Trading |
| Description | Place an energy or bandwidth purchase order. Deducts from Merx balance. Delegation is confirmed on-chain within seconds. |
| Auth | API key |
| Params | `resource_type` (string, required) -- `energy` or `bandwidth`; `amount` (number, required); `duration_hours` (number, required); `target_address` (string, required); `provider` (string, optional) -- auto-selects cheapest if omitted; `max_price_sun` (number, optional) |
| Example | `create_order({ resource_type: "energy", amount: 65000, duration_hours: 1, target_address: "TYaddr..." })` |

### create_paid_order
| Field | Value |
|-------|-------|
| Category | Resource Trading |
| Description | Create an order and pay directly from a TRON wallet (no pre-deposit needed). Returns a payment transaction for signing. |
| Auth | Private key |
| Params | `resource_type` (string, required); `amount` (number, required); `duration_hours` (number, required); `target_address` (string, required); `provider` (string, optional) |
| Example | `create_paid_order({ resource_type: "energy", amount: 65000, duration_hours: 1, target_address: "TYaddr..." })` |

### get_order
| Field | Value |
|-------|-------|
| Category | Resource Trading |
| Description | Retrieve details and status of an existing order by ID. |
| Auth | API key |
| Params | `order_id` (string, required) |
| Example | `get_order({ order_id: "ord_abc123" })` |

### list_orders
| Field | Value |
|-------|-------|
| Category | Resource Trading |
| Description | List orders with optional filters. Supports pagination. |
| Auth | API key |
| Params | `status` (string, optional) -- `pending`, `active`, `completed`, `failed`; `limit` (number, optional); `offset` (number, optional) |
| Example | `list_orders({ status: "active", limit: 10 })` |

---

## 4. Account Management (3 tools)

### get_balance
| Field | Value |
|-------|-------|
| Category | Account Management |
| Description | Return the current Merx account balance in TRX and USDT. |
| Auth | API key |
| Params | none |
| Example | `get_balance()` returns `{ trx: 142.5, usdt: 0 }` |

### get_deposit_info
| Field | Value |
|-------|-------|
| Category | Account Management |
| Description | Return the deposit address and instructions for funding a Merx account. |
| Auth | API key |
| Params | none |
| Example | `get_deposit_info()` returns the TRX deposit address and minimum deposit amount. |

### enable_auto_deposit
| Field | Value |
|-------|-------|
| Category | Account Management |
| Description | Enable automatic TRX deposits from a linked wallet when balance drops below a threshold. |
| Auth | Private key |
| Params | `threshold_trx` (number, required); `deposit_amount_trx` (number, required) |
| Example | `enable_auto_deposit({ threshold_trx: 10, deposit_amount_trx: 50 })` |

---

## 5. Agent Convenience (4 tools)

### explain_concept
| Field | Value |
|-------|-------|
| Category | Agent Convenience |
| Description | Return a plain-language explanation of a TRON or Merx concept. Useful for agents that need to educate users. |
| Auth | none |
| Params | `concept` (string, required) -- e.g. `energy`, `bandwidth`, `delegation`, `staking`, `sun` |
| Example | `explain_concept({ concept: "energy" })` |

### suggest_duration
| Field | Value |
|-------|-------|
| Category | Agent Convenience |
| Description | Recommend an optimal rental duration based on the user's transaction pattern (one-off vs recurring). |
| Auth | none |
| Params | `transaction_type` (string, required); `frequency` (string, optional) -- `once`, `daily`, `hourly` |
| Example | `suggest_duration({ transaction_type: "transfer_trc20", frequency: "daily" })` returns "24h" with cost analysis. |

### calculate_savings
| Field | Value |
|-------|-------|
| Category | Agent Convenience |
| Description | Calculate exact savings from using Merx energy vs burning TRX, for a given transaction type and count. |
| Auth | none |
| Params | `transaction_type` (string, required); `count` (number, optional, default 1) |
| Example | `calculate_savings({ transaction_type: "transfer_trc20", count: 10 })` returns per-tx and total savings, up to 94% reduction. |

### simulate
| Field | Value |
|-------|-------|
| Category | Agent Convenience |
| Description | Dry-run a multi-step intent plan without executing. Returns projected costs, resource needs, and step-by-step breakdown. |
| Auth | API key |
| Params | `steps` (object[], required) -- array of action descriptors; `strategy` (string, optional) -- `batch_cheapest`, `per_step`, `no_resources` |
| Example | `simulate({ steps: [{ action: "transfer_trc20", to: "TYaddr...", token: "USDT", amount: 100 }], strategy: "batch_cheapest" })` |

---

## 6. On-chain Queries (5 tools)

### get_account_info
| Field | Value |
|-------|-------|
| Category | On-chain Queries |
| Description | Full TRON account details: TRX balance, staked resources, delegations received, permissions. |
| Auth | none |
| Params | `address` (string, required) |
| Example | `get_account_info({ address: "TYaddr..." })` |

### get_transaction
| Field | Value |
|-------|-------|
| Category | On-chain Queries |
| Description | Fetch a transaction by hash. Returns status, block, timestamp, energy/bandwidth consumed. |
| Auth | none |
| Params | `tx_hash` (string, required) |
| Example | `get_transaction({ tx_hash: "a1b2c3..." })` |

### get_block
| Field | Value |
|-------|-------|
| Category | On-chain Queries |
| Description | Retrieve a block by number or `latest`. Returns block header, transaction count, and witness. |
| Auth | none |
| Params | `block` (string, required) -- block number or `latest` |
| Example | `get_block({ block: "latest" })` |

### get_chain_parameters
| Field | Value |
|-------|-------|
| Category | On-chain Queries |
| Description | Current TRON network parameters: energy price, bandwidth price, staking yield, maintenance window. |
| Auth | none |
| Params | none |
| Example | `get_chain_parameters()` |

### get_transaction_history
| Field | Value |
|-------|-------|
| Category | On-chain Queries |
| Description | Paginated transaction history for an address. Filter by type, token, or date range. |
| Auth | none |
| Params | `address` (string, required); `type` (string, optional); `token` (string, optional); `limit` (number, optional); `offset` (number, optional) |
| Example | `get_transaction_history({ address: "TYaddr...", type: "trc20", limit: 20 })` |

---

## 7. Token Operations (4 tools)

### get_trx_balance
| Field | Value |
|-------|-------|
| Category | Token Operations |
| Description | TRX balance of any TRON address. |
| Auth | none |
| Params | `address` (string, required) |
| Example | `get_trx_balance({ address: "TYaddr..." })` returns `{ balance_trx: 1250.5 }` |

### get_trc20_balance
| Field | Value |
|-------|-------|
| Category | Token Operations |
| Description | TRC-20 token balance for an address. Supports USDT, USDC, and any TRC-20 by contract address. |
| Auth | none |
| Params | `address` (string, required); `token` (string, required) -- `USDT`, `USDC`, or contract address |
| Example | `get_trc20_balance({ address: "TYaddr...", token: "USDT" })` |

### get_token_info
| Field | Value |
|-------|-------|
| Category | Token Operations |
| Description | Token metadata: name, symbol, decimals, total supply, contract address. |
| Auth | none |
| Params | `token` (string, required) -- symbol or contract address |
| Example | `get_token_info({ token: "USDT" })` |

### get_token_price
| Field | Value |
|-------|-------|
| Category | Token Operations |
| Description | Current market price of a token in USD and TRX. |
| Auth | none |
| Params | `token` (string, required) |
| Example | `get_token_price({ token: "TRX" })` returns `{ usd: 0.217, ... }` |

---

## 8. Smart Contracts (3 tools)

### read_contract
| Field | Value |
|-------|-------|
| Category | Smart Contracts |
| Description | Call a constant (view/pure) function on a smart contract. No gas consumed. |
| Auth | none |
| Params | `contract_address` (string, required); `function_selector` (string, required); `parameters` (string[], optional) |
| Example | `read_contract({ contract_address: "TR7NH...", function_selector: "balanceOf(address)", parameters: ["TYaddr..."] })` |

### call_contract
| Field | Value |
|-------|-------|
| Category | Smart Contracts |
| Description | Build and sign a state-changing contract call transaction. Ensures resources before execution. |
| Auth | Private key |
| Params | `contract_address` (string, required); `function_selector` (string, required); `parameters` (string[], optional); `call_value` (number, optional) -- TRX to send with call |
| Example | `call_contract({ contract_address: "TXaddr...", function_selector: "stake(uint256)", parameters: ["1000000"] })` |

### approve_trc20
| Field | Value |
|-------|-------|
| Category | Smart Contracts |
| Description | Approve a spender for a TRC-20 token. Commonly needed before DEX swaps. |
| Auth | Private key |
| Params | `token` (string, required); `spender` (string, required); `amount` (number, required) |
| Example | `approve_trc20({ token: "USDT", spender: "TRouterAddr...", amount: 1000000000 })` |

---

## 9. Network Utilities (5 tools)

### validate_address
| Field | Value |
|-------|-------|
| Category | Network Utilities |
| Description | Check whether a string is a valid TRON address (base58 or hex). |
| Auth | none |
| Params | `address` (string, required) |
| Example | `validate_address({ address: "TYaddr..." })` returns `{ valid: true, format: "base58" }` |

### convert_address
| Field | Value |
|-------|-------|
| Category | Network Utilities |
| Description | Convert between base58 and hex TRON address formats. |
| Auth | none |
| Params | `address` (string, required) |
| Example | `convert_address({ address: "TYaddr..." })` returns both base58 and hex representations. |

### get_trx_price
| Field | Value |
|-------|-------|
| Category | Network Utilities |
| Description | Current TRX market price in USD. |
| Auth | none |
| Params | none |
| Example | `get_trx_price()` returns `{ usd: 0.217, change_24h: "+2.1%" }` |

### check_address_resources
| Field | Value |
|-------|-------|
| Category | Network Utilities |
| Description | Check available energy and bandwidth for an address, including delegated resources. |
| Auth | none |
| Params | `address` (string, required) |
| Example | `check_address_resources({ address: "TYaddr..." })` returns energy limit/used, bandwidth limit/used. |

### search_transaction_history
| Field | Value |
|-------|-------|
| Category | Network Utilities |
| Description | Full-text search across an address's transaction history with advanced filters. |
| Auth | none |
| Params | `address` (string, required); `query` (string, optional); `from` (ISO string, optional); `to` (ISO string, optional) |
| Example | `search_transaction_history({ address: "TYaddr...", query: "USDT" })` |

---

## 10. DEX Swaps (3 tools)

### get_swap_quote
| Field | Value |
|-------|-------|
| Category | DEX Swaps |
| Description | Get a swap quote from SunSwap v2/v3. Returns expected output, price impact, and route. |
| Auth | none |
| Params | `from_token` (string, required); `to_token` (string, required); `amount` (number, required) |
| Example | `get_swap_quote({ from_token: "TRX", to_token: "USDT", amount: 1000 })` |

### execute_swap
| Field | Value |
|-------|-------|
| Category | DEX Swaps |
| Description | Execute a token swap on SunSwap. Resources are auto-provisioned via Merx before the swap. |
| Auth | Private key |
| Params | `from_token` (string, required); `to_token` (string, required); `amount` (number, required); `slippage` (number, optional, default 0.5) -- percent |
| Example | `execute_swap({ from_token: "TRX", to_token: "USDT", amount: 1000, slippage: 1.0 })` |

### list_providers
| Field | Value |
|-------|-------|
| Category | DEX Swaps |
| Description | List all available energy providers with current status and pricing. |
| Auth | none |
| Params | none |
| Example | `list_providers()` returns all active providers, sorted by price. |

---

## 11. Onboarding (2 tools)

### create_account
| Field | Value |
|-------|-------|
| Category | Onboarding |
| Description | Register a new Merx account. Returns API key and deposit address. |
| Auth | none |
| Params | `email` (string, optional); `webhook_url` (string, optional) |
| Example | `create_account({ email: "user@example.com" })` |

### login
| Field | Value |
|-------|-------|
| Category | Onboarding |
| Description | Authenticate with existing credentials and receive a session token. |
| Auth | none |
| Params | `api_key` (string, required) |
| Example | `login({ api_key: "mk_live_..." })` |

---

## 12. Payments (4 tools)

### deposit_trx
| Field | Value |
|-------|-------|
| Category | Payments |
| Description | Deposit TRX from a connected wallet into the Merx account balance. |
| Auth | Private key |
| Params | `amount_trx` (number, required) |
| Example | `deposit_trx({ amount_trx: 50 })` |

### pay_invoice
| Field | Value |
|-------|-------|
| Category | Payments |
| Description | Pay an x402 invoice by ID. Used for zero-registration purchases. |
| Auth | Private key |
| Params | `invoice_id` (string, required) |
| Example | `pay_invoice({ invoice_id: "inv_xyz789" })` |

### ensure_resources
| Field | Value |
|-------|-------|
| Category | Payments |
| Description | Ensure an address has sufficient energy and bandwidth for a planned transaction. Purchases only the deficit. |
| Auth | API key |
| Params | `address` (string, required); `energy_needed` (number, required); `bandwidth_needed` (number, optional) |
| Example | `ensure_resources({ address: "TYaddr...", energy_needed: 65000 })` |

### get_swap_quote (also listed under DEX)
See DEX Swaps section.

---

## 13. Intent Execution (2 tools)

### execute_intent
| Field | Value |
|-------|-------|
| Category | Intent Execution |
| Description | Execute a multi-step plan atomically. The server provisions resources, sequences transactions, and handles rollback on failure. See INTENT-GUIDE.md for full details. |
| Auth | Private key |
| Params | `steps` (object[], required) -- ordered action list; `strategy` (string, optional) -- `batch_cheapest`, `per_step`, `no_resources`; `dry_run` (boolean, optional) |
| Example | `execute_intent({ steps: [{ action: "ensure_resources", address: "TY...", energy: 65000 }, { action: "transfer_trc20", to: "TX...", token: "USDT", amount: 100 }], strategy: "batch_cheapest" })` |

### simulate
See Agent Convenience section above.

---

## 14. Standing Orders (4 tools)

### create_standing_order
| Field | Value |
|-------|-------|
| Category | Standing Orders |
| Description | Create a server-side standing order that triggers automatically based on price, schedule, or balance conditions. |
| Auth | API key |
| Params | `trigger_type` (string, required) -- `price_below`, `schedule`, `balance_below`, `delegation_expiry`; `trigger_value` (object, required); `action` (object, required); `budget_trx` (number, optional); `max_executions` (number, optional) |
| Example | `create_standing_order({ trigger_type: "price_below", trigger_value: { price_sun: 25 }, action: { type: "buy_energy", amount: 100000, duration_hours: 1, target: "TYaddr..." }, budget_trx: 100 })` |

### list_standing_orders
| Field | Value |
|-------|-------|
| Category | Standing Orders |
| Description | List all standing orders with status and execution history. |
| Auth | API key |
| Params | `status` (string, optional) -- `active`, `paused`, `exhausted` |
| Example | `list_standing_orders({ status: "active" })` |

### create_monitor
| Field | Value |
|-------|-------|
| Category | Standing Orders |
| Description | Create a passive monitor that sends notifications when conditions are met (no auto-execution). |
| Auth | API key |
| Params | `type` (string, required) -- `delegation_expiry`, `balance_threshold`, `price_alert`; `config` (object, required); `notify` (object, required) -- `{ channel: "webhook" | "telegram", target: "..." }` |
| Example | `create_monitor({ type: "price_alert", config: { provider: "netts", below_sun: 20 }, notify: { channel: "webhook", target: "https://example.com/hook" } })` |

### list_monitors
| Field | Value |
|-------|-------|
| Category | Standing Orders |
| Description | List active monitors with last-triggered timestamps. |
| Auth | API key |
| Params | none |
| Example | `list_monitors()` |

---

## 15. Session Management (2 tools)

### set_api_key
| Field | Value |
|-------|-------|
| Category | Session Management |
| Description | Set the Merx API key for the current MCP session. All subsequent authenticated calls use this key. |
| Auth | none |
| Params | `api_key` (string, required) |
| Example | `set_api_key({ api_key: "mk_live_abc123..." })` |

### transfer_trx
| Field | Value |
|-------|-------|
| Category | Token Operations |
| Description | Send TRX from the connected wallet to any TRON address. |
| Auth | Private key |
| Params | `to` (string, required); `amount_trx` (number, required) |
| Example | `transfer_trx({ to: "TYaddr...", amount_trx: 10 })` |

### transfer_trc20
| Field | Value |
|-------|-------|
| Category | Token Operations |
| Description | Send a TRC-20 token (USDT, USDC, etc.) to any TRON address. Resources auto-provisioned. |
| Auth | Private key |
| Params | `to` (string, required); `token` (string, required); `amount` (number, required) |
| Example | `transfer_trc20({ to: "TYaddr...", token: "USDT", amount: 100 })` |

---

## Quick Auth Reference

| Level | How to set up | Tools that require it |
|-------|--------------|----------------------|
| none | -- | All read-only and estimation tools |
| API key | `set_api_key` or `create_account` | create_order, get_balance, list_orders, standing orders, monitors |
| Private key | Provided by caller per-session | create_paid_order, execute_intent, execute_swap, transfer_trx, transfer_trc20, deposit_trx, call_contract, approve_trc20 |
