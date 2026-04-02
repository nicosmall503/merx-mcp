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
  description: 'Get current energy and bandwidth prices from all Merx providers. No auth required.',
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
        description: 'Filter by duration in seconds.',
      },
    },
  },
  async handler(input) {
    try {
      const qs = buildQueryString({
        resource: input.resource as string | undefined,
        duration: input.duration != null ? String(input.duration) : undefined,
      })
      const data = await publicGet(`/api/v1/prices${qs}`) as ProviderPrice[]
      return textResult(formatPriceTable(data, input.resource as string | undefined))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const getBestPrice: McpTool = {
  name: 'get_best_price',
  description: 'Find the cheapest provider for a given resource and amount. No auth required.',
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
      const data = await publicGet(`/api/v1/prices/analysis${qs}`) as { energy: PriceAnalysis; bandwidth: PriceAnalysis }
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
