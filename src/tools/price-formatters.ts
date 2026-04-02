import { formatNumber, sunToTrx } from '../lib/formatter.js'

export interface PricePoint { duration_sec: number; price_sun: number }

export interface ProviderPrice {
  provider: string
  is_market: boolean
  energy_prices: PricePoint[]
  bandwidth_prices: PricePoint[]
  available_energy: number
  available_bandwidth: number
}

// Matches real API: GET /api/v1/prices/analysis
export interface PriceAnalysis {
  current_best: { provider: string; price_sun: number; duration_sec: number } | null
  average_24h: number
  average_7d: number
  percentile: number
  trend: string
  recommendation: string
  explanation: string
}

// Matches real API: GET /api/v1/prices/history
export interface PriceHistoryEntry {
  provider: string
  resource_type: string
  price_sun: number
  available: string | number
  is_online: boolean
  polled_at: string
}

export function buildQueryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, v)
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

function fmtDur(sec: number): string {
  if (sec <= 0) return 'flexible'
  if (sec < 3600) return `${sec / 60}m`
  if (sec < 86400) return `${sec / 3600}h`
  return `${sec / 86400}d`
}

function getBestPrice(p: ProviderPrice, resource?: string): number {
  if (resource === 'BANDWIDTH' && p.bandwidth_prices.length > 0) {
    return p.bandwidth_prices[0].price_sun
  }
  if (p.energy_prices.length > 0) return p.energy_prices[0].price_sun
  if (p.bandwidth_prices.length > 0) return p.bandwidth_prices[0].price_sun
  return Infinity
}

function formatPriceRow(p: ProviderPrice, resource?: string): string {
  const type = p.is_market ? 'P2P' : 'Fixed'
  const parts: string[] = []
  if (!resource || resource === 'ENERGY') {
    if (p.energy_prices.length > 0) {
      const durs = p.energy_prices.map(pp => fmtDur(pp.duration_sec)).join(', ')
      parts.push(`${p.provider} | ${type} | Energy | ${p.energy_prices[0].price_sun} SUN | ${formatNumber(p.available_energy)} | ${durs}`)
    }
  }
  if (!resource || resource === 'BANDWIDTH') {
    if (p.bandwidth_prices.length > 0) {
      const durs = p.bandwidth_prices.map(pp => fmtDur(pp.duration_sec)).join(', ')
      parts.push(`${p.provider} | ${type} | Bandwidth | ${p.bandwidth_prices[0].price_sun} SUN | ${formatNumber(p.available_bandwidth)} | ${durs}`)
    }
  }
  return parts.join('\n')
}

export function formatPriceTable(providers: ProviderPrice[], resource?: string): string {
  const header = 'Provider | Type | Resource | Best Price | Available | Durations'
  const sep = '---------|------|----------|------------|-----------|----------'
  const sorted = [...providers].sort((a, b) => getBestPrice(a, resource) - getBestPrice(b, resource))
  const rows = sorted.map(p => formatPriceRow(p, resource)).filter(Boolean)
  if (rows.length === 0) return 'No prices available.'
  return [header, sep, ...rows].join('\n')
}

export function formatBestPrice(data: Record<string, unknown>, amount?: number): string {
  const lines = [`Best provider: ${data.provider}`, `Price: ${data.price_sun} SUN/unit`]
  if (amount && data.price_sun) {
    lines.push(`Cost for ${formatNumber(amount)} units: ${sunToTrx(Number(data.price_sun) * amount)} TRX`)
  }
  if (data.available) lines.push(`Available: ${formatNumber(Number(data.available))}`)
  return lines.join('\n')
}

export function formatAnalysis(data: { energy: PriceAnalysis; bandwidth: PriceAnalysis }): string {
  const parts: string[] = []
  for (const [name, a] of Object.entries(data)) {
    if (!a) continue
    const best = a.current_best
      ? `${a.current_best.provider} at ${a.current_best.price_sun} SUN (${fmtDur(a.current_best.duration_sec)})`
      : 'no data'
    parts.push([
      `--- ${name.toUpperCase()} ---`,
      `Current best: ${best}`,
      `24h average:  ${a.average_24h} SUN`,
      `7d average:   ${a.average_7d} SUN`,
      `Percentile:   ${a.percentile}%`,
      `Trend:        ${a.trend}`,
      `Recommendation: ${a.recommendation}`,
      a.explanation,
    ].join('\n'))
  }
  return parts.join('\n\n') || 'No analysis data available.'
}

export function formatHistory(entries: PriceHistoryEntry[]): string {
  if (!entries || entries.length === 0) return 'No history data available.'
  const header = 'Time | Provider | Resource | Price (SUN) | Available'
  const sep = '-----|----------|----------|-------------|----------'
  const rows = entries.slice(0, 10).map(e => {
    const time = e.polled_at?.slice(11, 19) ?? '?'
    return `${time} | ${e.provider} | ${e.resource_type} | ${e.price_sun} | ${e.available}`
  })
  return [header, sep, ...rows].join('\n')
}

function formatProviderBlock(p: ProviderPrice, resource?: string): string {
  const type = p.is_market ? 'P2P Market' : 'Fixed'
  const parts = [`[${p.provider}] (${type})`]
  if (!resource || resource === 'ENERGY') {
    parts.push(`  Energy supply: ${formatNumber(p.available_energy)}`)
    for (const pp of p.energy_prices) {
      parts.push(`    ${fmtDur(pp.duration_sec)}: ${pp.price_sun} SUN/unit`)
    }
  }
  if (!resource || resource === 'BANDWIDTH') {
    parts.push(`  Bandwidth supply: ${formatNumber(p.available_bandwidth)}`)
    for (const pp of p.bandwidth_prices) {
      parts.push(`    ${fmtDur(pp.duration_sec)}: ${pp.price_sun} SUN/unit`)
    }
  }
  return parts.join('\n')
}

export function formatComparison(providers: ProviderPrice[], resource?: string): string {
  if (!providers || providers.length === 0) return 'No providers available.'
  return providers.map(p => formatProviderBlock(p, resource)).filter(Boolean).join('\n\n')
}
