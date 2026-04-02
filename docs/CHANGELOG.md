# Changelog

All notable changes to merx are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.4] - 2026-04-02

### Added

- A2A protocol support (Google Agent-to-Agent): 6 skills, SSE streaming, task
  state history. Agent Card at `/.well-known/agent.json`.
- ACP protocol support (BeeAI): 6 capabilities, run-based execution. Manifest
  at `/.well-known/agent-manifest.json`.
- withdraw tool (53rd tool).
- compile_policy tool (54th tool) -- natural language to standing orders via Anthropic API.
- Listed on awesome-a2a (Financial Services) and a2aregistry.in.
- Additional Protocol Support section in README.
- Keywords: a2a, acp, agent-to-agent, beeai added to package.json.

---

## [1.0.0] - 2026-03-30

Initial public release.

### Added

- 52 MCP tools covering the full TRON resource lifecycle: price discovery,
  resource estimation, energy/bandwidth trading, token transfers, DEX swaps,
  smart contract execution, standing orders, delegation monitors, and intent
  execution.
- 30 MCP prompts for guided workflows: market analysis, cost optimization,
  transaction planning, provider comparison, and educational explanations.
- 21 MCP resources (14 static + 7 templates) providing structured market data,
  provider information, and chain parameters.
- Dual transport: stdio for local installations, SSE for hosted access via
  `https://merx.exchange/mcp/sse`.
- Multi-provider routing across 7 energy providers: Netts, CatFee, TEM, ITRX,
  TronSave, Feee, PowerSun. Automatic failover to next cheapest on provider failure.
- Resource-aware transactions: automatic estimation, deficit calculation, purchase
  at best price, delegation polling, local signing, and broadcast.
- Exact energy simulation for DEX swaps and contract calls via
  `triggerConstantContract`.
- x402 pay-per-use: zero-registration energy purchases paid directly from wallet.
- Standing orders: server-side automation with price, schedule, and balance triggers.
- Delegation monitors with expiry alerts and auto-renewal.
- Intent engine: multi-step operation planning with stateful simulation and
  sequential execution.
- Graceful degradation: 22 tools at zero config, 40 with API key, 52 with
  private key.
- Session-based authentication via `set_api_key` and `set_private_key` tools.
- 8 on-chain transaction types verified on TRON mainnet: TRX transfer, TRC20
  transfer, TRC20 approval, energy order, bandwidth order, DEX swap, x402
  payment, and self-deposit.
