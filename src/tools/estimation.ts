import { publicGet, publicPost } from '../lib/api.js'
import { textResult, errorResult, sunToTrx, formatNumber } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

// Matches real API response from POST /api/v1/estimate
interface EstimateResponse {
  energy_required: number
  bandwidth_required: number
  rental_cost: {
    energy: { best_price_sun: number; best_provider: string; cost_trx: string }
    bandwidth: { best_price_sun: number; best_provider: string; cost_trx: string }
  }
  burn_cost: { energy_burn_trx: string; bandwidth_burn_trx: string }
  total_rental_trx: string
  total_burn_trx: string
  savings_percent: number
}

// GET /api/v1/chain/resources/:address returns TronGrid raw format
interface ResourcesResponse {
  address: string
  energyLimit?: number
  energyUsed?: number
  bandwidthLimit?: number
  bandwidthUsed?: number
  freeNetLimit?: number
  freeNetUsed?: number
  // Or nested format from /address/:addr/resources
  energy?: { available: number; limit: number; used: number }
  bandwidth?: { available: number; limit: number; used: number; free_limit: number }
  trx_balance_sun?: number
}

function formatEstimate(d: EstimateResponse): string {
  return [
    '--- Transaction Cost Estimate ---',
    `Energy needed:    ${formatNumber(d.energy_required)}`,
    `Bandwidth needed: ${formatNumber(d.bandwidth_required)}`,
    '',
    '--- Rental Cost ---',
    `Energy:    ${d.rental_cost.energy.cost_trx} TRX (${d.rental_cost.energy.best_provider}, ${d.rental_cost.energy.best_price_sun} SUN/unit)`,
    `Bandwidth: ${d.rental_cost.bandwidth.cost_trx} TRX (${d.rental_cost.bandwidth.best_provider}, ${d.rental_cost.bandwidth.best_price_sun} SUN/unit)`,
    `Total:     ${d.total_rental_trx} TRX`,
    '',
    '--- Burn Cost (without rental) ---',
    `Energy:    ${d.burn_cost.energy_burn_trx} TRX`,
    `Bandwidth: ${d.burn_cost.bandwidth_burn_trx} TRX`,
    `Total:     ${d.total_burn_trx} TRX`,
    '',
    `Savings: ${d.savings_percent}%`,
  ].join('\n')
}

function formatResources(d: ResourcesResponse): string {
  // Handle both flat (TronGrid) and nested (Merx) formats
  const eLimit = d.energy?.limit ?? d.energyLimit ?? 0
  const eUsed = d.energy?.used ?? d.energyUsed ?? 0
  const eAvail = d.energy?.available ?? (eLimit - eUsed)
  const bwLimit = d.bandwidth?.limit ?? d.bandwidthLimit ?? 0
  const bwUsed = d.bandwidth?.used ?? d.bandwidthUsed ?? 0
  const bwAvail = d.bandwidth?.available ?? (bwLimit - bwUsed)
  const freeBw = d.bandwidth?.free_limit ?? ((d.freeNetLimit ?? 0) - (d.freeNetUsed ?? 0))
  const trx = sunToTrx(d.trx_balance_sun ?? 0)
  return [
    `--- Resources for ${d.address} ---`,
    '',
    `Energy:    ${formatNumber(eAvail)} / ${formatNumber(eLimit)} (used: ${formatNumber(eUsed)})`,
    `Bandwidth: ${formatNumber(bwAvail)} / ${formatNumber(bwLimit)} (used: ${formatNumber(bwUsed)})`,
    `Free BW:   ${formatNumber(Math.max(0, freeBw))}`,
    `TRX:       ${trx} TRX`,
  ].join('\n')
}

const estimateTransactionCost: McpTool = {
  name: 'estimate_transaction_cost',
  description:
    'Estimate energy and bandwidth cost for a TRON transaction. Compares rental vs burn cost. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['trc20_transfer', 'trc20_approve', 'trx_transfer', 'custom'],
        description: 'Transaction type.',
      },
      from_address: { type: 'string', description: 'Sender TRON address.' },
      to_address: { type: 'string', description: 'Recipient TRON address.' },
      token_address: { type: 'string', description: 'TRC20 contract address.' },
      amount: { type: 'string', description: 'Token amount (as string).' },
      contract_address: { type: 'string', description: 'Contract address (custom).' },
      function_selector: { type: 'string', description: 'Function selector (custom).' },
      parameter: { type: 'string', description: 'ABI-encoded parameter (custom).' },
    },
    required: ['operation'],
  },
  async handler(input) {
    try {
      const payload: Record<string, unknown> = { operation: input.operation }
      for (const f of ['from_address', 'to_address', 'token_address', 'amount', 'contract_address', 'function_selector', 'parameter']) {
        if (input[f] != null) payload[f] = input[f]
      }
      const data = await publicPost('/api/v1/estimate', payload) as EstimateResponse
      return textResult(formatEstimate(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const checkAddressResources: McpTool = {
  name: 'check_address_resources',
  description: 'Check energy, bandwidth, and TRX balance for any TRON address. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'TRON address (starts with T).' },
    },
    required: ['address'],
  },
  async handler(input) {
    try {
      const data = await publicGet(`/api/v1/chain/resources/${input.address}`) as ResourcesResponse
      return textResult(formatResources(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const estimationTools: McpTool[] = [estimateTransactionCost, checkAddressResources]
