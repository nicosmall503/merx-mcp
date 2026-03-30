# Resource Estimation

Every transaction on TRON consumes energy, bandwidth, or both. The Resource Estimation
tools let agents determine exactly how much of each resource a specific operation will
require -- and what it would cost to rent versus burn. This is essential for budgeting
and for the resource-aware token tools that automatically provision resources before
executing transactions.

These two tools work without authentication and accept any TRON address. Use
`estimate_transaction_cost` to get a detailed cost breakdown before placing an order,
and `check_address_resources` to see what an address already has available. Together
they answer the question: "Does this address need more resources, and if so, how much
will it cost?"

---

## estimate_transaction_cost

Estimate energy and bandwidth consumption for a TRON transaction. Compares the cost of
renting resources via Merx against the TRX burn cost, showing the savings. Supports
standard operations (TRC-20 transfer, approve, TRX transfer) and custom contract calls.

**Auth:** none

**Input schema:**
```json
{
  "operation": {
    "type": "string",
    "enum": ["trc20_transfer", "trc20_approve", "trx_transfer", "custom"],
    "required": true,
    "description": "Transaction type."
  },
  "from_address": { "type": "string", "description": "Sender TRON address." },
  "to_address": { "type": "string", "description": "Recipient TRON address." },
  "amount": { "type": "number", "description": "Token amount." },
  "token_address": { "type": "string", "description": "TRC20 contract address." },
  "contract_address": { "type": "string", "description": "Contract address (custom)." },
  "function_selector": { "type": "string", "description": "Function selector (custom)." },
  "parameter": { "type": "string", "description": "ABI-encoded parameter (custom)." }
}
```

**Example input:**
```json
{
  "operation": "trc20_transfer",
  "from_address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8",
  "to_address": "TVDGpn4hCSzJ5nkHPESj8ADNpRjf44FRG4",
  "amount": 100,
  "token_address": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
}
```

**Example output:**
```
Transaction Cost Estimate: TRC-20 Transfer (USDT)

Resource        Required    Available   Deficit
Energy          65,000      0           65,000
Bandwidth       345         600         0

Cost Comparison:
  Burn cost:    13.000 TRX (65,000 energy x 200 SUN/unit + bandwidth free)
  Rent cost:    1.430 TRX  (65,000 energy x 22 SUN via Netts, 1h)
  Savings:      11.570 TRX (89%)

Recommended: Rent energy via Merx for 89% savings.
```

**Related tools:** check_address_resources, create_order, ensure_resources

---

## check_address_resources

Check the current energy, bandwidth, and TRX balance for any TRON address. Returns
both available and maximum values, plus delegation details if resources are currently
delegated to the address.

**Auth:** none

**Input schema:**
```json
{
  "address": {
    "type": "string",
    "required": true,
    "description": "TRON address (starts with T)."
  }
}
```

**Example input:**
```json
{ "address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8" }
```

**Example output:**
```
Resources for TJRabPrwbZy45sbavfcjinPJC18kjpR1z8:

TRX Balance:    1,245.320 TRX

Energy:
  Available:    0 / 0
  Delegated:    0
  Frozen:       0

Bandwidth:
  Available:    600 / 600
  Free limit:   600
  Delegated:    0
  Frozen:       0

Note: This address has no energy. A TRC-20 transfer will burn ~13 TRX.
      Use estimate_transaction_cost for exact figures.
```

**Related tools:** estimate_transaction_cost, ensure_resources, get_account_info
