# Account Management

Every Merx user has an account with a TRX balance used to pay for resource orders. The
Account Management tools let agents check their current balance, retrieve deposit
instructions, and review transaction history. All three tools require a valid API key
set via `set_api_key`.

Deposits are made by sending TRX to the address returned by `get_deposit_info`. Each
account has a unique deposit address. Balances update automatically once the on-chain
transfer is confirmed. The `get_transaction_history` tool provides a ledger of all
account activity including deposits, order charges, and refunds.

---

## get_balance

Return the current Merx account balance. Shows available TRX, locked TRX (held for
pending orders), and USDT balance if applicable.

**Auth:** API key required

**Input schema:**
```json
{}
```
No parameters. Uses the API key set in the current session.

**Example input:** `{}`

**Example output:**
```
Merx Account Balance:

Available TRX:   84.200 TRX
Locked TRX:      1.430 TRX (1 pending order)
USDT balance:    0.000 USDT

Total value:     85.630 TRX
```

**Related tools:** get_deposit_info, get_transaction_history, create_order

---

## get_deposit_info

Return the deposit address and any required memo for funding your Merx account. Send
TRX to this address to top up your balance. The deposit address is unique per account
and does not change.

**Auth:** API key required

**Input schema:**
```json
{}
```
No parameters.

**Example input:** `{}`

**Example output:**
```
Merx Deposit Information:

Deposit address:  TKVSaJQEkWYv5oCbQxPzL7adx1S4MRvSPa
Network:          TRON (TRX only)
Memo:             Not required
Min deposit:      1.000 TRX
Confirmations:    19 blocks (~57 seconds)

Send TRX to the address above. Your balance updates automatically
after confirmation.
```

**Related tools:** get_balance, deposit_trx

---

## get_transaction_history

Retrieve a chronological log of all account transactions: deposits, order charges,
partial refunds, and withdrawals. Filterable by time period.

**Auth:** API key required

**Input schema:**
```json
{
  "period": {
    "type": "string",
    "enum": ["7D", "30D", "90D"],
    "description": "Time period to query. Default: 30D."
  }
}
```

**Example input:** `{ "period": "7D" }`

**Example output:**
```
Transaction History (last 7 days):

Date                 Type       Amount       Balance    Description
2026-03-30 12:00     CHARGE     -1.430 TRX   84.200     Order a1b2c3d4 (65k energy)
2026-03-30 11:45     DEPOSIT    +50.000 TRX  85.630     TRX deposit confirmed
2026-03-28 09:12     CHARGE     -2.860 TRX   35.630     Order b2c3d4e5 (130k energy)
2026-03-27 16:30     REFUND     +0.350 TRX   38.490     Partial refund c3d4e5f6
2026-03-25 08:00     DEPOSIT    +30.000 TRX  38.140     TRX deposit confirmed

Total deposits:   80.000 TRX
Total charges:    4.290 TRX
Net balance:      84.200 TRX
```

**Related tools:** get_balance, list_orders
