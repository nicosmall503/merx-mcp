# merx documentation

merx is a Model Context Protocol (MCP) server that gives AI agents full access to
the TRON blockchain -- resource optimization, energy trading, token transfers, DEX
swaps, and smart contract execution. It aggregates 7 energy providers, routes orders
to the cheapest source, and handles resource estimation automatically so agents never
burn TRX unnecessarily.

---

## Table of contents

| Document | Description |
|---|---|
| [Architecture](ARCHITECTURE.md) | Request flow, resource-aware transactions, x402 payments, standing orders, intent engine, and session management with sequence diagrams |
| [Configuration](CONFIGURATION.md) | Environment variables, client configs for Claude.ai / Cursor / Claude Code, graceful degradation tiers, session-based auth, and troubleshooting |
| [Comparison](COMPARISON.md) | Feature matrix comparing merx against Sun Protocol, Netts MCP, TronLink MCP, and PowerSun MCP |
| [Payment Methods](PAYMENT-METHODS.md) | Three payment methods: pre-funded balance, self-deposit from wallet, and x402 pay-per-use with flow diagrams |
| [Contributing](CONTRIBUTING.md) | Pull request guidelines, code style rules, testing requirements, and issue templates |
| [Changelog](CHANGELOG.md) | Release history and version notes |
| [License](../LICENSE) | MIT License |

---

## Quick links

- **Website:** [merx.exchange](https://merx.exchange)
- **API docs:** [merx.exchange/docs/api-reference](https://merx.exchange/docs/api-reference)
- **MCP endpoint (SSE):** `https://merx.exchange/mcp/sse`
- **npm:** `npm install -g merx`
- **Source:** [github.com/merx-exchange/merx](https://github.com/merx-exchange/merx)

---

## Stats

- 52 tools | 30 prompts | 21 resources
- 7 energy providers aggregated
- 2 transport modes (stdio + SSE)
- 3 payment methods
- 8 on-chain transaction types verified on TRON mainnet
