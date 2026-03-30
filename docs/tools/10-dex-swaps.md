# DEX Swaps

The DEX Swap tools enable token-to-token exchanges on SunSwap, TRON's primary
decentralized exchange. Merx integrates with SunSwap's routing contracts to find
optimal swap paths and execute trades with accurate resource provisioning.

A key differentiator is that `execute_swap` uses exact energy simulation via
`triggerConstantContract` before execution. This means the energy estimate is not a
rough approximation but the actual amount the swap will consume, determined by running
the transaction against current chain state. The tool then provisions exactly that
amount of energy through Merx, avoiding both overpayment and failed transactions.

The workflow is straightforward: call `get_swap_quote` to preview the exchange rate
and price impact, optionally check `get_token_price` for reference pricing, then
`execute_swap` to commit. All swap tools support token symbols (USDT, USDC, TRX) and
raw contract addresses.

---

## get_swap_quote

Get an estimated swap quote from SunSwap without executing. Returns the expected output
amount, exchange rate, price impact, minimum received (after slippage), and the
routing path.

**Auth:** none

**Input schema:**
```json
{
  "from_token": {
    "type": "string",
    "required": true,
    "description": "Source token symbol or address."
  },
  "to_token": {
    "type": "string",
    "required": true,
    "description": "Destination token symbol or address."
  },
  "amount": {
    "type": "string",
    "required": true,
    "description": "Amount of source token to swap."
  },
  "slippage": {
    "type": "number",
    "description": "Slippage tolerance in percent (default 1)."
  }
}
```

**Example input:**
```json
{
  "from_token": "TRX",
  "to_token": "USDT",
  "amount": "1000",
  "slippage": 0.5
}
```

**Example output:**
```
Swap Quote: 1,000 TRX -> USDT

Expected output:  248.500000 USDT
Exchange rate:    1 TRX = 0.248500 USDT
Price impact:     0.02%
Min received:     247.257500 USDT (0.5% slippage)
Route:            TRX -> USDT (direct pair)
Liquidity:        $42,000,000

Estimated energy: 120,000
Rent cost:        2.640 TRX (via Netts at 22 SUN)

Note: This is an estimate. Execute with execute_swap to trade.
```

**Related tools:** execute_swap, get_token_price, approve_trc20

---

## execute_swap

Execute a token swap on SunSwap. Before broadcasting, the tool simulates the exact
transaction via `triggerConstantContract` to determine precise energy requirements,
then provisions that energy through Merx. If the source token requires approval,
the tool will indicate this and the agent should call `approve_trc20` first.

**Auth:** TRON private key required

**Input schema:**
```json
{
  "from_token": {
    "type": "string",
    "required": true,
    "description": "Source token symbol or address."
  },
  "to_token": {
    "type": "string",
    "required": true,
    "description": "Destination token symbol or address."
  },
  "amount": {
    "type": "string",
    "required": true,
    "description": "Amount of source token to swap."
  },
  "slippage": {
    "type": "number",
    "description": "Slippage tolerance in percent (default 1)."
  }
}
```

**Example input:**
```json
{
  "from_token": "TRX",
  "to_token": "USDT",
  "amount": "1000",
  "slippage": 1
}
```

**Example output:**
```
Swap Executed: 1,000 TRX -> USDT

TX ID:          f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3
Status:         CONFIRMED
Input:          1,000.000000 TRX
Output:         248.320000 USDT
Exchange rate:  1 TRX = 0.248320 USDT
Price impact:   0.02%
Route:          TRX -> USDT (direct pair)

Resources:
  Energy:       118,450 used (purchased 119,000 via Netts at 22 SUN)
  Bandwidth:    580 used (free allowance)
  Merx cost:    2.618 TRX

Total cost:     1,002.618 TRX (swap amount + resource rental)
```

**Related tools:** get_swap_quote, approve_trc20, get_token_price

---

## get_token_price

Get current price information for a token. Returns the USD price, 24h volume, and
price change. Uses on-chain DEX data and aggregated feeds.

**Auth:** none

**Input schema:**
```json
{
  "token": {
    "type": "string",
    "required": true,
    "description": "Token symbol (USDT, USDC, etc.) or address."
  }
}
```

**Example input:** `{ "token": "TRX" }`

**Example output:**
```
Token Price: TRX

Price:          $0.2485 USD
24h change:     +1.2%
24h volume:     $385,000,000
24h high:       $0.2520
24h low:        $0.2410
Source:         CoinGecko + SunSwap
```

**Related tools:** get_swap_quote, get_trx_price, get_token_info
