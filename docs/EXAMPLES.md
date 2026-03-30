# Merx MCP Server -- Conversation Examples

10 real-world conversation examples demonstrating Merx MCP tools with production
data. All prices, TX hashes, and savings figures reflect actual market conditions.

---

## Example 1: Check Energy Prices

**User:** What are the current energy prices?

**Agent calls:** `get_prices({ duration_hours: 1 })`

**Agent responds:**

Current energy prices (1-hour rental):

| Provider   | Price (SUN) | Min Order | Capacity      |
|------------|-------------|-----------|---------------|
| Netts      | 22          | 32,000    | 500,000,000   |
| Feee       | 24          | 50,000    | 200,000,000   |
| CatFee     | 27          | 20,000    | 350,000,000   |
| TronSave   | 28          | 100,000   | 1,000,000,000 |
| iTRX       | 30          | 10,000    | 150,000,000   |
| Sohu       | 32          | 50,000    | 400,000,000   |

Netts is currently the cheapest at 22 SUN per energy unit. All providers have
sufficient capacity for typical USDT transfers (65,000 energy).

---

## Example 2: Buy Energy at Best Price

**User:** I need energy for a USDT transfer to TRf7v2Kq9dMEoGY8pNU3vBXsLYjxtmFj6a

**Agent calls:**
1. `estimate_transaction_cost({ transaction_type: "transfer_trc20" })`
2. `get_best_price({ energy_amount: 65000 })`
3. `create_order({ resource_type: "energy", amount: 65000, duration_hours: 1, target_address: "TRf7v2Kq9dMEoGY8pNU3vBXsLYjxtmFj6a" })`

**Agent responds:**

Order placed and delegation confirmed.

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Order ID            | ord_8f2a1c                          |
| Provider            | Netts                               |
| Energy delegated    | 65,000                              |
| Duration            | 1 hour                              |
| Cost                | 1.43 TRX                            |
| Without Merx        | 14.1 TRX (burned)                   |
| Savings             | 12.67 TRX (89%)                     |
| Delegation TX       | 3a9c4f2e...8b1d                     |
| Target              | TRf7v2Kq9dMEoGY8pNU3vBXsLYjxtmFj6a |

Your address now has 65,000 energy available. You can proceed with the USDT transfer.

---

## Example 3: Send USDT with Auto-Resources

**User:** Send 500 USDT to TXa3p8Kw2nRY7vLm5cQ9fJ4bHs6dGe1tNi

**Agent calls:**
1. `check_address_resources({ address: "TYe4S8dK..." })` -- checks sender resources
2. `ensure_resources({ address: "TYe4S8dK...", energy_needed: 65000 })` -- buys deficit
3. `transfer_trc20({ to: "TXa3p8Kw2nRY7vLm5cQ9fJ4bHs6dGe1tNi", token: "USDT", amount: 500 })`

**Agent responds:**

USDT transfer complete.

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Amount              | 500 USDT                            |
| Recipient           | TXa3p8Kw2nRY7vLm5cQ9fJ4bHs6dGe1tNi |
| TX hash             | 7e2b4a9f...c3d8                     |
| Energy used         | 64,285 / 65,000                     |
| Energy cost (Merx)  | 1.43 TRX                            |
| Energy cost (burn)  | 14.1 TRX                            |
| Savings             | 89%                                 |
| Block               | 71,284,193                          |
| Confirmed           | yes                                 |

No TRX was burned. The full transfer cost was 1.43 TRX for energy rental.

---

## Example 4: Send TRX (Bandwidth Handling)

**User:** Send 100 TRX to TJm8Nq5vRxW3yKp2dL9fC7bAs4eHg6tUo1

**Agent calls:**
1. `check_address_resources({ address: "TYe4S8dK..." })` -- checks bandwidth
2. `transfer_trx({ to: "TJm8Nq5vRxW3yKp2dL9fC7bAs4eHg6tUo1", amount_trx: 100 })`

**Agent responds:**

TRX transfer complete.

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Amount              | 100 TRX                             |
| Recipient           | TJm8Nq5vRxW3yKp2dL9fC7bAs4eHg6tUo1 |
| TX hash             | d4f1a8e2...9c7b                     |
| Bandwidth used      | 267 / 1,500                         |
| TRX burned          | 0                                   |
| Block               | 71,284,201                          |
| Confirmed           | yes                                 |

TRX transfers require only bandwidth (267 bytes). Your account had sufficient
free bandwidth, so no additional cost was incurred.

---

## Example 5: Swap TRX to USDT on SunSwap

**User:** Swap 1000 TRX to USDT

**Agent calls:**
1. `get_swap_quote({ from_token: "TRX", to_token: "USDT", amount: 1000 })`
2. `ensure_resources({ address: "TYe4S8dK...", energy_needed: 180000 })` -- swaps need more energy
3. `execute_swap({ from_token: "TRX", to_token: "USDT", amount: 1000, slippage: 0.5 })`

**Agent responds:**

Swap executed on SunSwap v2.

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Sold                | 1,000 TRX                           |
| Received            | 217.43 USDT                         |
| Rate                | 1 TRX = 0.2174 USDT                 |
| Price impact        | 0.02%                               |
| Slippage tolerance  | 0.5%                                |
| Route               | TRX -> WTRX -> USDT                 |
| TX hash             | 9b3e7d1a...f4c2                     |
| Energy used         | 174,820 / 180,000                   |
| Energy cost (Merx)  | 3.96 TRX                            |
| Energy cost (burn)  | 38.3 TRX                            |
| Savings             | 89%                                 |

DEX swaps consume significantly more energy than simple transfers. Merx saved
you 34.34 TRX on this transaction alone.

---

## Example 6: Simulate Multi-Step Plan

**User:** I want to swap 500 TRX to USDT, then send that USDT to two addresses. Show me the plan first.

**Agent calls:**
```
simulate({
  steps: [
    { action: "swap", from_token: "TRX", to_token: "USDT", amount: 500 },
    { action: "transfer_trc20", to: "TAddr1...", token: "USDT", amount: 50 },
    { action: "transfer_trc20", to: "TAddr2...", token: "USDT", amount: 50 }
  ],
  strategy: "batch_cheapest"
})
```

**Agent responds:**

Simulation results (not executed):

| Step | Action         | Energy Needed | Detail                    |
|------|---------------|---------------|---------------------------|
| 1    | Swap TRX->USDT | 180,000       | 500 TRX -> ~108.7 USDT   |
| 2    | Send USDT      | 65,000        | 50 USDT to TAddr1...     |
| 3    | Send USDT      | 65,000        | 50 USDT to TAddr2...     |

| Cost Summary            | Value       |
|-------------------------|-------------|
| Total energy needed     | 310,000     |
| Batch energy cost (Merx)| 6.82 TRX    |
| Without Merx (burned)   | 67.9 TRX    |
| Savings                 | 61.08 TRX (89%) |
| Strategy                | batch_cheapest -- all energy from Netts at 22 SUN |

The batch_cheapest strategy buys all 310,000 energy upfront from the cheapest
provider. This is more cost-effective than buying per-step.

Shall I execute this plan?

---

## Example 7: Set Up Standing Order

**User:** Buy 200,000 energy automatically whenever the price drops below 20 SUN.

**Agent calls:**
```
create_standing_order({
  trigger_type: "price_below",
  trigger_value: { price_sun: 20 },
  action: {
    type: "buy_energy",
    amount: 200000,
    duration_hours: 1,
    target: "TYe4S8dK..."
  },
  budget_trx: 100,
  max_executions: 25
})
```

**Agent responds:**

Standing order created.

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Order ID            | so_4f8a2c                           |
| Trigger             | Energy price drops below 20 SUN     |
| Action              | Buy 200,000 energy (1h) for TYe4S8dK... |
| Budget              | 100 TRX                             |
| Max executions      | 25                                  |
| Status              | active                              |
| Est. cost per fill  | 4.0 TRX (at 20 SUN)                |

The server monitors prices 24/7. When any provider hits 20 SUN or below, the
order executes automatically. Current lowest price is Netts at 22 SUN, so the
trigger has not fired yet.

---

## Example 8: Create Delegation Monitor

**User:** Alert me on Telegram when my energy delegation is about to expire.

**Agent calls:**
```
create_monitor({
  type: "delegation_expiry",
  config: {
    address: "TYe4S8dK...",
    warn_minutes: 15
  },
  notify: {
    channel: "telegram",
    target: "@username"
  }
})
```

**Agent responds:**

Delegation monitor created.

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Monitor ID          | mon_7c3b9e                          |
| Type                | delegation_expiry                   |
| Address             | TYe4S8dK...                         |
| Warning threshold   | 15 minutes before expiry            |
| Notification        | Telegram to @username               |
| Status              | active                              |

You will receive a Telegram message 15 minutes before any energy delegation
to your address expires. This gives you time to renew or place a new order.

To also auto-renew, consider adding a `delegation_expiry` standing order
with `create_standing_order`.

---

## Example 9: x402 Zero-Registration Purchase

**User:** I just need energy for one transfer. I do not want to create an account.

**Agent calls:**
1. `estimate_transaction_cost({ transaction_type: "transfer_trc20" })`
2. `create_paid_order({ resource_type: "energy", amount: 65000, duration_hours: 1, target_address: "TRf7v2Kq9dMEoGY8pNU3vBXsLYjxtmFj6a" })`

**Agent responds:**

x402 purchase -- no account required.

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Energy              | 65,000                              |
| Duration            | 1 hour                              |
| Cost                | 1.43 TRX                            |
| Payment             | Direct from your wallet              |
| Target              | TRf7v2Kq9dMEoGY8pNU3vBXsLYjxtmFj6a |
| Invoice ID          | inv_d9e4f2                          |
| Status              | paid and delegated                  |
| Delegation TX       | 5c8a3b7e...d1f9                     |

Payment was made directly from your wallet via the x402 protocol. No Merx
account, no API key, no registration. Your address now has 65,000 energy
available for the next hour.

---

## Example 10: Full Autonomous Flow

**User:** I need to deposit TRX, buy energy, and swap TRX to USDT. Handle everything.

**Agent calls:**
1. `get_balance()` -- check current Merx balance
2. `deposit_trx({ amount_trx: 50 })` -- fund account
3. `get_swap_quote({ from_token: "TRX", to_token: "USDT", amount: 200 })`
4. `execute_intent` with full plan:

```
execute_intent({
  steps: [
    { action: "ensure_resources", address: "TYe4S8dK...", energy: 180000 },
    { action: "swap", from_token: "TRX", to_token: "USDT", amount: 200 }
  ],
  strategy: "batch_cheapest"
})
```

**Agent responds:**

Full flow completed autonomously.

**Step 1: Deposit**

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Deposited           | 50 TRX                              |
| TX hash             | 1a4b7c9d...e3f8                     |
| New Merx balance    | 192.5 TRX                           |

**Step 2: Energy provisioned**

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Provider            | Netts                               |
| Energy delegated    | 180,000                             |
| Cost                | 3.96 TRX                            |
| Delegation TX       | 8d2e5f1a...b7c4                     |

**Step 3: Swap executed**

| Detail              | Value                              |
|---------------------|-------------------------------------|
| Sold                | 200 TRX                             |
| Received            | 43.48 USDT                          |
| Rate                | 1 TRX = 0.2174 USDT                 |
| TX hash             | f3a8c1d4...e9b2                     |
| Energy used         | 174,820 / 180,000                   |

**Cost Summary**

| Line item           | Cost        |
|---------------------|-------------|
| Energy (Merx)       | 3.96 TRX    |
| Without Merx        | 38.3 TRX    |
| Saved               | 34.34 TRX (89%) |
| USDT received       | 43.48       |

Three transactions completed in a single intent execution. Total cost for
resource provisioning was 3.96 TRX instead of 38.3 TRX burned -- a 89% saving
powered by Merx energy aggregation.
