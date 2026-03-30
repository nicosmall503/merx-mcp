# Merx MCP Server -- Standing Orders and Monitors Guide

Standing orders and monitors run server-side 24/7, executing actions or sending
notifications when conditions are met. They operate independently of any client
connection.

---

## Standing Orders

A standing order is a persistent rule stored in PostgreSQL that the Merx server
evaluates continuously. When the trigger condition is met, the specified action
executes automatically.

### Trigger Types

| Trigger | Description | trigger_value |
|---------|-------------|---------------|
| `price_below` | Fires when any provider's energy price drops below a threshold. | `{ price_sun: 20 }` |
| `schedule` | Fires on a cron schedule. | `{ cron: "0 */6 * * *" }` -- every 6 hours |
| `balance_below` | Fires when Merx account balance drops below a threshold. | `{ balance_trx: 10 }` |
| `delegation_expiry` | Fires N minutes before a delegation to the target address expires. | `{ address: "TYaddr...", warn_minutes: 15 }` |

### Action Types

| Action | Description | Parameters |
|--------|-------------|------------|
| `buy_energy` | Purchase energy from cheapest available provider. | `amount`, `duration_hours`, `target` |
| `buy_bandwidth` | Purchase bandwidth from cheapest available provider. | `amount`, `duration_hours`, `target` |
| `deposit_trx` | Auto-deposit TRX from linked wallet. | `amount_trx` |
| `notify` | Send a notification only (no purchase). | `channel`, `target`, `message` |

### Budget and Execution Limits

Every standing order has two safeguards:

- **budget_trx** -- Maximum total TRX the order can spend across all executions.
  When the budget is exhausted, the order status changes to `exhausted`.
- **max_executions** -- Maximum number of times the order can fire. Optional.
  When reached, status changes to `exhausted`.

Example: A `price_below` order with `budget_trx: 100` and per-execution cost of
4 TRX will fire at most 25 times before exhausting its budget.

### Lifecycle

```
created -> active -> [executing] -> active -> ... -> exhausted
                                          \-> paused (manual)
```

Standing orders can be paused and resumed via `list_standing_orders` and the
admin panel. Paused orders do not evaluate triggers.

### Example: Auto-Renew Energy

```
create_standing_order({
  trigger_type: "delegation_expiry",
  trigger_value: {
    address: "TYe4S8dK...",
    warn_minutes: 10
  },
  action: {
    type: "buy_energy",
    amount: 65000,
    duration_hours: 1,
    target: "TYe4S8dK..."
  },
  budget_trx: 50,
  max_executions: 30
})
```

This order renews 65,000 energy 10 minutes before the current delegation expires.
At Netts pricing (22 SUN), each renewal costs ~1.43 TRX. The 50 TRX budget
supports approximately 35 renewals.

### Example: Buy on Price Dip

```
create_standing_order({
  trigger_type: "price_below",
  trigger_value: { price_sun: 18 },
  action: {
    type: "buy_energy",
    amount: 500000,
    duration_hours: 24,
    target: "TYe4S8dK..."
  },
  budget_trx: 200
})
```

When any provider hits 18 SUN, the server buys 500,000 energy for 24 hours.
This is a bulk purchase strategy for users with high transaction volume.

---

## Monitors

Monitors are passive observers. They watch conditions and send notifications but
do not execute any purchases or transactions.

### Monitor Types

| Type | Description | Config |
|------|-------------|--------|
| `delegation_expiry` | Alert before an energy delegation expires. | `{ address: "TYaddr...", warn_minutes: 15 }` |
| `balance_threshold` | Alert when Merx balance drops below a threshold. | `{ below_trx: 10 }` |
| `price_alert` | Alert when energy price crosses a threshold. | `{ provider: "netts", below_sun: 20 }` or `{ any_provider: true, below_sun: 20 }` |
| `auto_renew` | Combined monitor: alerts on expiry and tracks renewal history. | `{ address: "TYaddr...", warn_minutes: 30 }` |

### Notification Channels

| Channel | Target format | Notes |
|---------|---------------|-------|
| `webhook` | `https://example.com/hook` | POST request with JSON payload. Payload includes monitor ID, type, timestamp, and condition details. Retries 3 times with exponential backoff. |
| `telegram` | `@username` or chat ID | Message sent via Merx Telegram bot. User must have started a conversation with the bot first. |

### Example: Price Alert

```
create_monitor({
  type: "price_alert",
  config: {
    any_provider: true,
    below_sun: 20
  },
  notify: {
    channel: "webhook",
    target: "https://api.myapp.com/merx-alerts"
  }
})
```

Webhook payload when triggered:

```json
{
  "monitor_id": "mon_7c3b9e",
  "type": "price_alert",
  "triggered_at": "2026-03-30T14:22:08Z",
  "condition": {
    "provider": "feee",
    "price_sun": 19,
    "threshold_sun": 20
  }
}
```

### Example: Balance Alert via Telegram

```
create_monitor({
  type: "balance_threshold",
  config: { below_trx: 5 },
  notify: {
    channel: "telegram",
    target: "@myusername"
  }
})
```

You will receive a Telegram message when your Merx balance drops below 5 TRX:

> Merx balance alert: your balance is 4.2 TRX, below your threshold of 5 TRX.
> Deposit at: https://merx.exchange/deposit

---

## Standing Orders vs Monitors

| Feature | Standing Order | Monitor |
|---------|---------------|---------|
| Executes actions | yes | no |
| Sends notifications | optional (via notify action) | yes |
| Has budget | yes | no |
| Has max_executions | yes | no |
| Requires API key | yes | yes |
| Runs server-side 24/7 | yes | yes |
| Can be paused | yes | yes |

Use standing orders when you want automated purchasing. Use monitors when you
want alerts only and prefer to make decisions manually.

---

## Combining Orders and Monitors

A common pattern is to pair a monitor with a standing order:

1. **Monitor** with `delegation_expiry` at 30 minutes -- sends a Telegram alert
2. **Standing order** with `delegation_expiry` at 5 minutes -- auto-renews if you
   did not act on the alert

This gives you a 25-minute window to decide manually, with an automatic fallback
to ensure you never lose energy coverage.
