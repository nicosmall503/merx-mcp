import type { McpResource, McpResourceTemplate } from '../types.js'
import { staticHandlers, templateRoutes } from './handlers.js'

export const STATIC_RESOURCES: McpResource[] = [
  { uri: 'merx://prices/energy', name: 'Energy Prices', description: 'Energy prices from all providers, sorted cheapest first', mimeType: 'application/json' },
  { uri: 'merx://prices/bandwidth', name: 'Bandwidth Prices', description: 'Bandwidth prices from providers that offer it', mimeType: 'application/json' },
  { uri: 'merx://prices/best', name: 'Best Prices', description: 'Best energy + bandwidth price with USDT transfer cost', mimeType: 'application/json' },
  { uri: 'merx://market/analysis', name: 'Market Analysis', description: 'Price trends, averages, and buy/wait recommendation', mimeType: 'application/json' },
  { uri: 'merx://market/providers', name: 'Provider List', description: 'All providers with type, durations, resources, status', mimeType: 'application/json' },
  { uri: 'merx://market/providers/status', name: 'Provider Status', description: 'Provider health: online/offline, available supply', mimeType: 'application/json' },
  { uri: 'merx://account/balance', name: 'Account Balance', description: 'Merx balance: TRX available, locked, USDT', mimeType: 'application/json' },
  { uri: 'merx://account/orders/recent', name: 'Recent Orders', description: 'Last 10 orders with status and cost', mimeType: 'application/json' },
  { uri: 'merx://account/stats', name: 'Account Stats', description: '30-day stats: total spent, saved, order count', mimeType: 'application/json' },
  { uri: 'merx://account/auto-deposit', name: 'Auto-Deposit Config', description: 'Auto-deposit threshold and amount configuration', mimeType: 'application/json' },
  { uri: 'merx://network/parameters', name: 'Chain Parameters', description: 'TRON network parameters: burn prices, energy limit', mimeType: 'application/json' },
  { uri: 'merx://network/trx-price', name: 'TRX Price', description: 'Current TRX price in USD', mimeType: 'application/json' },
  { uri: 'merx://reference/tokens', name: 'Token Registry', description: 'Well-known TRC20 tokens: addresses, decimals', mimeType: 'application/json' },
  { uri: 'merx://standing-orders/active', name: 'Active Standing Orders', description: 'Active standing orders with trigger status', mimeType: 'application/json' },
]

export const RESOURCE_TEMPLATES: McpResourceTemplate[] = [
  { uriTemplate: 'merx://address/{address}/overview', name: 'Address Overview', description: 'Full address state: TRX, tokens, energy, bandwidth', mimeType: 'application/json' },
  { uriTemplate: 'merx://address/{address}/resources', name: 'Address Resources', description: 'Energy + bandwidth state', mimeType: 'application/json' },
  { uriTemplate: 'merx://address/{address}/transactions', name: 'Address Transactions', description: 'Recent transactions', mimeType: 'application/json' },
  { uriTemplate: 'merx://address/{address}/delegations', name: 'Address Delegations', description: 'Active delegations with expiry', mimeType: 'application/json' },
  { uriTemplate: 'merx://token/{token}/info', name: 'Token Info', description: 'Token metadata + price', mimeType: 'application/json' },
  { uriTemplate: 'merx://order/{order_id}/status', name: 'Order Status', description: 'Order details with fills', mimeType: 'application/json' },
  { uriTemplate: 'merx://standing-order/{id}/status', name: 'Standing Order Status', description: 'Standing order details and execution history', mimeType: 'application/json' },
]

function tryStaticHandler(uri: string): (() => Promise<unknown>) | null {
  return staticHandlers[uri] ?? null
}

function tryTemplateHandler(uri: string): (() => Promise<unknown>) | null {
  for (const route of templateRoutes) {
    const match = uri.match(route.pattern)
    if (match) return () => route.handler(match)
  }
  return null
}

export async function readResource(
  uri: string
): Promise<{ uri: string; mimeType: string; text: string }> {
  const handler = tryStaticHandler(uri) ?? tryTemplateHandler(uri)
  if (!handler) {
    throw new Error(`Unknown resource URI: ${uri}`)
  }

  try {
    const data = await handler()
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ error: message }),
    }
  }
}
