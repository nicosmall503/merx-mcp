/**
 * Shared pricing types and helpers for convenience tools.
 */
import { sunToTrx, formatNumber } from './formatter.js'

export interface PricePoint {
  duration_sec: number
  price_sun: number
}

export interface ProviderPrice {
  provider: string
  is_market: boolean
  energy_prices: PricePoint[]
  bandwidth_prices: PricePoint[]
  available_energy: number
  available_bandwidth: number
}

export function formatSec(sec: number): string {
  if (sec <= 0) return 'flexible'
  if (sec < 3600) return `${sec / 60}m`
  if (sec < 86400) return `${sec / 3600}h`
  return `${sec / 86400}d`
}

export function collectBestDurations(providers: ProviderPrice[]): PricePoint[] {
  const map = new Map<number, number>()
  for (const p of providers) {
    for (const ep of p.energy_prices) {
      const existing = map.get(ep.duration_sec)
      if (!existing || ep.price_sun < existing) {
        map.set(ep.duration_sec, ep.price_sun)
      }
    }
  }
  return Array.from(map.entries())
    .map(([duration_sec, price_sun]) => ({ duration_sec, price_sun }))
    .sort((a, b) => a.duration_sec - b.duration_sec)
}

export function pickBestDuration(
  durations: PricePoint[],
  minSec: number,
  maxSec: number,
): PricePoint | null {
  const candidates = durations.filter(d => d.duration_sec >= minSec)
  if (candidates.length === 0) return durations[durations.length - 1] ?? null
  if (maxSec > 0) {
    const inRange = candidates.filter(d => d.duration_sec <= maxSec)
    if (inRange.length > 0) return inRange[0]
  }
  return candidates[0]
}

export function buildDurationTable(durations: PricePoint[]): string {
  if (durations.length === 0) return '  No durations available.'
  return durations
    .map(d => {
      const dur = formatSec(d.duration_sec).padEnd(6)
      const cost = sunToTrx(d.price_sun * 65000)
      return `  ${dur} ${d.price_sun} SUN/unit (${cost} TRX per USDT transfer)`
    })
    .join('\n')
}

export function formatSavingsReport(
  op: string,
  count: number,
  energyPerTx: number,
  rentPerTxSun: number,
  burnPerTxSun: number,
): string {
  const rentTotal = rentPerTxSun * count
  const burnTotal = burnPerTxSun * count
  const savingSun = burnTotal - rentTotal
  const pct = burnTotal > 0 ? ((savingSun / burnTotal) * 100).toFixed(1) : '0'
  return [
    `Savings Analysis: ${op} x ${formatNumber(count)}`,
    '--------------------------------------------',
    `  Energy per TX:    ${formatNumber(energyPerTx)} units`,
    '',
    '  Per transaction:',
    `    Rent cost:      ${sunToTrx(rentPerTxSun)} TRX`,
    `    Burn cost:      ${sunToTrx(burnPerTxSun)} TRX`,
    '',
    `  Total (${formatNumber(count)} TX):`,
    `    Rent cost:      ${sunToTrx(rentTotal)} TRX`,
    `    Burn cost:      ${sunToTrx(burnTotal)} TRX`,
    `    Savings:        ${sunToTrx(savingSun)} TRX (${pct}%)`,
  ].join('\n')
}
