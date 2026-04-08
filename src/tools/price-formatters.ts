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

// True minimum price across all duration tiers (the array order is duration-based, not price-based)
function getMinPrice(p: ProviderPrice, resource?: string): number {
  const pool: number[] = []
  if (!resource || resource === 'ENERGY') {
    for (const pp of p.energy_prices) pool.push(pp.price_sun)
  }
  if (!resource || resource === 'BANDWIDTH') {
    for (const pp of p.bandwidth_prices) pool.push(pp.price_sun)
  }
  return pool.length > 0 ? Math.min(...pool) : Infinity
}

function priceRange(prices: PricePoint[]): { min: number; max: number } | null {
  if (!prices || prices.length === 0) return null
  let min = Infinity
  let max = -Infinity
  for (const p of prices) {
    if (p.price_sun < min) min = p.price_sun
    if (p.price_sun > max) max = p.price_sun
  }
  return { min, max }
}

function formatProviderTiers(prices: PricePoint[]): string[] {
  // Show all tiers sorted by duration (short → long), with the min-price tier marked
  if (!prices || prices.length === 0) return []
  const min = Math.min(...prices.map(p => p.price_sun))
  const sorted = [...prices].sort((a, b) => a.duration_sec - b.duration_sec)
  return sorted.map(p => {
    const marker = p.price_sun === min ? ' ←best' : ''
    return `      ${fmtDur(p.duration_sec).padStart(8)}: ${String(p.price_sun).padStart(4)} SUN${marker}`
  })
}

export function formatPriceTable(providers: ProviderPrice[], resource?: string): string {
  if (!providers || providers.length === 0) return 'No prices available.'
  const sorted = [...providers].sort((a, b) => getMinPrice(a, resource) - getMinPrice(b, resource))

  const blocks: string[] = []
  blocks.push('Providers sorted by best (minimum) price across all duration tiers.')
  blocks.push('')

  for (const p of sorted) {
    const type = p.is_market ? 'P2P Market' : 'Fixed'
    const lines: string[] = [`[${p.provider}]  ${type}`]

    if (!resource || resource === 'ENERGY') {
      const r = priceRange(p.energy_prices)
      if (r) {
        const rangeStr = r.min === r.max ? `${r.min} SUN` : `${r.min}–${r.max} SUN`
        lines.push(`  Energy:    ${rangeStr}  (supply: ${formatNumber(p.available_energy)})`)
        lines.push(...formatProviderTiers(p.energy_prices))
      }
    }
    if (!resource || resource === 'BANDWIDTH') {
      const r = priceRange(p.bandwidth_prices)
      if (r) {
        const rangeStr = r.min === r.max ? `${r.min} SUN` : `${r.min}–${r.max} SUN`
        lines.push(`  Bandwidth: ${rangeStr}  (supply: ${formatNumber(p.available_bandwidth)})`)
        lines.push(...formatProviderTiers(p.bandwidth_prices))
      }
    }

    blocks.push(lines.join('\n'))
  }

  return blocks.join('\n\n')
}

export function formatBestPrice(data: Record<string, unknown>, amount?: number): string {
  const lines = [`Best provider: ${data.provider}`, `Price: ${data.price_sun} SUN/unit`]
  if (amount && data.price_sun) {
    lines.push(`Cost for ${formatNumber(amount)} units: ${sunToTrx(Number(data.price_sun) * amount)} TRX`)
  }
  if (data.available) lines.push(`Available: ${formatNumber(Number(data.available))}`)
  return lines.join('\n')
}

export function formatAnalysis(data: { energy?: PriceAnalysis; bandwidth?: PriceAnalysis }): string {
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

  // Backend returns up to 1000 rows ordered DESC by polled_at. For an LLM-readable
  // text response we want a digestible summary, not 1000 lines.
  // Strategy:
  //   1. Group by (provider, resource_type)
  //   2. Per group: down-sample to ~12 evenly-spaced points across the time window
  //   3. Show min/max/avg per group + the down-sampled trend
  type Group = { key: string; provider: string; resource: string; rows: PriceHistoryEntry[] }
  const groups = new Map<string, Group>()
  for (const e of entries) {
    const key = `${e.provider}::${e.resource_type}`
    if (!groups.has(key)) groups.set(key, { key, provider: e.provider, resource: e.resource_type, rows: [] })
    groups.get(key)!.rows.push(e)
  }

  const sections: string[] = []
  const totalRows = entries.length
  const oldest = entries[entries.length - 1]?.polled_at
  const newest = entries[0]?.polled_at
  sections.push(`Price history: ${totalRows} snapshots from ${oldest?.slice(0, 16) ?? '?'} to ${newest?.slice(0, 16) ?? '?'}`)
  sections.push(`Groups: ${groups.size}`)
  sections.push(`Note: history stores one representative price per provider per snapshot — it does NOT differentiate between duration tiers (5min/1h/1d/30d). For full per-tier pricing use get_prices.`)
  sections.push('')

  for (const g of [...groups.values()].sort((a, b) => a.key.localeCompare(b.key))) {
    const prices = g.rows.map(r => Number(r.price_sun)).filter(n => Number.isFinite(n))
    if (prices.length === 0) continue
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = prices.reduce((s, n) => s + n, 0) / prices.length
    sections.push(`[${g.provider} / ${g.resource}]  ${g.rows.length} snapshots`)
    sections.push(`  range: ${min}–${max} SUN  avg: ${avg.toFixed(1)} SUN`)

    // Down-sample to 12 evenly-spaced points (rows already sorted DESC newest-first)
    const reversed = [...g.rows].reverse() // oldest-first for chronological display
    const targetPoints = Math.min(12, reversed.length)
    const samples: PriceHistoryEntry[] = []
    if (reversed.length <= targetPoints) {
      samples.push(...reversed)
    } else {
      for (let i = 0; i < targetPoints; i++) {
        const idx = Math.round((i * (reversed.length - 1)) / (targetPoints - 1))
        samples.push(reversed[idx])
      }
    }
    sections.push('  trend:')
    for (const s of samples) {
      // Full ISO date YYYY-MM-DD HH:MM, not just HH:MM:SS
      const ts = s.polled_at?.replace('T', ' ').slice(0, 16) ?? '?'
      sections.push(`    ${ts}  ${s.price_sun} SUN`)
    }
    sections.push('')
  }

  return sections.join('\n').trimEnd()
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
  // Sort by best (lowest) per-unit price across the requested resource — same logic as get_prices.
  const sorted = [...providers].sort((a, b) => getMinPrice(a, resource) - getMinPrice(b, resource))
  return sorted.map(p => formatProviderBlock(p, resource)).filter(Boolean).join('\n\n')
}
