import { textResult, errorResult, sunToTrx, formatNumber } from '../lib/formatter.js'
import { publicGet, publicPost } from '../lib/api.js'
import { getConcept, listTopics } from '../lib/concepts.js'
import {
  collectBestDurations, pickBestDuration, buildDurationTable,
  formatSec, formatSavingsReport,
  type ProviderPrice,
} from '../lib/pricing.js'
import type { McpTool } from '../types.js'

// --- explain_concept ---

const explainConceptTool: McpTool = {
  name: 'explain_concept',
  description: 'Explain a TRON or Merx concept. No authentication required.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Topic: energy, bandwidth, staking, delegation, sun_units, burn_vs_rent, merx_routing, provider_types',
      },
    },
    required: ['topic'],
  },
  async handler(input) {
    const topic = String(input.topic).toLowerCase().replace(/[\s-]/g, '_')
    const text = getConcept(topic)
    if (!text) {
      return textResult(`Unknown topic: "${input.topic}". Available: ${listTopics().join(', ')}`)
    }
    return textResult(`${topic.replace(/_/g, ' ').toUpperCase()}\n\n${text}`)
  },
}

// --- suggest_duration ---

const USE_CASE_MAP: Record<string, { label: string; minSec: number; maxSec: number }> = {
  single_transfer:   { label: 'Single transfer',   minSec: 0,       maxSec: 600 },
  batch_transfers:   { label: 'Batch transfers',   minSec: 3600,    maxSec: 3600 },
  dapp_session:      { label: 'dApp session',      minSec: 3600,    maxSec: 21600 },
  daily_operations:  { label: 'Daily operations',  minSec: 86400,   maxSec: 86400 },
  weekly_operations: { label: 'Weekly operations',  minSec: 604800,  maxSec: 604800 },
  monthly_budget:    { label: 'Monthly budget',     minSec: 2592000, maxSec: 2592000 },
}

function formatSuggestion(
  label: string,
  best: { duration_sec: number; price_sun: number } | null,
  table: string,
  txCount?: number,
): string {
  const lines = [`Duration Recommendation: ${label}`]
  if (best) {
    lines.push(`  Recommended: ${formatSec(best.duration_sec)} at ${best.price_sun} SUN/unit`)
    if (txCount && txCount > 0) {
      const cost = sunToTrx(best.price_sun * 65000 * txCount)
      lines.push(`  Estimated cost for ${formatNumber(txCount)} TRC20 transfers: ${cost} TRX`)
    }
  } else {
    lines.push('  No matching duration found.')
  }
  lines.push('', 'All available durations (best price each):', table)
  return lines.join('\n')
}

const suggestDurationTool: McpTool = {
  name: 'suggest_duration',
  description: 'Recommend a rental duration based on your use case. No authentication required.',
  inputSchema: {
    type: 'object',
    properties: {
      use_case: {
        type: 'string',
        enum: Object.keys(USE_CASE_MAP),
        description: 'Your intended use case.',
      },
      transaction_count: {
        type: 'number',
        description: 'Expected number of transactions (optional).',
      },
    },
    required: ['use_case'],
  },
  async handler(input) {
    const uc = USE_CASE_MAP[input.use_case as string]
    if (!uc) return errorResult(`Unknown use case. Options: ${Object.keys(USE_CASE_MAP).join(', ')}`)
    try {
      const data = (await publicGet('/api/v1/prices')) as ProviderPrice[]
      const durations = collectBestDurations(data)
      const best = pickBestDuration(durations, uc.minSec, uc.maxSec)
      const table = buildDurationTable(durations)
      return textResult(formatSuggestion(uc.label, best, table, input.transaction_count as number | undefined))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

// --- calculate_savings ---

const ENERGY_PER_OP: Record<string, number> = {
  trc20_transfer: 65000,
  trc20_approve:  32000,
  trx_transfer:   0,
}
const BURN_RATE_SUN = 420

const calculateSavingsTool: McpTool = {
  name: 'calculate_savings',
  description: 'Calculate savings from renting energy vs burning TRX. No authentication required.',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['trc20_transfer', 'trc20_approve', 'trx_transfer'],
        description: 'Operation type. Default: trc20_transfer.',
      },
      transaction_count: {
        type: 'number',
        description: 'Number of transactions. Default: 1.',
      },
    },
  },
  async handler(input) {
    const op = (input.operation as string) ?? 'trc20_transfer'
    const count = Math.max(1, Number(input.transaction_count) || 1)
    const energy = ENERGY_PER_OP[op]
    if (energy === undefined) return errorResult(`Unknown operation: ${op}`)
    if (energy === 0) return textResult('TRX transfers use only bandwidth. No energy rental needed.')
    try {
      const est = (await publicPost('/api/v1/estimate', {
        operation: op,
      })) as Record<string, unknown>
      const rentTrx = parseFloat((est.total_rental_trx as string) ?? '0')
      const rentSun = Math.round(rentTrx * 1_000_000)
      return textResult(formatSavingsReport(op, count, energy, rentSun, energy * BURN_RATE_SUN))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

// --- list_providers ---

function formatProviderRow(p: ProviderPrice): string {
  const name = p.provider.padEnd(14)
  const type = (p.is_market ? 'P2P' : 'Fixed').padEnd(6)
  const dur = (p.energy_prices.length > 0
    ? p.energy_prices.map(e => formatSec(e.duration_sec)).join(', ')
    : '-'
  ).padEnd(24)
  const bw = (p.bandwidth_prices.length > 0 ? 'Yes' : 'No').padEnd(4)
  return `  ${name} ${type} ${dur} ${bw} ${formatNumber(p.available_energy)}`
}

const listProvidersTool: McpTool = {
  name: 'list_providers',
  description: 'List all Merx providers with types, durations, and availability. No authentication required.',
  inputSchema: { type: 'object', properties: {} },
  async handler() {
    try {
      const data = (await publicGet('/api/v1/prices')) as ProviderPrice[]
      if (!data || data.length === 0) return textResult('No providers currently available.')
      const hdr = `  ${'Provider'.padEnd(14)} ${'Type'.padEnd(6)} ${'Energy Durations'.padEnd(24)} ${'BW'.padEnd(4)} Available`
      const sep = '  ' + '-'.repeat(60)
      return textResult(['Merx Providers', hdr, sep, ...data.map(formatProviderRow)].join('\n'))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

// --- Export ---

export const convenienceTools: McpTool[] = [
  explainConceptTool,
  suggestDurationTool,
  calculateSavingsTool,
  listProvidersTool,
]
