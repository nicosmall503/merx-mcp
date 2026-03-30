# Merx MCP Server -- Intent Execution Guide

Intent execution lets an AI agent describe a multi-step goal and have the Merx
server handle resource provisioning, transaction sequencing, and error recovery
as a single atomic operation.

---

## What It Is

An intent is an ordered list of on-chain actions that the server executes as a
coordinated plan. Instead of the agent making five separate tool calls and
handling failures between each step, it submits the full plan to `execute_intent`
and the server handles:

- Estimating total resource requirements across all steps
- Purchasing energy and bandwidth in a single batch (cheapest provider)
- Executing each step in sequence
- Rolling back or halting on failure
- Returning a unified result with per-step status

---

## Why It Matters

Without intents, a "send USDT" operation requires three separate calls:
1. Estimate energy needed
2. Buy energy from cheapest provider
3. Execute the transfer

If step 3 fails, the agent must handle the purchased-but-unused energy. With
intents, the server manages this complexity. For multi-step flows (swap + transfer,
batch transfers), the savings in coordination and error handling are significant.

---

## Supported Actions

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `transfer_trx` | Send TRX to an address | `to`, `amount_trx` |
| `transfer_trc20` | Send a TRC-20 token | `to`, `token`, `amount` |
| `approve_trc20` | Approve a spender for a token | `token`, `spender`, `amount` |
| `swap` | Execute a DEX swap on SunSwap | `from_token`, `to_token`, `amount`, `slippage` |
| `buy_energy` | Purchase energy from Merx | `amount`, `duration_hours`, `target` |
| `buy_bandwidth` | Purchase bandwidth from Merx | `amount`, `duration_hours`, `target` |
| `ensure_resources` | Buy only the resource deficit | `address`, `energy`, `bandwidth` |
| `call_contract` | Call a smart contract function | `contract_address`, `function_selector`, `parameters` |
| `deposit_trx` | Deposit TRX into Merx balance | `amount_trx` |

---

## Resource Strategies

The `strategy` parameter controls how the server provisions resources for the
intent steps.

### batch_cheapest (recommended)

Aggregates energy requirements across all steps and purchases from the single
cheapest provider in one order. Minimizes cost and number of on-chain transactions.

Example: 3 USDT transfers need 65,000 energy each = 195,000 total. One order
from Netts at 22 SUN = 4.29 TRX. Buying per-step would cost more due to minimum
order sizes.

### per_step

Purchases resources individually before each step. Useful when steps target
different addresses that each need their own delegation.

### no_resources

Assumes the target address already has sufficient resources. The server will
not purchase energy or bandwidth. If a step fails due to insufficient resources,
the intent fails at that step.

---

## Stateful Simulation

Before executing, you can dry-run any intent with `simulate` or by passing
`dry_run: true` to `execute_intent`. The simulation:

1. Estimates energy and bandwidth for each step (via contract dry-run)
2. Queries current resource levels for all target addresses
3. Calculates the deficit per address
4. Gets real-time pricing for the deficit
5. Returns a step-by-step cost breakdown without executing anything

Simulation state is not persisted. Each simulation is independent.

---

## Full Example with Real Numbers

**Goal:** Swap 500 TRX to USDT, then send 50 USDT to two different addresses.

### Step 1: Simulate

```
simulate({
  steps: [
    {
      action: "swap",
      from_token: "TRX",
      to_token: "USDT",
      amount: 500
    },
    {
      action: "transfer_trc20",
      to: "TRf7v2Kq9dMEoGY8pNU3vBXsLYjxtmFj6a",
      token: "USDT",
      amount: 50
    },
    {
      action: "transfer_trc20",
      to: "TXa3p8Kw2nRY7vLm5cQ9fJ4bHs6dGe1tNi",
      token: "USDT",
      amount: 50
    }
  ],
  strategy: "batch_cheapest"
})
```

### Simulation Result

| Step | Action         | Target          | Energy  | Est. Result        |
|------|---------------|-----------------|---------|--------------------|
| 1    | swap TRX->USDT | sender          | 180,000 | ~108.7 USDT        |
| 2    | transfer USDT  | TRf7v2Kq...     | 65,000  | 50 USDT sent       |
| 3    | transfer USDT  | TXa3p8Kw...     | 65,000  | 50 USDT sent       |

| Cost Line               | Value           |
|--------------------------|-----------------|
| Total energy             | 310,000         |
| Provider                 | Netts (22 SUN)  |
| Energy cost              | 6.82 TRX        |
| Without Merx (burned)    | 67.9 TRX        |
| Savings                  | 61.08 TRX (89%) |

### Step 2: Execute

```
execute_intent({
  steps: [ ... same as above ... ],
  strategy: "batch_cheapest"
})
```

### Execution Result

| Step | Status    | TX Hash          | Energy Used |
|------|-----------|------------------|-------------|
| R    | delegated | 3a9c4f2e...8b1d  | 310,000     |
| 1    | confirmed | 9b3e7d1a...f4c2  | 174,820     |
| 2    | confirmed | 7e2b4a9f...c3d8  | 64,285      |
| 3    | confirmed | d4f1a8e2...9c7b  | 64,310      |

Step "R" is the resource provisioning step, automatically inserted by the server.
All subsequent steps consumed from the pre-delegated pool.

Total wall time: ~9 seconds (delegation + 3 transactions).
Total cost: 6.82 TRX instead of 67.9 TRX burned (89% savings).

---

## Error Handling

If any step fails during execution:

1. The server halts at the failed step
2. All previously completed steps remain on-chain (blockchain transactions are irreversible)
3. Unused delegated energy remains available until expiry
4. The response includes `status: "partial"` with per-step results
5. The agent can inspect which steps succeeded and decide whether to retry the remaining steps

---

## Best Practices

- Always simulate first for complex flows (3+ steps or high-value transactions)
- Use `batch_cheapest` unless steps target different addresses
- Set `slippage` explicitly on swap steps to avoid unexpected results
- For recurring flows, combine with standing orders to automate resource provisioning
- Keep intents under 10 steps for predictable execution times
