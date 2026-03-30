# Merx MCP Server -- API Reference

All Merx REST API endpoints used by the MCP server. Most users interact through
MCP tools rather than calling the API directly. This reference is for developers
building custom integrations.

Base URL: `https://api.merx.exchange/api/v1`

Authentication: `Authorization: Bearer mk_live_...` (API key)

Error format: `{ "error": { "code": "string", "message": "string", "details": {} } }`

---

## Standard Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/prices` | none | Current energy prices from all providers. Query: `?duration_hours=1` |
| GET | `/prices/analysis` | none | Price statistics: mean, median, percentiles, volatility. Query: `?window=24h` |
| GET | `/prices/stats` | none | Aggregated price stats with trend direction. |
| POST | `/orders` | API key | Create an energy or bandwidth order. Supports `Idempotency-Key` header. Body: `{ resource_type, amount, duration_hours, target_address, provider?, max_price_sun? }` |
| GET | `/orders` | API key | List orders. Query: `?status=active&limit=10&offset=0` |
| GET | `/orders/:id` | API key | Get order by ID. |
| GET | `/balance` | API key | Current account balance in TRX and USDT. |
| GET | `/history` | API key | Account transaction history (deposits, withdrawals, orders). |
| POST | `/deposit` | API key | Get deposit address and instructions. |
| POST | `/withdraw` | API key | Withdraw from Merx balance. Supports `Idempotency-Key` header. Body: `{ amount_trx, to_address }` |
| GET | `/keys` | API key | List API keys for the account. |
| POST | `/keys` | API key | Create a new API key. |
| POST | `/webhooks` | API key | Register a webhook URL. Body: `{ url, events[] }` |
| GET | `/webhooks` | API key | List registered webhooks. |
| POST | `/estimate` | none | Estimate resources for a transaction type. Body: `{ transaction_type, contract_address?, amount? }` |
| POST | `/ensure` | API key | Ensure address has sufficient resources, buy deficit. Body: `{ address, energy_needed, bandwidth_needed? }` |

---

## Chain Proxy Endpoints

These endpoints proxy requests to the TRON network, providing a unified interface
without requiring a TronWeb connection.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/chain/account/:address` | none | Full TRON account data: balance, stakes, permissions. |
| GET | `/chain/resources/:address` | none | Energy and bandwidth with owned/delegated breakdown. |
| GET | `/chain/balance/:address` | none | TRX balance only. |
| GET | `/chain/transaction/:hash` | none | Transaction details by hash. |
| GET | `/chain/block/:number` | none | Block by number. Use `latest` for current block. |
| GET | `/chain/parameters` | none | Current TRON network parameters. |
| GET | `/chain/history/:address` | none | Transaction history. Query: `?type=trc20&token=USDT&limit=20` |
| POST | `/chain/read-contract` | none | Call a constant contract function. Body: `{ contract_address, function_selector, parameters? }` |
| POST | `/chain/broadcast` | none | Broadcast a signed transaction. Body: `{ signed_transaction }` |

---

## Standing Orders and Monitors

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/standing-orders` | API key | Create a standing order. Body: `{ trigger_type, trigger_value, action, budget_trx?, max_executions? }` |
| GET | `/standing-orders` | API key | List standing orders. Query: `?status=active` |
| PATCH | `/standing-orders/:id` | API key | Update (pause/resume) a standing order. Body: `{ status: "paused" }` |
| DELETE | `/standing-orders/:id` | API key | Delete a standing order. |
| POST | `/monitors` | API key | Create a monitor. Body: `{ type, config, notify }` |
| GET | `/monitors` | API key | List monitors. |
| DELETE | `/monitors/:id` | API key | Delete a monitor. |

---

## Authentication and Onboarding

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | none | Create a new account. Body: `{ email? }`. Returns API key and deposit address. |
| POST | `/auth/login` | none | Authenticate. Body: `{ api_key }`. Returns session token. |

---

## x402 Payment Protocol

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/x402/invoice` | none | Create a payment invoice for energy purchase without an account. Body: `{ resource_type, amount, duration_hours, target_address }` |
| GET | `/x402/invoice/:id` | none | Get invoice status and payment details. |
| POST | `/x402/verify` | none | Verify payment and trigger delegation. Body: `{ invoice_id, tx_hash }` |
| POST | `/x402/pay` | none | One-step: create invoice, attach payment TX. Body: `{ resource_type, amount, duration_hours, target_address, signed_transaction }` |

---

## Notes for Integrators

- All POST endpoints that create resources support the `Idempotency-Key` header
  to prevent duplicate operations.
- Rate limits: 100 requests/minute for authenticated endpoints, 30/minute for
  unauthenticated. Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
  `X-RateLimit-Reset`.
- Webhook events: `order.created`, `order.delegated`, `order.completed`,
  `order.failed`, `deposit.confirmed`, `withdrawal.completed`,
  `standing_order.triggered`, `monitor.triggered`.
- All monetary amounts in API responses use SUN internally (1 TRX = 1,000,000 SUN).
  Human-readable TRX values are provided in a separate `_trx` suffixed field.
- The MCP server wraps these endpoints with additional logic (resource estimation,
  intent decomposition, simulation). For most use cases, using MCP tools is
  simpler than calling the API directly.
