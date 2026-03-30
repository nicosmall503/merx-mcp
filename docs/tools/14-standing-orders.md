# Standing Orders

The Standing Orders tools provide server-side automation that runs 24/7 without requiring
an active agent session. Standing orders are trigger-based rules: when a condition is
met (price drops below a threshold, a scheduled time arrives, or a balance falls too
low), the server automatically executes a predefined action such as buying resources
or sending a notification.

Monitors complement standing orders by watching on-chain state: delegation expiry,
balance thresholds, and price alerts. When a monitor detects a condition, it sends
notifications via webhook or Telegram. Monitors can also be configured to auto-renew
expiring delegations, ensuring continuous resource coverage without manual intervention.

Both standing orders and monitors persist across sessions and run on Merx infrastructure.
Use `list_standing_orders` and `list_monitors` to review active automation at any time.

---

## create_standing_order

Create a server-side order that triggers automatically when conditions are met. Supports
price-based triggers (buy when energy drops below a target price), scheduled triggers
(buy every day at a fixed time), and balance-based triggers (top up when Merx balance
is low).

**Auth:** API key required

**Input schema:**
```json
{
  "trigger_type": {
    "type": "string",
    "enum": ["price_below", "price_above", "schedule", "balance_below"],
    "required": true,
    "description": "Condition that triggers the order."
  },
  "trigger_params": {
    "type": "object",
    "required": true,
    "description": "Trigger parameters: { resource, threshold_sun } or { cron }."
  },
  "action_type": {
    "type": "string",
    "enum": ["buy_resource", "ensure_resources", "notify_only"],
    "required": true,
    "description": "Action to perform when triggered."
  },
  "action_params": {
    "type": "object",
    "required": true,
    "description": "Action parameters: { resource_type, amount, duration_sec, target_address }."
  },
  "budget_trx": {
    "type": "string",
    "required": true,
    "description": "Maximum budget in TRX (converted to SUN internally)."
  },
  "max_executions": {
    "type": "number",
    "required": true,
    "description": "Maximum number of times this order can execute."
  },
  "expires_at": {
    "type": "string",
    "description": "ISO 8601 expiration date (optional)."
  }
}
```

**Example input:**
```json
{
  "trigger_type": "price_below",
  "trigger_params": { "resource": "ENERGY", "threshold_sun": 25 },
  "action_type": "buy_resource",
  "action_params": {
    "resource_type": "ENERGY",
    "amount": 200000,
    "duration_sec": 86400,
    "target_address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8"
  },
  "budget_trx": "50",
  "max_executions": 10,
  "expires_at": "2026-04-30T00:00:00Z"
}
```

**Example output:**
```
Standing Order Created:

ID:             so_a1b2c3d4e5f6
Status:         ACTIVE
Trigger:        price_below 25 SUN (ENERGY)
Action:         buy_resource (200,000 ENERGY, 24h)
Target:         TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Budget:         50.000 TRX (0.000 used)
Max executions: 10 (0 used)
Expires:        2026-04-30T00:00:00Z

Current energy price: 22 SUN (below threshold -- will trigger on next check)
```

**Related tools:** list_standing_orders, create_monitor, get_best_price

---

## list_standing_orders

List all standing orders with optional status filtering. Returns a summary of each
order including trigger conditions, execution count, budget usage, and current status.

**Auth:** API key required

**Input schema:**
```json
{
  "status": {
    "type": "string",
    "enum": ["ACTIVE", "TRIGGERED", "EXHAUSTED", "EXPIRED", "CANCELLED"],
    "description": "Filter by status."
  }
}
```

**Example input:** `{ "status": "ACTIVE" }`

**Example output:**
```
Standing Orders (ACTIVE):

ID            Trigger              Action         Executions  Budget Used  Expires
so_a1b2c3d4   price < 25 SUN       buy 200k E     2/10        8.800 TRX   2026-04-30
so_e5f6g7h8   schedule 0 9 * * *   ensure 65k E   5/30        7.150 TRX   2026-06-01
so_i9j0k1l2   balance < 20 TRX     notify         1/100       0.000 TRX   never

3 active standing orders. Total budget remaining: 83.050 TRX.
```

**Related tools:** create_standing_order, list_monitors

---

## create_monitor

Create a persistent monitor that watches on-chain state and sends notifications or
takes action when conditions are met. Supports delegation expiry monitoring (with
optional auto-renew), balance threshold alerts, and price alerts.

**Auth:** API key required

**Input schema:**
```json
{
  "monitor_type": {
    "type": "string",
    "enum": ["delegation_expiry", "balance_threshold", "price_alert"],
    "required": true,
    "description": "Type of monitor to create."
  },
  "params": {
    "type": "object",
    "required": true,
    "description": "Monitor params: { alert_before_sec, auto_renew, resource_type, max_price_sun, duration_sec }."
  },
  "target_address": {
    "type": "string",
    "description": "TRON address to monitor (for delegation_expiry)."
  },
  "notify": {
    "type": "object",
    "required": true,
    "description": "Notification config: { webhook, telegram_chat_id }."
  }
}
```

**Example input:**
```json
{
  "monitor_type": "delegation_expiry",
  "target_address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8",
  "params": {
    "alert_before_sec": 300,
    "auto_renew": true,
    "resource_type": "ENERGY",
    "max_price_sun": 30,
    "duration_sec": 3600
  },
  "notify": {
    "webhook": "https://example.com/hooks/merx",
    "telegram_chat_id": "123456789"
  }
}
```

**Example output:**
```
Monitor Created:

ID:             mon_a1b2c3d4e5f6
Type:           delegation_expiry
Status:         ACTIVE
Target:         TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Alert before:   5 minutes before expiry
Auto-renew:     Yes (ENERGY, max 30 SUN, 1h duration)
Notifications:  Webhook + Telegram

Current delegations on target:
  65,000 ENERGY -- expires 2026-03-30T13:00:04Z (47 min remaining)
```

**Related tools:** list_monitors, create_standing_order, ensure_resources

---

## list_monitors

List all monitors with optional status filtering. Shows monitor type, target address,
configuration, and notification settings.

**Auth:** API key required

**Input schema:**
```json
{
  "status": {
    "type": "string",
    "enum": ["ACTIVE", "CANCELLED"],
    "description": "Filter by monitor status."
  }
}
```

**Example input:** `{ "status": "ACTIVE" }`

**Example output:**
```
Monitors (ACTIVE):

ID             Type                Target          Config                  Notify
mon_a1b2c3d4   delegation_expiry   TJRab...R1z8    auto-renew, 30 SUN max  Webhook+TG
mon_e5f6g7h8   balance_threshold   --              alert < 5 TRX           Telegram
mon_i9j0k1l2   price_alert         --              ENERGY < 20 SUN         Webhook

3 active monitors.
```

**Related tools:** create_monitor, list_standing_orders
