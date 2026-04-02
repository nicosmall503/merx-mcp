import { publicGet, publicPost, authGet, hasApiKey } from '../lib/api.js'
import { KNOWN_TOKENS } from '../lib/known-tokens.js'

type Handler = () => Promise<unknown>

function requireAuth(fn: () => Promise<unknown>): Handler {
  return async () => {
    if (!hasApiKey()) {
      return { error: 'MERX_API_KEY not configured. Set it to access account data.' }
    }
    return fn()
  }
}

async function fetchEnergyPrices(): Promise<unknown> {
  const data = await publicGet('/api/v1/prices') as Array<Record<string, unknown>>
  return data.filter((p) => {
    const ep = p.energy_prices as unknown[] | undefined
    return ep && ep.length > 0
  })
}

async function fetchBandwidthPrices(): Promise<unknown> {
  const data = await publicGet('/api/v1/prices') as Array<Record<string, unknown>>
  return data.filter((p) => {
    const bp = p.bandwidth_prices as unknown[] | undefined
    return bp && bp.length > 0
  })
}

async function fetchBestPrices(): Promise<unknown> {
  const energy = await publicGet('/api/v1/prices/best?resource=ENERGY')
  let bandwidth = null
  try {
    bandwidth = await publicGet('/api/v1/prices/best?resource=BANDWIDTH')
  } catch { /* bandwidth may not be available */ }
  return { energy, bandwidth }
}

async function fetchMarketAnalysis(): Promise<unknown> {
  return publicGet('/api/v1/prices/analysis')
}

async function fetchProviders(): Promise<unknown> {
  return publicGet('/api/v1/prices')
}

async function fetchProviderStatus(): Promise<unknown> {
  const data = await publicGet('/api/v1/prices') as Array<Record<string, unknown>>
  return data.map((p) => ({
    provider: p.provider,
    status: p.status ?? 'unknown',
    available: p.available ?? p.availableSupply ?? null,
  }))
}

async function fetchBalance(): Promise<unknown> {
  return authGet('/api/v1/balance')
}

async function fetchRecentOrders(): Promise<unknown> {
  return authGet('/api/v1/orders?limit=10')
}

async function fetchAccountStats(): Promise<unknown> {
  return authGet('/api/v1/history/summary')
}

async function fetchAutoDepositConfig(): Promise<unknown> {
  return {
    note: 'Auto-deposit configuration is session-specific.',
    configured: false,
    threshold: null,
    amount: null,
  }
}

async function fetchChainParameters(): Promise<unknown> {
  return publicGet('/api/v1/chain/parameters')
}

async function fetchTrxPrice(): Promise<unknown> {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd'
  const res = await fetch(url)
  const body = await res.json() as Record<string, Record<string, number>>
  return { trx_usd: body.tron?.usd ?? null, source: 'coingecko' }
}

async function fetchTokenRegistry(): Promise<unknown> {
  return Object.entries(KNOWN_TOKENS).map(([symbol, info]) => ({
    symbol,
    ...info,
  }))
}

async function fetchStandingOrders(): Promise<unknown> {
  return authGet('/api/v1/standing-orders?status=ACTIVE')
}

export const staticHandlers: Record<string, Handler> = {
  'merx://prices/energy': fetchEnergyPrices,
  'merx://prices/bandwidth': fetchBandwidthPrices,
  'merx://prices/best': fetchBestPrices,
  'merx://market/analysis': fetchMarketAnalysis,
  'merx://market/providers': fetchProviders,
  'merx://market/providers/status': fetchProviderStatus,
  'merx://account/balance': requireAuth(fetchBalance),
  'merx://account/orders/recent': requireAuth(fetchRecentOrders),
  'merx://account/stats': requireAuth(fetchAccountStats),
  'merx://account/auto-deposit': fetchAutoDepositConfig,
  'merx://network/parameters': fetchChainParameters,
  'merx://network/trx-price': fetchTrxPrice,
  'merx://reference/tokens': fetchTokenRegistry,
  'merx://standing-orders/active': requireAuth(fetchStandingOrders),
}

interface TemplateRoute {
  pattern: RegExp
  handler: (match: RegExpMatchArray) => Promise<unknown>
}

async function fetchAddressOverview(addr: string): Promise<unknown> {
  return publicGet(`/api/v1/chain/account/${addr}`)
}

async function fetchAddressResources(addr: string): Promise<unknown> {
  return publicGet(`/api/v1/chain/resources/${addr}`)
}

async function fetchAddressTransactions(addr: string): Promise<unknown> {
  return publicGet(`/api/v1/chain/history/${addr}`)
}

async function fetchAddressDelegations(addr: string): Promise<unknown> {
  const data = await publicGet(`/api/v1/chain/account/${addr}`) as Record<string, unknown>
  return { address: addr, delegations: data.delegations ?? data.delegatedResource ?? [] }
}

async function fetchTokenInfo(token: string): Promise<unknown> {
  const name = await publicPost('/api/v1/chain/read-contract', {
    contract_address: token,
    function_selector: 'name()',
  })
  const symbol = await publicPost('/api/v1/chain/read-contract', {
    contract_address: token,
    function_selector: 'symbol()',
  })
  const decimals = await publicPost('/api/v1/chain/read-contract', {
    contract_address: token,
    function_selector: 'decimals()',
  })
  return { address: token, name, symbol, decimals }
}

async function fetchOrderStatus(id: string): Promise<unknown> {
  return authGet(`/api/v1/orders/${id}`)
}

async function fetchStandingOrderStatus(id: string): Promise<unknown> {
  return authGet(`/api/v1/standing-orders/${id}`)
}

export const templateRoutes: TemplateRoute[] = [
  {
    pattern: /^merx:\/\/address\/([^/]+)\/overview$/,
    handler: (m) => fetchAddressOverview(m[1]),
  },
  {
    pattern: /^merx:\/\/address\/([^/]+)\/resources$/,
    handler: (m) => fetchAddressResources(m[1]),
  },
  {
    pattern: /^merx:\/\/address\/([^/]+)\/transactions$/,
    handler: (m) => fetchAddressTransactions(m[1]),
  },
  {
    pattern: /^merx:\/\/address\/([^/]+)\/delegations$/,
    handler: (m) => fetchAddressDelegations(m[1]),
  },
  {
    pattern: /^merx:\/\/token\/([^/]+)\/info$/,
    handler: (m) => fetchTokenInfo(m[1]),
  },
  {
    pattern: /^merx:\/\/order\/([^/]+)\/status$/,
    handler: (m) => requireAuth(() => fetchOrderStatus(m[1]))(),
  },
  {
    pattern: /^merx:\/\/standing-order\/([^/]+)\/status$/,
    handler: (m) => requireAuth(() => fetchStandingOrderStatus(m[1]))(),
  },
]
