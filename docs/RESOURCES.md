# Merx MCP Server -- Resource Reference

All 21 resources exposed by the Merx MCP server. Resources provide structured
data that AI agents can read to inform their decisions without making tool calls.

---

## Static Resources (14)

Static resources have fixed URIs and return data that updates at a defined frequency.

| # | URI | Description | MIME | Auth | Update Frequency |
|---|-----|-------------|------|------|-----------------|
| 1 | `merx://prices/current` | Current energy prices from all active providers. Sorted by price ascending. | application/json | none | 10s |
| 2 | `merx://prices/stats` | Price statistics: mean, median, min, max, std dev over 24h window. | application/json | none | 60s |
| 3 | `merx://providers/list` | All providers with slug, name, status, and capabilities. | application/json | none | 30s |
| 4 | `merx://providers/status` | Real-time provider health: uptime percentage, avg delegation speed, error rate. | application/json | none | 30s |
| 5 | `merx://network/parameters` | TRON chain parameters: energy price, bandwidth price, block height, TRX price. | application/json | none | 60s |
| 6 | `merx://network/trx-price` | Current TRX/USD price with 24h change. | application/json | none | 30s |
| 7 | `merx://docs/concepts/energy` | Plain-text explanation of TRON energy. | text/plain | none | static |
| 8 | `merx://docs/concepts/bandwidth` | Plain-text explanation of TRON bandwidth. | text/plain | none | static |
| 9 | `merx://docs/concepts/staking` | Plain-text explanation of TRON Stake 2.0 and delegation. | text/plain | none | static |
| 10 | `merx://docs/concepts/sun` | Explanation of SUN as the smallest TRX unit (1 TRX = 1,000,000 SUN). | text/plain | none | static |
| 11 | `merx://docs/quickstart` | Getting started guide: account creation, deposit, first order. | text/plain | none | static |
| 12 | `merx://docs/api-reference` | Condensed API reference for all Merx endpoints. | text/plain | none | static |
| 13 | `merx://account/balance` | Current Merx account balance (TRX and USDT). | application/json | API key | real-time |
| 14 | `merx://account/orders/active` | List of currently active (unfilled or delegating) orders. | application/json | API key | real-time |

---

## Resource Templates (7)

Resource templates use URI parameters to return data for specific entities.
The `{parameter}` segments are replaced with actual values at read time.

### 1. merx://prices/provider/{provider_slug}

| Field | Value |
|-------|-------|
| Description | Current price and capacity for a specific provider. |
| MIME | application/json |
| Auth | none |
| Example | `merx://prices/provider/netts` returns `{ provider: "netts", price_sun: 22, capacity: 500000000, ... }` |

### 2. merx://prices/history/{provider_slug}

| Field | Value |
|-------|-------|
| Description | 24h price history for a specific provider. Returns timestamped data points. |
| MIME | application/json |
| Auth | none |
| Example | `merx://prices/history/catfee` returns hourly price points for the last 24 hours. |

### 3. merx://account/order/{order_id}

| Field | Value |
|-------|-------|
| Description | Full details of a specific order including delegation TX hash and expiry time. |
| MIME | application/json |
| Auth | API key |
| Example | `merx://account/order/ord_abc123` returns order status, provider, amount, cost, and delegation details. |

### 4. merx://chain/account/{address}

| Field | Value |
|-------|-------|
| Description | On-chain TRON account data: TRX balance, staked resources, permissions, and active delegations received. |
| MIME | application/json |
| Auth | none |
| Example | `merx://chain/account/TYe4S8d...` returns full account state from the TRON network. |

### 5. merx://chain/transaction/{tx_hash}

| Field | Value |
|-------|-------|
| Description | Transaction details by hash: status, block, timestamp, energy and bandwidth consumed, contract calls. |
| MIME | application/json |
| Auth | none |
| Example | `merx://chain/transaction/a1b2c3d4...` returns confirmed transaction with resource consumption breakdown. |

### 6. merx://chain/resources/{address}

| Field | Value |
|-------|-------|
| Description | Current energy and bandwidth for an address, split into owned vs delegated. |
| MIME | application/json |
| Auth | none |
| Example | `merx://chain/resources/TYe4S8d...` returns `{ energy: { available: 65000, limit: 65000, delegated: 65000 }, bandwidth: { available: 1200, limit: 1500 } }` |

### 7. merx://docs/concepts/{concept}

| Field | Value |
|-------|-------|
| Description | Educational content for a specific concept. Supports: `energy`, `bandwidth`, `staking`, `delegation`, `sun`, `merx`, `providers`, `x402`. |
| MIME | text/plain |
| Auth | none |
| Example | `merx://docs/concepts/delegation` returns a plain-text explanation of how TRON energy delegation works. |
