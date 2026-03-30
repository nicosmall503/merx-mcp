# Token Operations

The Token Operations tools handle TRX and TRC-20 token transfers, approvals, and
metadata queries. The first three tools -- `transfer_trx`, `transfer_trc20`, and
`approve_trc20` -- are resource-aware: before executing a transaction, they
automatically check the sender's available energy and bandwidth, and if insufficient,
purchase the deficit through Merx at the best available price.

This resource-aware behavior means an agent can issue a simple "send 100 USDT" command
without worrying about whether the address has enough energy. The tool handles the
entire flow: estimate resources, buy if needed, sign and broadcast the transaction.
All three require a TRON private key set via `set_private_key`. The `get_token_info`
tool is read-only and requires no authentication.

---

## transfer_trx

Send TRX to a TRON address. Checks available bandwidth on the sender address and
purchases bandwidth via Merx if the free allowance is exhausted. A standard TRX
transfer consumes approximately 268 bandwidth.

**Auth:** TRON private key required

**Input schema:**
```json
{
  "to_address": {
    "type": "string",
    "required": true,
    "description": "Recipient TRON address."
  },
  "amount_trx": {
    "type": "string",
    "required": true,
    "description": "Amount of TRX to send."
  }
}
```

**Example input:** `{ "to_address": "TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4", "amount_trx": "50" }`

**Example output:**
```
TRX Transfer:

From:       TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
To:         TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4
Amount:     50.000000 TRX
TX ID:      a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8
Status:     CONFIRMED
Bandwidth:  268 (used free allowance)
Fee:        0 TRX
```

**Related tools:** transfer_trc20, get_trx_balance, estimate_transaction_cost

---

## transfer_trc20

Transfer TRC-20 tokens to a TRON address. Estimates the energy and bandwidth required,
checks current resources on the sender, and purchases any deficit via Merx before
signing and broadcasting. A USDT transfer typically requires 65,000 energy.

**Auth:** TRON private key required

**Input schema:**
```json
{
  "to_address": {
    "type": "string",
    "required": true,
    "description": "Recipient TRON address."
  },
  "token": {
    "type": "string",
    "required": true,
    "description": "Token symbol (USDT, USDC) or contract address."
  },
  "amount": {
    "type": "string",
    "required": true,
    "description": "Amount to transfer (human-readable)."
  }
}
```

**Example input:**
```json
{
  "to_address": "TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4",
  "token": "USDT",
  "amount": "100"
}
```

**Example output:**
```
TRC-20 Transfer:

From:       TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
To:         TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4
Token:      USDT (TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
Amount:     100.000000 USDT
TX ID:      c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0
Status:     CONFIRMED

Resources:
  Energy:   64,285 used (purchased 65,000 via Netts at 22 SUN)
  Bandwidth: 345 used (free allowance)
  Merx cost: 1.430 TRX

Total cost: 1.430 TRX (vs 13.000 TRX burn -- saved 89%)
```

**Related tools:** transfer_trx, approve_trc20, estimate_transaction_cost

---

## approve_trc20

Set a TRC-20 token spending allowance for a spender address. Required before interacting
with DEX contracts or any contract that needs to move tokens on your behalf. Resource-
aware: purchases energy via Merx if the sender lacks sufficient energy.

**Auth:** TRON private key required

**Input schema:**
```json
{
  "token": {
    "type": "string",
    "required": true,
    "description": "Token symbol (USDT, USDC) or contract address."
  },
  "spender": {
    "type": "string",
    "required": true,
    "description": "Spender TRON address."
  },
  "amount": {
    "type": "string",
    "required": true,
    "description": "Allowance amount (human-readable)."
  }
}
```

**Example input:**
```json
{
  "token": "USDT",
  "spender": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  "amount": "1000"
}
```

**Example output:**
```
TRC-20 Approval:

Owner:      TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Token:      USDT (TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
Spender:    TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
Allowance:  1,000.000000 USDT
TX ID:      d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1
Status:     CONFIRMED

Resources:
  Energy:   32,150 used (purchased 33,000 via Netts at 22 SUN)
  Merx cost: 0.726 TRX
```

**Related tools:** transfer_trc20, execute_swap, read_contract

---

## get_token_info

Retrieve TRC-20 token metadata: name, symbol, decimals, total supply, and contract
address. Accepts either a symbol shorthand or full contract address.

**Auth:** none

**Input schema:**
```json
{
  "token": {
    "type": "string",
    "required": true,
    "description": "Token symbol (USDT, USDC) or contract address."
  }
}
```

**Example input:** `{ "token": "USDT" }`

**Example output:**
```
Token Information:

Name:           Tether USD
Symbol:         USDT
Contract:       TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
Decimals:       6
Total supply:   54,823,491,027.384921 USDT
Standard:       TRC-20
```

**Related tools:** get_trc20_balance, transfer_trc20, get_token_price
