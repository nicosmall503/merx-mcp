# Agent Convenience

The Agent Convenience tools provide contextual knowledge and decision support for AI
agents operating on TRON. They translate domain-specific concepts into plain language,
recommend optimal parameters, and quantify the financial benefit of renting resources
through Merx. None of these tools require authentication.

These tools are designed for agents that need to reason about TRON without deep protocol
knowledge. An agent handling a user request like "send 100 USDT cheaply" can call
`explain_concept` to understand energy, `suggest_duration` to pick the right rental
window, and `calculate_savings` to justify the approach. The `list_providers` tool
gives a complete view of the Merx provider ecosystem.

---

## explain_concept

Return a clear, concise explanation of a TRON or Merx concept. Intended for agents
that need to understand or relay protocol details to end users.

**Auth:** none

**Input schema:**
```json
{
  "topic": {
    "type": "string",
    "required": true,
    "description": "Topic: energy, bandwidth, staking, delegation, sun_units, burn_vs_rent, merx_routing, provider_types"
  }
}
```

**Example input:** `{ "topic": "burn_vs_rent" }`

**Example output:**
```
Burn vs Rent

When a TRON account lacks energy, the network burns TRX from the sender's balance to
cover the energy cost. The burn rate is set by the network parameter getEnergyFee,
currently 200 SUN per energy unit.

A TRC-20 USDT transfer requires approximately 65,000 energy. Burning would cost:
  65,000 x 200 SUN = 13,000,000 SUN = 13.000 TRX

Renting the same energy through Merx at the current best price of 22 SUN/unit:
  65,000 x 22 SUN = 1,430,000 SUN = 1.430 TRX

Renting saves 11.570 TRX (89%) per transfer. The rented energy is delegated to your
address for a fixed duration and can be used for multiple transactions within that
window.
```

**Related tools:** calculate_savings, estimate_transaction_cost

---

## suggest_duration

Recommend an optimal rental duration based on the intended use case. Takes into account
transaction patterns and cost efficiency of different duration tiers.

**Auth:** none

**Input schema:**
```json
{
  "use_case": {
    "type": "string",
    "enum": ["single_transfer", "batch_transfers", "dapp_session", "daily_operations", "weekly_operations", "monthly_budget"],
    "required": true,
    "description": "Your intended use case."
  },
  "transaction_count": {
    "type": "number",
    "description": "Expected number of transactions (optional)."
  }
}
```

**Example input:** `{ "use_case": "batch_transfers", "transaction_count": 10 }`

**Example output:**
```
Duration Recommendation: batch_transfers (10 transactions)

Recommended duration:  1 hour (3600 seconds)
Energy needed:         650,000 (65,000 per transfer x 10)
Estimated cost:        14.300 TRX (Netts at 22 SUN)
Cost per transfer:     1.430 TRX
vs burn per transfer:  13.000 TRX

A 1-hour window gives enough time to execute 10 transfers sequentially.
If transfers are spread over a longer period, consider daily_operations
for a 24h duration at slightly higher per-unit cost.
```

**Related tools:** calculate_savings, create_order, estimate_transaction_cost

---

## calculate_savings

Quantify the TRX savings from renting energy via Merx versus burning TRX on-chain.
Supports single or batch transaction calculations.

**Auth:** none

**Input schema:**
```json
{
  "operation": {
    "type": "string",
    "enum": ["trc20_transfer", "trc20_approve", "trx_transfer"],
    "description": "Operation type. Default: trc20_transfer."
  },
  "transaction_count": {
    "type": "number",
    "description": "Number of transactions. Default: 1."
  }
}
```

**Example input:** `{ "operation": "trc20_transfer", "transaction_count": 100 }`

**Example output:**
```
Savings Calculation: 100x TRC-20 Transfer

Energy per transfer:   65,000
Total energy needed:   6,500,000

Burn cost (no rental):
  6,500,000 x 200 SUN = 1,300.000 TRX

Rent cost (Merx best price):
  6,500,000 x 22 SUN  = 143.000 TRX (via Netts)

Savings:               1,157.000 TRX (89%)
Savings per transfer:  11.570 TRX
```

**Related tools:** estimate_transaction_cost, suggest_duration, get_best_price

---

## list_providers

List all Merx providers with their type, supported resources, available durations,
minimum order sizes, and current operational status.

**Auth:** none

**Input schema:**
```json
{}
```
No parameters.

**Example input:** `{}`

**Example output:**
```
Merx Providers (7 active):

Provider    Type        Resources         Durations       Min Order   Status
Netts       API         ENERGY            1h              65,000      Active
CatFee      API         ENERGY            1h              65,000      Active
Feee        API         ENERGY            1h              100,000     Active
TronSave    API         ENERGY/BANDWIDTH  1h/24h/30d      65,000      Active
itrx        API         ENERGY            1h              65,000      Active
Sohu        API         ENERGY            1h/24h          65,000      Active
PowerSun    Smart       ENERGY            1h              65,000      Active

Provider types:
  API    -- Merx calls provider HTTP API to place delegation orders
  Smart  -- Merx interacts with on-chain smart contract for delegation
```

**Related tools:** compare_providers, get_prices, get_best_price
