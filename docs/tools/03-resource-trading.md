# Resource Trading

The Resource Trading tools handle the core business of Merx: buying energy and bandwidth
at the best available price. Orders are automatically routed to the cheapest provider
that can fill the requested amount. The routing engine checks availability across all
seven providers and selects the optimal source in real time.

There are two approaches to acquiring resources. The explicit approach uses `create_order`
to place a specific order for a known quantity. The declarative approach uses
`ensure_resources`, which inspects the target address, calculates the deficit, and only
purchases what is missing. Both require a funded Merx account and an API key set via
`set_api_key`.

After placing an order, use `get_order` to check fill status or `list_orders` to review
recent activity. Orders move through states: PENDING, FILLING, FILLED, PARTIAL, FAILED,
or CANCELLED.

---

## create_order

Place an order for energy or bandwidth. Merx routes to the cheapest available provider.
Optionally set a maximum price to ensure the order only fills below your threshold.

**Auth:** API key required

**Input schema:**
```json
{
  "resource_type": {
    "type": "string",
    "enum": ["ENERGY", "BANDWIDTH"],
    "required": true,
    "description": "Resource type to purchase."
  },
  "amount": {
    "type": "number",
    "required": true,
    "description": "Amount of resource units (min 65,000 for ENERGY, 300 for BANDWIDTH)."
  },
  "duration_sec": {
    "type": "number",
    "required": true,
    "description": "Rental duration in seconds (e.g. 300, 3600, 86400, 2592000)."
  },
  "target_address": {
    "type": "string",
    "required": true,
    "description": "TRON address to receive delegated resources."
  },
  "max_price_sun": {
    "type": "number",
    "description": "Optional max price in SUN/unit. Order fails if no provider is cheaper."
  }
}
```

**Example input:**
```json
{
  "resource_type": "ENERGY",
  "amount": 65000,
  "duration_sec": 3600,
  "target_address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8",
  "max_price_sun": 30
}
```

**Example output:**
```
Order created successfully.

Order ID:       a1b2c3d4-5678-90ab-cdef-1234567890ab
Status:         FILLING
Resource:       ENERGY
Amount:         65,000
Duration:       1 hour
Target:         TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Provider:       Netts
Price:          22 SUN/unit
Total cost:     1.430 TRX
Estimated fill: ~5 seconds
```

**Related tools:** get_order, get_best_price, ensure_resources

---

## get_order

Retrieve the current status and details of an order by its UUID. Shows fill progress,
provider assignment, delegation transaction hash, and timing.

**Auth:** API key required

**Input schema:**
```json
{
  "order_id": {
    "type": "string",
    "required": true,
    "description": "The order UUID."
  }
}
```

**Example input:** `{ "order_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab" }`

**Example output:**
```
Order a1b2c3d4-5678-90ab-cdef-1234567890ab:

Status:         FILLED
Resource:       ENERGY
Amount:         65,000 / 65,000
Provider:       Netts
Price:          22 SUN/unit
Total charged:  1.430 TRX
Target:         TJRabPrwbZy45sbavfcjinPJC18kjpR1z8
Delegation TX:  3f4a...9c2b
Created:        2026-03-30T12:00:00Z
Filled at:      2026-03-30T12:00:04Z
Expires at:     2026-03-30T13:00:04Z
```

**Related tools:** list_orders, create_order

---

## list_orders

List recent orders with optional status filtering. Returns a summary table of the most
recent orders, sorted by creation time descending.

**Auth:** API key required

**Input schema:**
```json
{
  "status": {
    "type": "string",
    "enum": ["PENDING", "FILLING", "FILLED", "PARTIAL", "FAILED", "CANCELLED"],
    "description": "Filter by order status."
  },
  "limit": {
    "type": "number",
    "description": "Max number of orders to return (default: 20)."
  }
}
```

**Example input:** `{ "status": "FILLED", "limit": 5 }`

**Example output:**
```
Recent orders (5 shown, filtered: FILLED):

ID          Resource  Amount   Price   Cost      Target         Created
a1b2c3d4    ENERGY    65,000   22 SUN  1.430 TRX TJRab...R1z8   30 min ago
b2c3d4e5    ENERGY    130,000  22 SUN  2.860 TRX TVDGp...FRG4   2h ago
c3d4e5f6    ENERGY    65,000   27 SUN  1.755 TRX TJRab...R1z8   5h ago
d4e5f6g7    BANDWIDTH 1,000    40 SUN  0.040 TRX TJRab...R1z8   8h ago
e5f6g7h8    ENERGY    200,000  22 SUN  4.400 TRX TN21R...9kPL   1d ago
```

**Related tools:** get_order, create_order

---

## ensure_resources

Declarative resource provisioning. Checks current resources on the target address and
purchases only the deficit. If the address already has enough energy or bandwidth, no
order is placed. This is the preferred tool for agents that need to guarantee resource
availability before executing a transaction.

**Auth:** API key required

**Input schema:**
```json
{
  "target_address": {
    "type": "string",
    "required": true,
    "description": "TRON address to provision resources for."
  },
  "energy_minimum": {
    "type": "number",
    "description": "Minimum energy the address should have."
  },
  "bandwidth_minimum": {
    "type": "number",
    "description": "Minimum bandwidth the address should have."
  },
  "duration_sec": {
    "type": "number",
    "description": "Rental duration in seconds (default: 3600)."
  }
}
```

**Example input:**
```json
{
  "target_address": "TJRabPrwbZy45sbavfcjinPJC18kjpR1z8",
  "energy_minimum": 65000,
  "bandwidth_minimum": 500
}
```

**Example output:**
```
Resource check for TJRabPrwbZy45sbavfcjinPJC18kjpR1z8:

Energy:     0 available, 65,000 required --> purchasing 65,000
Bandwidth:  600 available, 500 required  --> sufficient, no action

Order placed:
  Resource:   ENERGY
  Amount:     65,000
  Provider:   Netts (22 SUN)
  Cost:       1.430 TRX
  Order ID:   f6g7h8i9-0123-45ab-cdef-6789012345cd
```

**Related tools:** check_address_resources, create_order, estimate_transaction_cost
