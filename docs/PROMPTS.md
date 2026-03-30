# Merx MCP Server -- Prompt Reference

All 30 prompts available through the Merx MCP server. Prompts provide pre-built
instruction templates that an AI agent receives as system-level context to guide
its behavior for specific tasks.

---

## Price and Market Analysis

### 1. check-energy-prices
| Field | Value |
|-------|-------|
| Category | Price Analysis |
| Description | Check current energy prices across all providers and present a ranked comparison. |
| Arguments | `duration_hours` (number, optional) -- filter by rental period |
| Agent receives | Instructions to call `get_prices`, format results as a ranked table, highlight the cheapest provider, and note any providers with limited capacity. |

### 2. find-cheapest-energy
| Field | Value |
|-------|-------|
| Category | Price Analysis |
| Description | Find the absolute cheapest energy for a specific amount and duration. |
| Arguments | `energy_amount` (number, required); `duration_hours` (number, optional) |
| Agent receives | Instructions to call `get_best_price`, compare with `analyze_prices` 24h median, and advise whether current price is favorable. |

### 3. price-trend-analysis
| Field | Value |
|-------|-------|
| Category | Price Analysis |
| Description | Analyze price trends and recommend optimal buying times. |
| Arguments | `window` (string, optional) -- `1h`, `24h`, `7d`, `30d` |
| Agent receives | Instructions to call `analyze_prices` and `get_price_history`, identify trends, and present a buy/wait recommendation with supporting data. |

### 4. compare-all-providers
| Field | Value |
|-------|-------|
| Category | Price Analysis |
| Description | Comprehensive provider comparison including reliability metrics. |
| Arguments | none |
| Agent receives | Instructions to call `list_providers` and `compare_providers`, format as a detailed comparison table with price, uptime, speed, and capacity columns. |

### 5. savings-calculator
| Field | Value |
|-------|-------|
| Category | Price Analysis |
| Description | Calculate potential savings from using Merx vs burning TRX. |
| Arguments | `transaction_type` (string, required); `monthly_count` (number, optional) |
| Agent receives | Instructions to call `calculate_savings` with the given parameters, present per-transaction and monthly projections, and show percentage saved. |

---

## Transaction Planning

### 6. plan-usdt-transfer
| Field | Value |
|-------|-------|
| Category | Transaction Planning |
| Description | Plan a USDT transfer with optimal resource provisioning. |
| Arguments | `to` (string, required); `amount` (number, required) |
| Agent receives | Instructions to estimate cost, check recipient activation status, ensure resources, and execute the transfer. Includes fallback steps if recipient is a new address. |

### 7. plan-trx-transfer
| Field | Value |
|-------|-------|
| Category | Transaction Planning |
| Description | Plan a TRX transfer with bandwidth handling. |
| Arguments | `to` (string, required); `amount_trx` (number, required) |
| Agent receives | Instructions to check bandwidth availability, estimate if additional bandwidth is needed, and execute the transfer. |

### 8. plan-batch-transfers
| Field | Value |
|-------|-------|
| Category | Transaction Planning |
| Description | Plan multiple transfers with shared resource provisioning. |
| Arguments | `transfers` (object[], required) -- array of `{ to, token, amount }` |
| Agent receives | Instructions to aggregate energy needs, buy in batch at cheapest price, then execute transfers sequentially. |

### 9. plan-swap
| Field | Value |
|-------|-------|
| Category | Transaction Planning |
| Description | Plan a token swap on SunSwap with resource pre-provisioning. |
| Arguments | `from_token` (string, required); `to_token` (string, required); `amount` (number, required) |
| Agent receives | Instructions to get a swap quote, check approval status, ensure resources, execute approval if needed, then execute the swap. |

### 10. plan-contract-interaction
| Field | Value |
|-------|-------|
| Category | Transaction Planning |
| Description | Plan a smart contract call with resource estimation. |
| Arguments | `contract_address` (string, required); `function_selector` (string, required); `parameters` (string[], optional) |
| Agent receives | Instructions to estimate energy via dry-run, ensure resources, build the transaction, and present a confirmation before execution. |

---

## Account Operations

### 11. account-overview
| Field | Value |
|-------|-------|
| Category | Account Operations |
| Description | Full account status: Merx balance, on-chain balances, active orders, standing orders. |
| Arguments | `address` (string, optional) |
| Agent receives | Instructions to call `get_balance`, `check_address_resources`, `list_orders`, and `list_standing_orders`, then present a unified dashboard view. |

### 12. deposit-guide
| Field | Value |
|-------|-------|
| Category | Account Operations |
| Description | Guide the user through depositing TRX into their Merx account. |
| Arguments | `amount_trx` (number, optional) |
| Agent receives | Instructions to call `get_deposit_info`, explain the process, and optionally execute `deposit_trx` if the user has a connected wallet. |

### 13. withdrawal-guide
| Field | Value |
|-------|-------|
| Category | Account Operations |
| Description | Guide the user through withdrawing from their Merx balance. |
| Arguments | `amount_trx` (number, optional) |
| Agent receives | Instructions to check balance, present withdrawal options, and execute with confirmation. |

### 14. setup-auto-deposit
| Field | Value |
|-------|-------|
| Category | Account Operations |
| Description | Configure automatic deposits when balance runs low. |
| Arguments | `threshold_trx` (number, optional); `deposit_amount_trx` (number, optional) |
| Agent receives | Instructions to explain auto-deposit, recommend thresholds based on usage history, and configure via `enable_auto_deposit`. |

---

## Resource Management

### 15. check-resources
| Field | Value |
|-------|-------|
| Category | Resource Management |
| Description | Check energy and bandwidth status for an address. |
| Arguments | `address` (string, required) |
| Agent receives | Instructions to call `check_address_resources`, present current vs max resources, list active delegations, and flag any expiring soon. |

### 16. ensure-ready
| Field | Value |
|-------|-------|
| Category | Resource Management |
| Description | Ensure an address is ready for a specific transaction type. |
| Arguments | `address` (string, required); `transaction_type` (string, required) |
| Agent receives | Instructions to estimate resources, check current levels, buy the deficit, and confirm readiness. |

### 17. delegation-status
| Field | Value |
|-------|-------|
| Category | Resource Management |
| Description | Review all active delegations for an address with expiry times. |
| Arguments | `address` (string, required) |
| Agent receives | Instructions to query delegation data, present a timeline of expirations, and suggest renewals for any expiring within 1 hour. |

---

## Standing Orders and Monitors

### 18. setup-price-trigger
| Field | Value |
|-------|-------|
| Category | Automation |
| Description | Create a standing order that buys energy when price drops below a threshold. |
| Arguments | `price_sun` (number, required); `energy_amount` (number, required); `target_address` (string, required) |
| Agent receives | Instructions to validate inputs, create the standing order, set a reasonable budget, and confirm activation. |

### 19. setup-auto-renew
| Field | Value |
|-------|-------|
| Category | Automation |
| Description | Set up automatic renewal of energy delegations before they expire. |
| Arguments | `address` (string, required); `energy_amount` (number, optional) |
| Agent receives | Instructions to check current delegations, create a `delegation_expiry` standing order, and set notification preferences. |

### 20. setup-balance-alert
| Field | Value |
|-------|-------|
| Category | Automation |
| Description | Create a monitor that alerts when Merx balance drops below a threshold. |
| Arguments | `threshold_trx` (number, required); `notify_channel` (string, optional) |
| Agent receives | Instructions to create a `balance_threshold` monitor with the specified notification channel. |

### 21. list-automations
| Field | Value |
|-------|-------|
| Category | Automation |
| Description | Show all active standing orders and monitors in a unified view. |
| Arguments | none |
| Agent receives | Instructions to call `list_standing_orders` and `list_monitors`, merge results, and present with status, last-triggered, and budget remaining. |

---

## Education

### 22. explain-energy
| Field | Value |
|-------|-------|
| Category | Education |
| Description | Explain TRON energy: what it is, why it matters, how Merx helps. |
| Arguments | none |
| Agent receives | A template covering energy mechanics, burn costs, delegation model, and Merx savings with concrete examples. |

### 23. explain-bandwidth
| Field | Value |
|-------|-------|
| Category | Education |
| Description | Explain TRON bandwidth and when it matters. |
| Arguments | none |
| Agent receives | A template covering bandwidth mechanics, free allowance, and when users need to worry about it. |

### 24. explain-staking
| Field | Value |
|-------|-------|
| Category | Education |
| Description | Explain TRON staking (Stake 2.0) and how delegation works. |
| Arguments | none |
| Agent receives | A template covering Stake 2.0, lock periods, delegation mechanics, and how providers supply energy. |

### 25. explain-merx
| Field | Value |
|-------|-------|
| Category | Education |
| Description | Explain what Merx is and how it works. |
| Arguments | none |
| Agent receives | A template covering Merx as an energy aggregator, provider network, pricing model, and key benefits. |

---

## Onboarding

### 26. quickstart
| Field | Value |
|-------|-------|
| Category | Onboarding |
| Description | Complete onboarding: create account, fund it, make first purchase. |
| Arguments | `email` (string, optional) |
| Agent receives | Step-by-step instructions to create account, deposit TRX, buy first energy order, and verify delegation on-chain. |

### 27. api-key-setup
| Field | Value |
|-------|-------|
| Category | Onboarding |
| Description | Guide through API key creation and configuration. |
| Arguments | none |
| Agent receives | Instructions to create account or retrieve existing key, set it via `set_api_key`, and verify with a test call. |

---

## Advanced

### 28. intent-walkthrough
| Field | Value |
|-------|-------|
| Category | Advanced |
| Description | Walk through building and executing a multi-step intent. |
| Arguments | `goal` (string, required) -- natural language description of what the user wants to do |
| Agent receives | Instructions to decompose the goal into steps, simulate with `simulate`, present the plan, and execute with `execute_intent` on confirmation. |

### 29. x402-purchase
| Field | Value |
|-------|-------|
| Category | Advanced |
| Description | Make a zero-registration energy purchase via x402 protocol. |
| Arguments | `energy_amount` (number, required); `target_address` (string, required) |
| Agent receives | Instructions to create an x402 invoice, present payment details, and complete the purchase without requiring a Merx account. |

### 30. autonomous-flow
| Field | Value |
|-------|-------|
| Category | Advanced |
| Description | Fully autonomous deposit-buy-use flow for programmatic agents. |
| Arguments | `target_address` (string, required); `transaction_type` (string, required) |
| Agent receives | Instructions to check balance, deposit if needed, estimate resources, buy energy, and confirm readiness -- all without user interaction between steps. |
