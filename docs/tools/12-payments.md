# Payments

The Payments tools handle fund movement into Merx accounts and introduce the x402
zero-registration payment flow. They range from straightforward TRX deposits to
automated balance management and invoice-based payments that bypass account creation
entirely.

The `deposit_trx` tool bridges your TRON wallet to your Merx account by initiating an
on-chain TRX transfer to your deposit address. The `enable_auto_deposit` tool sets up
a session-level watcher that automatically tops up your Merx balance when it drops below
a threshold -- essential for agents running unattended. The x402 tools (`pay_invoice`
and `create_paid_order`) represent the next evolution: a zero-registration flow where
resources can be purchased by paying an invoice directly, without creating a Merx
account first.

---

## deposit_trx

Initiate a TRX deposit from your TRON wallet to your Merx account. Requires both a
Merx API key (to identify the account) and a TRON private key (to sign the on-chain
transfer). Returns deposit instructions and the resulting transaction.

**Auth:** API key + TRON private key required

**Input schema:**
```json
{
  "amount_trx": {
    "type": "string",
    "required": true,
    "description": "Amount of TRX to deposit."
  }
}
```

**Example input:** `{ "amount_trx": "100" }`

**Example output:**
```
TRX Deposit:

From:       TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
To:         TKVSaJQEkWYv5oCbQxPzL7adx1S4MRvSPa (your deposit address)
Amount:     100.000000 TRX
TX ID:      a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0
Status:     BROADCAST

Estimated confirmation: ~57 seconds (19 blocks)
Your Merx balance will update automatically after confirmation.
```

**Related tools:** get_balance, get_deposit_info, enable_auto_deposit

---

## enable_auto_deposit

Configure automatic TRX deposits when your Merx balance falls below a threshold. The
monitor runs for the duration of the current session only and triggers on-chain
transfers from your wallet to your Merx deposit address. Useful for agents that place
orders continuously and cannot afford to run out of balance.

**Auth:** API key required

**Input schema:**
```json
{
  "threshold_trx": {
    "type": "string",
    "required": true,
    "description": "Balance threshold in TRX to trigger deposit."
  },
  "deposit_amount_trx": {
    "type": "string",
    "required": true,
    "description": "Amount of TRX to deposit on each trigger."
  },
  "max_daily_deposits": {
    "type": "number",
    "description": "Maximum deposits per day (default 5)."
  }
}
```

**Example input:**
```json
{
  "threshold_trx": "10",
  "deposit_amount_trx": "50",
  "max_daily_deposits": 3
}
```

**Example output:**
```
Auto-Deposit Enabled (session-only):

Threshold:       10.000 TRX
Deposit amount:  50.000 TRX per trigger
Max per day:     3 deposits
Source wallet:   TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Deposit address: TKVSaJQEkWYv5oCbQxPzL7adx1S4MRvSPa

Current balance: 84.200 TRX (above threshold, no action)

The monitor will check your balance before each order and deposit
automatically if it falls below 10 TRX. This setting is active for
the current session only.
```

**Related tools:** deposit_trx, get_balance, create_order

---

## pay_invoice

Pay an x402 invoice. This is part of the zero-registration flow where resources can be
purchased without creating a Merx account. The invoice contains the payment amount,
recipient, and the resource order details. Payment is settled on-chain.

**Auth:** TRON private key required

**Status:** Coming soon

**Input schema:**
```json
{
  "invoice_id": {
    "type": "string",
    "required": true,
    "description": "Invoice ID to pay."
  }
}
```

**Example input:** `{ "invoice_id": "inv_x402_a1b2c3d4" }`

**Example output:**
```
Invoice Payment:

Invoice:      inv_x402_a1b2c3d4
Amount:       1.500 TRX
Resource:     65,000 ENERGY (1h)
Target:       TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4
TX ID:        b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1
Status:       PAID

Resources will be delegated within ~10 seconds of payment confirmation.
```

**Related tools:** create_paid_order, create_order

---

## create_paid_order

Create a resource order with direct payment via x402 -- no Merx account or API key
required. The tool generates an invoice that is immediately paid from the caller's
TRON wallet, and resources are delegated upon confirmation. This is the simplest path
from zero to resources.

**Auth:** TRON private key required (no Merx account needed)

**Status:** Coming soon

**Input schema:**
```json
{
  "resource_type": {
    "type": "string",
    "enum": ["ENERGY", "BANDWIDTH"],
    "required": true,
    "description": "Type of resource to order."
  },
  "amount": {
    "type": "number",
    "required": true,
    "description": "Amount of resource units."
  },
  "duration_sec": {
    "type": "number",
    "required": true,
    "description": "Duration in seconds."
  },
  "target_address": {
    "type": "string",
    "required": true,
    "description": "TRON address to receive resources."
  }
}
```

**Example input:**
```json
{
  "resource_type": "ENERGY",
  "amount": 65000,
  "duration_sec": 3600,
  "target_address": "TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4"
}
```

**Example output:**
```
Paid Order (x402):

Invoice:      inv_x402_c3d4e5f6
Resource:     ENERGY
Amount:       65,000
Duration:     1 hour
Target:       TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4
Provider:     Netts (22 SUN)
Total cost:   1.500 TRX (includes 0.070 TRX x402 fee)

Payment TX:   d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9
Status:       PAID -- delegation in progress

No Merx account was used. Payment settled directly on-chain.
```

**Related tools:** pay_invoice, create_order, get_best_price
