# Price Intelligence

Merx aggregates real-time pricing from seven energy and bandwidth providers on the TRON
network. The Price Intelligence tools let agents and applications query current rates,
find the cheapest source for a given order size, and analyze historical trends -- all
without authentication.

These tools form the foundation of any cost-optimization workflow. An agent can call
`get_prices` for a broad market snapshot, narrow down with `get_best_price`, then use
`analyze_prices` or `get_price_history` to decide whether to buy now or wait. The
`compare_providers` tool produces a structured side-by-side table suitable for display.

---

## get_prices

Fetch current energy and bandwidth prices from all active Merx providers. Returns
provider name, price in SUN per unit, minimum order size, and available capacity.

**Auth:** none

**Input schema:**
```json
{
  "resource": { "type": "string", "enum": ["ENERGY", "BANDWIDTH"], "description": "Filter by resource type. Omit for all." },
  "duration": { "type": "number", "description": "Filter by duration in seconds." }
}
```

**Example input:** `{ "resource": "ENERGY" }`

**Example output:**
```
Energy prices (7 providers):

Provider    Price (SUN)  Min Order   Available     Duration
Netts       22           65,000      12,400,000    1h
CatFee      27           65,000      8,200,000     1h
Feee        30           100,000     5,000,000     1h
TronSave    32           65,000      20,000,000    1h/24h/30d
itrx        28           65,000      6,500,000     1h
Sohu        35           65,000      15,000,000    1h/24h
PowerSun    29           65,000      3,000,000     1h
```

**Related tools:** get_best_price, compare_providers, list_providers

---

## get_best_price

Find the single cheapest provider for a given resource type and amount. Returns the
provider name, unit price, total cost in TRX, and estimated fill time.

**Auth:** none

**Input schema:**
```json
{
  "resource": { "type": "string", "enum": ["ENERGY", "BANDWIDTH"], "required": true, "description": "Resource type." },
  "amount": { "type": "number", "description": "Amount of resource units needed." }
}
```

**Example input:** `{ "resource": "ENERGY", "amount": 65000 }`

**Example output:**
```
Best price for 65,000 ENERGY:

Provider:    Netts
Price:       22 SUN/unit
Total cost:  1.430 TRX
Duration:    1 hour
Fill time:   ~5 seconds
```

**Related tools:** get_prices, create_order, estimate_transaction_cost

---

## analyze_prices

Market analysis with statistical summary: mean, median, min/max, trend direction, and
volatility indicator. Useful for deciding whether current prices are favorable.

**Auth:** none

**Input schema:**
```json
{
  "resource": { "type": "string", "enum": ["ENERGY", "BANDWIDTH"], "description": "Filter by resource type. Omit for all." }
}
```

**Example input:** `{ "resource": "ENERGY" }`

**Example output:**
```
Energy Market Analysis:

Current mean:   26.7 SUN
Current median: 27.0 SUN
24h low:        21 SUN (Netts)
24h high:       38 SUN (Sohu)
Trend:          Stable (0.3% change over 24h)
Volatility:     Low

Recommendation: Prices are near 24h lows. Good time to buy.
```

**Related tools:** get_price_history, get_prices, compare_providers

---

## get_price_history

Historical price snapshots for one or all providers over a configurable time window.
Returns timestamped price points suitable for charting or trend analysis.

**Auth:** none

**Input schema:**
```json
{
  "resource": { "type": "string", "enum": ["ENERGY", "BANDWIDTH"], "description": "Filter by resource type." },
  "provider": { "type": "string", "description": "Filter by provider name." },
  "period": { "type": "string", "enum": ["1h", "6h", "24h", "7d", "30d"], "description": "Time period (default: 24h)." }
}
```

**Example input:** `{ "resource": "ENERGY", "provider": "netts", "period": "24h" }`

**Example output:**
```
Price history for Netts ENERGY (24h, 24 data points):

Time              Price (SUN)
2026-03-29 14:00  23
2026-03-29 15:00  22
2026-03-29 16:00  22
2026-03-29 17:00  24
...
2026-03-30 13:00  22

Average: 22.4 SUN | Low: 21 SUN | High: 25 SUN
```

**Related tools:** analyze_prices, get_prices

---

## compare_providers

Side-by-side comparison of all providers showing price, availability, supported
durations, and fill reliability. Output is a structured table.

**Auth:** none

**Input schema:**
```json
{
  "resource": { "type": "string", "enum": ["ENERGY", "BANDWIDTH"], "description": "Filter by resource type. Omit for all." }
}
```

**Example input:** `{ "resource": "ENERGY" }`

**Example output:**
```
Provider Comparison (ENERGY):

Provider    Price   Available     Durations        Fill Rate  Avg Speed
Netts       22 SUN  12,400,000    1h               99.2%      4s
CatFee      27 SUN  8,200,000     1h               98.7%      6s
itrx        28 SUN  6,500,000     1h               97.5%      8s
PowerSun    29 SUN  3,000,000     1h               99.0%      5s
Feee        30 SUN  5,000,000     1h               96.8%      10s
TronSave    32 SUN  20,000,000    1h/24h/30d       99.5%      3s
Sohu        35 SUN  15,000,000    1h/24h           98.0%      7s
```

**Related tools:** get_prices, get_best_price, list_providers
