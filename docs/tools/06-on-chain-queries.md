# On-Chain Queries

The On-Chain Query tools provide direct read access to the TRON blockchain. They let
agents inspect account state, check balances, look up transactions, and read block
data without any authentication or private keys. All queries are executed against
a full node and return current chain state.

These tools are the building blocks for any TRON-aware agent. Before executing a
transfer, an agent can verify the recipient exists with `get_account_info`, check
available funds with `get_trx_balance` or `get_trc20_balance`, and after execution
confirm the result with `get_transaction`. The `get_block` tool provides network-level
context such as current block height and timestamp.

---

## get_account_info

Full on-chain account state including TRX balance, energy, bandwidth, frozen balances,
account creation date, and permissions. More detailed than `get_trx_balance`.

**Auth:** none

**Input schema:**
```json
{
  "address": {
    "type": "string",
    "required": true,
    "description": "TRON address (T...)."
  }
}
```

**Example input:** `{ "address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8" }`

**Example output:**
```
Account: TJRabPrwbZy45sbavfcjinPJC18kjpR1z8

TRX Balance:      1,245.320 TRX
Frozen TRX:       0.000 TRX
Account type:     Normal
Created:          2024-06-15T08:30:00Z

Energy:
  Available:      0 / 0
  Delegated in:   0

Bandwidth:
  Available:      600 / 600
  Free limit:     600
  Delegated in:   0

Permissions:
  Owner:          TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
  Active:         TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
```

**Related tools:** get_trx_balance, check_address_resources, validate_address

---

## get_trx_balance

Quick TRX balance check for any TRON address. Returns the balance in TRX with six
decimal precision. Lighter than `get_account_info` when only the balance is needed.

**Auth:** none

**Input schema:**
```json
{
  "address": {
    "type": "string",
    "required": true,
    "description": "TRON address (T...)."
  }
}
```

**Example input:** `{ "address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8" }`

**Example output:**
```
TRX Balance for TJRabPrwbZy45sbavfcjinPJC18kjpR1z8:

Balance: 1,245.320000 TRX
```

**Related tools:** get_trc20_balance, get_account_info

---

## get_trc20_balance

Get the balance of a specific TRC-20 token for an address. Accepts common token symbols
(USDT, USDC) or a raw contract address for any TRC-20 token.

**Auth:** none

**Input schema:**
```json
{
  "address": {
    "type": "string",
    "required": true,
    "description": "TRON address to query."
  },
  "token": {
    "type": "string",
    "required": true,
    "description": "Token symbol (USDT, USDC) or contract address."
  }
}
```

**Example input:** `{ "address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8", "token": "USDT" }`

**Example output:**
```
TRC-20 Balance:

Address:  TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Token:    USDT (TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
Balance:  5,230.450000 USDT
```

**Related tools:** get_trx_balance, get_token_info, transfer_trc20

---

## get_transaction

Look up a transaction by its hash. Returns the transaction type, status, block number,
timestamp, and decoded parameters. Works for all TRON transaction types including TRX
transfers, TRC-20 transfers, contract calls, and resource delegation.

**Auth:** none

**Input schema:**
```json
{
  "tx_id": {
    "type": "string",
    "required": true,
    "description": "Transaction ID (hash)."
  }
}
```

**Example input:** `{ "tx_id": "3f4a8b2c9d1e6f7a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f" }`

**Example output:**
```
Transaction 3f4a8b2c...3e4f:

Status:       SUCCESS
Type:         TriggerSmartContract
Block:        72,451,892
Timestamp:    2026-03-30T12:00:04Z
From:         TKVSaJQEkWYv5oCbQxPzL7adx1S4MRvSPa
Contract:     TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t (USDT)
Method:       transfer(address,uint256)
Parameters:
  to:         TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4
  value:      100000000 (100.000000 USDT)
Energy used:  64,285
Bandwidth:    345
Fee:          0 TRX (energy covered by delegation)
```

**Related tools:** search_transaction_history, get_block

---

## get_block

Get TRON block information by block number. Omit the parameter to get the latest block.
Returns block hash, timestamp, transaction count, and witness address.

**Auth:** none

**Input schema:**
```json
{
  "block_number": {
    "type": "number",
    "description": "Block number. Omit for latest."
  }
}
```

**Example input:** `{}`

**Example output:**
```
Block #72,451,900 (latest):

Hash:           0x8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a
Timestamp:      2026-03-30T12:05:00Z
Witness:        TLyqzVGLV1srkB7dToTAEQgFSDA5dQXks2
Transactions:   142
Size:           48,291 bytes
Parent hash:    0x7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b
```

**Related tools:** get_transaction, get_chain_parameters
