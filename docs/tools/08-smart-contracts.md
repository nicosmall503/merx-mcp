# Smart Contracts

The Smart Contract tools provide low-level access to any contract deployed on TRON.
They support read-only calls, cost estimation, and state-changing execution. This is
the foundation layer that higher-level tools like `transfer_trc20` and `execute_swap`
are built on.

Use `read_contract` for view/pure functions that do not modify state -- these are free
and require no authentication. Use `estimate_contract_call` to simulate a state-changing
function and get an accurate energy/bandwidth estimate before committing. Finally,
`call_contract` signs, provisions resources via Merx if needed, and broadcasts the
transaction.

All three tools accept standard Solidity function selectors (e.g., `balanceOf(address)`)
and ABI-encoded parameters in hex format. For complex parameter encoding, agents can
use standard ABI encoding libraries or let the higher-level token tools handle it.

---

## read_contract

Call a view or pure function on a TRON smart contract. Does not modify state, costs
nothing, and requires no authentication or private key. Returns the raw hex result
and a decoded interpretation when possible.

**Auth:** none

**Input schema:**
```json
{
  "contract_address": {
    "type": "string",
    "required": true,
    "description": "Contract TRON address."
  },
  "function_selector": {
    "type": "string",
    "required": true,
    "description": "Function signature, e.g. \"balanceOf(address)\"."
  },
  "parameter": {
    "type": "string",
    "description": "ABI-encoded parameter hex (optional)."
  }
}
```

**Example input:**
```json
{
  "contract_address": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  "function_selector": "balanceOf(address)",
  "parameter": "000000000000000000000000a614f803b6fd780986a42c78ec9c7f77e6ded13c"
}
```

**Example output:**
```
Contract Read: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t

Function:  balanceOf(address)
Result:    0x000000000000000000000000000000000000000000000000000001393ec4d400

Decoded:   1,350,420,000,000 (with 6 decimals: 1,350,420.000000)

Note: This is a read-only call. No transaction was broadcast.
```

**Related tools:** estimate_contract_call, get_token_info, get_trc20_balance

---

## estimate_contract_call

Simulate a state-changing contract call without executing it. Returns the energy and
bandwidth that would be consumed, and compares rent cost via Merx against burn cost.
Uses `triggerConstantContract` for accurate on-chain simulation.

**Auth:** none

**Input schema:**
```json
{
  "contract_address": {
    "type": "string",
    "required": true,
    "description": "Contract TRON address."
  },
  "function_selector": {
    "type": "string",
    "required": true,
    "description": "Function signature, e.g. \"transfer(address,uint256)\"."
  },
  "parameter": {
    "type": "string",
    "description": "ABI-encoded parameter hex (optional)."
  },
  "caller_address": {
    "type": "string",
    "description": "Caller TRON address for simulation (optional)."
  }
}
```

**Example input:**
```json
{
  "contract_address": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  "function_selector": "transfer(address,uint256)",
  "parameter": "000000000000000000000000b2e1f0a9c7d6e5f4a3b2c1d0e9f800000000000000000000000000000000000000000000000000000000000005f5e100",
  "caller_address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8"
}
```

**Example output:**
```
Contract Call Estimate:

Contract:     TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t (USDT)
Function:     transfer(address,uint256)
Caller:       TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Simulation:   SUCCESS

Resources required:
  Energy:     64,285
  Bandwidth:  345

Cost comparison:
  Burn:       12.857 TRX (64,285 x 200 SUN)
  Rent:       1.414 TRX (64,285 x 22 SUN via Netts)
  Savings:    11.443 TRX (89%)
```

**Related tools:** call_contract, read_contract, estimate_transaction_cost

---

## call_contract

Execute a state-changing function on a TRON smart contract. The tool estimates resource
requirements, purchases energy and bandwidth via Merx if the caller lacks sufficient
resources, then signs and broadcasts the transaction.

**Auth:** TRON private key required

**Input schema:**
```json
{
  "contract_address": {
    "type": "string",
    "required": true,
    "description": "Contract TRON address."
  },
  "function_selector": {
    "type": "string",
    "required": true,
    "description": "Function signature, e.g. \"stake(uint256)\"."
  },
  "parameter": {
    "type": "string",
    "description": "ABI-encoded parameter hex (optional)."
  },
  "call_value_trx": {
    "type": "string",
    "description": "TRX to send with call (optional)."
  }
}
```

**Example input:**
```json
{
  "contract_address": "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
  "function_selector": "stake(uint256)",
  "parameter": "0000000000000000000000000000000000000000000000000000000005f5e100",
  "call_value_trx": "100"
}
```

**Example output:**
```
Contract Call Executed:

Contract:   TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7
Function:   stake(uint256)
TX ID:      e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2
Status:     CONFIRMED
TRX sent:   100.000000 TRX

Resources:
  Energy:   82,400 used (purchased 83,000 via Netts at 22 SUN)
  Bandwidth: 410 used (free allowance)
  Merx cost: 1.826 TRX

Return data: 0x0000000000000000000000000000000000000000000000000000000000000001
Decoded:     true
```

**Related tools:** estimate_contract_call, read_contract, ensure_resources
