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
- **API docs:** [merx.exchange/docs/api](https://merx.exchange/docs/api)
- **MCP endpoint (SSE):** `https://merx.exchange/mcp/sse`
- **npm:** `npm install -g merx-mcp`
- **Source:** [github.com/Hovsteder/merx-mcp](https://github.com/Hovsteder/merx-mcp)
- **Agent Protocols:** [merx.exchange/agents](https://merx.exchange/agents)

---

## Stats

- 54 MCP tools | 30 prompts | 21 resources
- 7 A2A skills (Google Agent-to-Agent Protocol)
- 7 ACP capabilities (BeeAI Agent Communication Protocol)
- 7 energy providers aggregated
- 2 MCP transport modes (stdio + SSE)
- 3 payment methods
- 8 on-chain transaction types verified on TRON mainnet
- Listed on: Glama, Smithery, MCP Registry, awesome-a2a, a2aregistry.in
