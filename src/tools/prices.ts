import { publicGet } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import type { McpTool } from '../types.js'
import {
  buildQueryString,
  formatPriceTable,
  formatBestPrice,
  formatAnalysis,
  formatHistory,
  formatComparison,
} from './price-formatters.js'
import type { ProviderPrice, PriceAnalysis, PriceHistoryEntry } from './price-formatters.js'

const getPrices: McpTool = {
  name: 'get_prices',
  description: 'Get current energy and bandwidth prices from all Merx providers, sorted by best (minimum) price across all duration tiers. Each provider lists ALL its duration tiers (5min/1h/1d/7d/30d etc) — short rentals are usually more expensive per unit than long ones, so always check tier-by-tier. Optionally filter by exact duration in seconds. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'string',
        enum: ['ENERGY', 'BANDWIDTH'],
        description: 'Filter by resource type. Omit for all.',
      },
      duration: {
        type: 'number',
        description: 'Filter to providers offering this exact duration in seconds (e.g. 3600 for 1h, 86400 for 1d, 604800 for 7d, 2592000 for 30d). Omit to see all tiers.',
      },
    },
  },
  async handler(input) {
    try {
      const data = await publicGet('/api/v1/prices') as ProviderPrice[]
      const resource = input.resource as string | undefined
      const duration = input.duration != null ? Number(input.duration) : undefined

      // Client-side duration filter: drop providers/tiers that don't offer the exact duration
      let filtered = data
      if (duration != null) {
        filtered = data
          .map(p => ({
            ...p,
            energy_prices: p.energy_prices.filter(pp => pp.duration_sec === duration),
            bandwidth_prices: p.bandwidth_prices.filter(pp => pp.duration_sec === duration),
          }))
          .filter(p => p.energy_prices.length > 0 || p.bandwidth_prices.length > 0)
      }

      return textResult(formatPriceTable(filtered, resource))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const getBestPrice: McpTool = {
  name: 'get_best_price',
  description: 'Quick lookup of the single cheapest provider for a resource type, with optional minimum amount filter. CAVEAT: this returns a single representative price per provider, not broken down by duration tier — short rentals (5min) and long rentals (30 days) have very different per-unit prices and this tool does not distinguish between them. For an accurate per-tier comparison, use get_prices(duration=N) where N is the exact rental duration in seconds (e.g. 3600 for 1h, 86400 for 1d, 2592000 for 30d). Use get_best_price only when you need the absolute floor price as a quick sanity-check. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'string',
        enum: ['ENERGY', 'BANDWIDTH'],
        description: 'Resource type.',
      },
      amount: {
        type: 'number',
        description: 'Amount of resource units needed.',
      },
    },
    required: ['resource'],
  },
  async handler(input) {
    try {
      const qs = buildQueryString({
        resource: input.resource as string,
        amount: input.amount != null ? String(input.amount) : undefined,
      })
      const data = await publicGet(`/api/v1/prices/best${qs}`) as Record<string, unknown>
      return textResult(formatBestPrice(data, input.amount as number | undefined))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const analyzePrices: McpTool = {
  name: 'analyze_prices',
  description: 'Market price analysis with trends and recommendations. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'string',
        enum: ['ENERGY', 'BANDWIDTH'],
        description: 'Filter by resource type. Omit for all.',
      },
    },
  },
  async handler(input) {
    try {
      const qs = buildQueryString({ resource: input.resource as string | undefined })
      const data = await publicGet(`/api/v1/prices/analysis${qs}`) as { energy?: PriceAnalysis; bandwidth?: PriceAnalysis }
      return textResult(formatAnalysis(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const getPriceHistory: McpTool = {
  name: 'get_price_history',
  description: 'Historical price snapshots. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'string',
        enum: ['ENERGY', 'BANDWIDTH'],
        description: 'Filter by resource type.',
      },
      provider: { type: 'string', description: 'Filter by provider name.' },
      period: {
        type: 'string',
        enum: ['1h', '6h', '24h', '7d', '30d'],
        description: 'Time period (default: 24h).',
      },
    },
  },
  async handler(input) {
    try {
      const qs = buildQueryString({
        resource: input.resource as string | undefined,
        provider: input.provider as string | undefined,
        period: input.period as string | undefined,
      })
      const data = await publicGet(`/api/v1/prices/history${qs}`) as PriceHistoryEntry[]
      return textResult(formatHistory(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const compareProviders: McpTool = {
  name: 'compare_providers',
  description: 'Side-by-side provider comparison with prices and availability. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      resource: {
        type: 'string',
        enum: ['ENERGY', 'BANDWIDTH'],
        description: 'Filter by resource type. Omit for all.',
      },
    },
  },
  async handler(input) {
    try {
      const data = await publicGet('/api/v1/prices') as ProviderPrice[]
      return textResult(formatComparison(data, input.resource as string | undefined))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const pricingTools: McpTool[] = [
  getPrices,
  getBestPrice,
  analyzePrices,
  getPriceHistory,
  compareProviders,
]
