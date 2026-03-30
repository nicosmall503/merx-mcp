# Intent Execution

The Intent Execution tools allow agents to express multi-step operations as a single
declarative plan. Instead of manually orchestrating resource checks, energy purchases,
approvals, and transfers as separate tool calls, an agent submits an array of steps
and the execution engine handles sequencing, resource optimization, and error recovery.

The key advantage is resource batching. When multiple steps each require energy, the
engine can aggregate the total energy requirement and purchase it in a single order at
the best available price -- rather than making separate purchases per step. The
`simulate` tool previews the entire plan without executing, returning detailed cost
estimates. The `execute_intent` tool runs the plan for real, with an optional `dry_run`
flag that behaves identically to `simulate`.

---

## execute_intent

Execute a multi-step operation plan. Each step specifies an action (transfer, swap, buy
resources, contract call) and its parameters. The engine validates all steps, estimates
total resource requirements, acquires resources according to the chosen strategy, then
executes steps in sequence. If any step fails, subsequent steps are not executed.

**Auth:** API key + TRON private key required

**Input schema:**
```json
{
  "steps": {
    "type": "array",
    "required": true,
    "description": "Array of { action, params } steps to execute.",
    "items": {
      "type": "object",
      "properties": {
        "action": { "type": "string", "description": "Action name: transfer_trc20, transfer_trx, swap, call_contract, buy_resource" },
        "params": { "type": "object", "description": "Action-specific parameters." }
      }
    }
  },
  "resource_strategy": {
    "type": "string",
    "enum": ["batch_cheapest", "per_step", "no_resources"],
    "description": "Resource acquisition strategy (default: batch_cheapest)."
  },
  "dry_run": {
    "type": "boolean",
    "description": "If true, simulate only without executing (default: false)."
  }
}
```

**Example input:**
```json
{
  "steps": [
    {
      "action": "transfer_trc20",
      "params": { "to_address": "TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4", "token": "USDT", "amount": "100" }
    },
    {
      "action": "transfer_trc20",
      "params": { "to_address": "TN21Rq4cBsP9kXv7m8jLw2z5nA6yF3d9kPL", "token": "USDT", "amount": "50" }
    }
  ],
  "resource_strategy": "batch_cheapest"
}
```

**Example output:**
```
Intent Execution: 2 steps

Resource Strategy: batch_cheapest
Total energy needed: 130,000 (65,000 x 2 transfers)
Batch purchase: 130,000 energy via Netts at 22 SUN = 2.860 TRX

Step 1/2: transfer_trc20
  To:     TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4
  Token:  USDT
  Amount: 100.000000
  TX ID:  e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8
  Status: CONFIRMED

Step 2/2: transfer_trc20
  To:     TN21Rq4cBsP9kXv7m8jLw2z5nA6yF3d9kPL
  Token:  USDT
  Amount: 50.000000
  TX ID:  f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7
  Status: CONFIRMED

Summary:
  Steps completed: 2/2
  Total Merx cost: 2.860 TRX
  vs burn cost:    26.000 TRX
  Savings:         23.140 TRX (89%)
```

**Related tools:** simulate, create_order, ensure_resources

---

## simulate

Simulate a multi-step operation without executing anything on-chain. Returns the same
detailed breakdown as `execute_intent` -- resource requirements per step, aggregated
costs, provider selection, and savings estimate -- but no transactions are signed or
broadcast. Use this to preview costs and validate a plan before committing.

**Auth:** API key required (no private key needed for simulation)

**Input schema:**
```json
{
  "steps": {
    "type": "array",
    "required": true,
    "description": "Array of { action, params } steps to simulate.",
    "items": {
      "type": "object",
      "properties": {
        "action": { "type": "string", "description": "Action name." },
        "params": { "type": "object", "description": "Action-specific parameters." }
      }
    }
  },
  "resource_strategy": {
    "type": "string",
    "enum": ["batch_cheapest", "per_step", "no_resources"],
    "description": "Resource acquisition strategy (default: batch_cheapest)."
  }
}
```

**Example input:**
```json
{
  "steps": [
    { "action": "swap", "params": { "from_token": "TRX", "to_token": "USDT", "amount": "500" } },
    { "action": "transfer_trc20", "params": { "to_address": "TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4", "token": "USDT", "amount": "100" } }
  ],
  "resource_strategy": "batch_cheapest"
}
```

**Example output:**
```
Simulation: 2 steps (dry run -- nothing executed)

Resource Strategy: batch_cheapest

Step 1: swap (TRX -> USDT)
  Energy required: 120,000
  Bandwidth:       580

Step 2: transfer_trc20 (USDT -> TVDGp...FRG4)
  Energy required: 65,000
  Bandwidth:       345

Resource Summary:
  Total energy:    185,000
  Best provider:   Netts at 22 SUN
  Batch cost:      4.070 TRX
  vs burn:         37.000 TRX
  Savings:         32.930 TRX (89%)

Validation: All steps valid. Ready to execute.
```

**Related tools:** execute_intent, estimate_transaction_cost, estimate_contract_call
