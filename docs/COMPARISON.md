# Comparison with alternatives

This document compares merx with other MCP servers and tools that provide TRON
blockchain access to AI agents.

---

## Feature matrix

| Feature | merx | Sun Protocol | Netts MCP | TronLink MCP | PowerSun MCP |
|---|---|---|---|---|---|
| MCP tools | 52 | 0 | 8 | 12 | 6 |
| MCP prompts | 30 | 0 | 0 | 0 | 0 |
| MCP resources | 21 | 0 | 0 | 0 | 0 |
| Transport modes | stdio + SSE | N/A | stdio | stdio | stdio |
| Energy providers | 7 | 1 (self) | 1 (Netts) | 0 | 1 (PowerSun) |
| Multi-provider routing | Yes | No | No | No | No |
| Price comparison | Real-time, all 7 | N/A | Netts only | N/A | PowerSun only |
| Resource estimation | Yes | No | No | No | No |
| Resource-aware TX | Yes | No | No | No | No |
| Exact energy simulation | Yes | No | No | No | No |
| TRX transfers | Yes | No | No | Yes | No |
| TRC20 transfers | Yes | No | No | Yes | No |
| DEX swaps | Yes | No | No | No | No |
| Contract calls | Yes | No | No | Partial | No |
| Standing orders | Yes | No | No | No | No |
| Delegation monitors | Yes | No | No | No | No |
| Intent execution | Yes | No | No | No | No |
| x402 pay-per-use | Yes | No | No | No | No |
| On-chain queries | Yes | No | No | Yes | No |
| Zero-config start | Yes (22 tools) | N/A | No (key required) | No (key required) | No (key required) |
| Hosted SSE endpoint | Yes | No | No | No | No |

---

## Sun Protocol

Sun Protocol is the TRON network's native staking and governance platform. It
provides energy and bandwidth through TRX staking (Stake 2.0) rather than through
a rental marketplace. It is not an MCP server and does not provide AI agent
integration. Agents interacting with Sun Protocol must build their own transaction
construction, resource estimation, and staking logic.

---

## Netts MCP

Netts MCP is a lightweight MCP server from the Netts energy provider. It exposes
approximately 8 tools focused on energy ordering through the Netts API. It supports
a single provider (Netts) and does not aggregate prices from other sources. It does
not include resource estimation, on-chain queries, token transfers, or DEX
functionality. Requires an API key for all operations.

---

## TronLink MCP

TronLink MCP is an MCP server built around the TronLink wallet. It provides
approximately 12 tools for basic TRON operations: TRX transfers, TRC20 transfers,
account queries, and limited contract interaction. It does not include energy
trading, resource optimization, multi-provider price comparison, or DEX integration.
All operations require a connected TronLink wallet. It does not estimate or
automatically acquire resources before transactions.

---

## PowerSun MCP

PowerSun MCP is an MCP server from the PowerSun energy provider. It exposes
approximately 6 tools for energy ordering through the PowerSun API. Like Netts MCP,
it is limited to a single provider and does not aggregate market data. It does not
support transaction execution, resource estimation, or on-chain queries. Requires
an API key for all operations.

---

## Positioning

merx occupies a unique position in the TRON tooling space:

**Resource optimization.** merx is the only tool that aggregates all 7 major energy
providers, compares prices in real time, and routes orders to the cheapest source
with automatic failover. No other MCP server or tool provides cross-provider price
discovery.

**Market intelligence.** 30 prompts and 21 resources provide structured market data:
price history, trend analysis, percentile rankings, and buy/sell recommendations.
Other tools expose raw prices at best.

**Full TRON operations.** merx covers the complete transaction lifecycle: estimate
resources, acquire them at optimal price, wait for delegation, sign locally,
broadcast, and verify. Other tools handle individual steps but leave the agent to
orchestrate the flow.

**Progressive access.** merx starts with 22 tools at zero configuration and scales
to 52 tools as credentials are added. Other MCP servers require API keys before
any functionality is available.

**Hosted SSE.** merx is the only TRON MCP server offering a hosted SSE endpoint,
enabling integration with Claude.ai and other web-based agents without local
installation.
