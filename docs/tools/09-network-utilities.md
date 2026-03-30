# Network Utilities

The Network Utilities category groups general-purpose TRON tools that do not fit neatly
into a single workflow but are essential for building robust agents. They cover network
parameter inspection, address format conversion, TRX price feeds, address validation,
and on-chain transaction history search.

These tools require no authentication and operate on public chain data. An agent might
use `validate_address` before sending funds, `convert_address` to switch between base58
and hex formats for contract interactions, or `get_chain_parameters` to check the
current energy fee rate. The `get_trx_price` tool provides fiat conversion rates from
CoinGecko, and `search_transaction_history` enables on-chain forensics for any address.

---

## get_chain_parameters

Retrieve current TRON network parameters including the energy fee rate, bandwidth cost,
proposal thresholds, and other governance-controlled values. Includes a comparison
against current Merx rental prices for context.

**Auth:** none

**Input schema:**
```json
{}
```
No parameters.

**Example input:** `{}`

**Example output:**
```
TRON Network Parameters:

Parameter                    Value
getEnergyFee                 200 SUN per energy unit
getTransactionFee            1,000 SUN per bandwidth unit
getTotalEnergyLimit          90,000,000,000
getMaintenanceTimeInterval   6 hours
getCreateAccountFee          100,000 SUN (0.1 TRX)
getCreateNewAccountFeeInSysFee  1,000,000 SUN (1 TRX)

Merx vs Network Burn:
  Energy rent:   22 SUN/unit (Netts best) vs 200 SUN/unit (burn)
  Savings:       89% per energy unit
```

**Related tools:** estimate_transaction_cost, get_trx_price, analyze_prices

---

## convert_address

Convert a TRON address between base58 format (starts with T) and hex format (starts
with 41). Useful when working with raw contract data or ABI-encoded parameters.

**Auth:** none

**Input schema:**
```json
{
  "address": {
    "type": "string",
    "required": true,
    "description": "TRON address in base58 (T...) or hex (41...)."
  }
}
```

**Example input:** `{ "address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8" }`

**Example output:**
```
Address Conversion:

Base58: TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Hex:    415a523b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a

Both formats refer to the same account.
```

**Related tools:** validate_address, get_account_info

---

## get_trx_price

Get the current TRX market price from CoinGecko. Supports multiple fiat currencies.
Useful for converting TRX costs into user-facing dollar amounts.

**Auth:** none

**Input schema:**
```json
{
  "currency": {
    "type": "string",
    "description": "Fiat currency code (default: usd)."
  }
}
```

**Example input:** `{ "currency": "usd" }`

**Example output:**
```
TRX Price:

1 TRX = $0.2485 USD
24h change: +1.2%
Market cap: $21,450,000,000
Last updated: 2026-03-30T12:10:00Z
```

**Related tools:** calculate_savings, estimate_transaction_cost

---

## validate_address

Validate a TRON address format and check its on-chain status. Returns whether the
address is syntactically valid, whether it has been activated on-chain, and the
account type.

**Auth:** none

**Input schema:**
```json
{
  "address": {
    "type": "string",
    "required": true,
    "description": "TRON address to validate."
  }
}
```

**Example input:** `{ "address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8" }`

**Example output:**
```
Address Validation: TJRabPrwbZy45sbavfcjinPJC18kjpR1z8

Format valid:    Yes
Checksum valid:  Yes
On-chain status: Active
Account type:    Normal
First seen:      2024-06-15T08:30:00Z
```

**Related tools:** convert_address, get_account_info

---

## search_transaction_history

Search on-chain transaction history for a TRON address. Returns recent transactions
with type, counterparty, amount, and status. Filterable by transaction type.

**Auth:** none

**Input schema:**
```json
{
  "address": {
    "type": "string",
    "required": true,
    "description": "TRON address."
  },
  "type": {
    "type": "string",
    "enum": ["all", "trx", "trc20"],
    "description": "Transaction type filter (default: all)."
  },
  "limit": {
    "type": "number",
    "description": "Max results (default: 20)."
  }
}
```

**Example input:** `{ "address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8", "type": "trc20", "limit": 5 }`

**Example output:**
```
TRC-20 Transactions for TJRabPrwbZy45sbavfcjinPJC18kjpR1z8 (5 shown):

TX ID        Time                 Token  Direction  Amount          Counterparty
a9b8c7d6     2026-03-30 12:00     USDT   OUT        100.000000      TVDGp...FRG4
b8c7d6e5     2026-03-29 18:30     USDT   IN         500.000000      TN21R...9kPL
c7d6e5f4     2026-03-28 09:15     USDC   OUT        250.000000      TKVSa...vSPa
d6e5f4a3     2026-03-27 14:00     USDT   IN         1,000.000000    TQn9Y...bLSE
e5f4a3b2     2026-03-26 11:45     USDT   OUT        75.000000       TVDGp...FRG4
```

**Related tools:** get_transaction, get_trc20_balance, get_trx_balance
