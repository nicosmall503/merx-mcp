import type { McpToolAnnotations } from '../types.js'

// Read-only tools: no side effects, safe to call repeatedly
const RO: McpToolAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true }

// Write tools: create resources but are idempotent (safe to retry)
const WR: McpToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true }

// Destructive/irreversible: transfers, swaps, contract calls
const TX: McpToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false }

// Session-only: set_api_key, set_private_key (side effect but not destructive)
const SE: McpToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true }

export const TOOL_ANNOTATIONS: Record<string, McpToolAnnotations> = {
  // Price Intelligence (read-only)
  get_prices: RO, get_best_price: RO, analyze_prices: RO,
  get_price_history: RO, compare_providers: RO,

  // Estimation (read-only)
  estimate_transaction_cost: RO, check_address_resources: RO,

  // Trading (write, creates orders)
  create_order: WR, get_order: RO, list_orders: RO, ensure_resources: WR,

  // Account (read-only)
  get_balance: RO, get_deposit_info: RO, get_transaction_history: RO,

  // Convenience (read-only)
  explain_concept: RO, suggest_duration: RO, calculate_savings: RO, list_providers: RO,

  // On-chain queries (read-only)
  get_account_info: RO, get_trx_balance: RO, get_trc20_balance: RO,
  get_transaction: RO, get_block: RO,

  // Network (read-only)
  get_chain_parameters: RO, convert_address: RO, get_trx_price: RO,
  validate_address: RO, search_transaction_history: RO,

  // Token operations (destructive: transfers are irreversible)
  transfer_trx: TX, transfer_trc20: TX, approve_trc20: TX, get_token_info: RO,

  // Smart contracts
  read_contract: RO, estimate_contract_call: RO, call_contract: TX,

  // DEX (destructive: swaps are irreversible)
  get_swap_quote: RO, execute_swap: TX, get_token_price: RO,

  // Onboarding (write)
  create_account: WR, login: WR,

  // Payments (destructive: real money)
  deposit_trx: TX, enable_auto_deposit: WR, pay_invoice: TX, create_paid_order: TX,

  // Intent (destructive: executes multi-step transactions)
  execute_intent: TX, simulate: RO,

  // Standing orders (write, creates automation)
  create_standing_order: WR, list_standing_orders: RO,
  create_monitor: WR, list_monitors: RO,

  // Withdrawal (destructive)
  withdraw: TX,

  // Broadcast (destructive: sends real transactions)
  resource_broadcast: TX,

  // Session management
  set_api_key: SE, set_private_key: SE,

  // Policy engine (write via LLM)
  compile_policy: WR,

  // Agent Payments (5 tools)
  request_payment: WR,
  lookup_invoice: RO,
  create_invoice: WR,
  watch_address: WR,
  agent_status: RO,
}
