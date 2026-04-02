import { sunToTrx, formatDuration, formatNumber } from '../lib/formatter.js'

export interface Order {
  id: string
  status: string
  resource_type?: string
  order_type?: string
  amount?: number
  duration_sec?: number
  target_address?: string
  total_cost_sun?: number | string | null
  total_fee_sun?: number | string | null
  created_at?: string
  filled_at?: string | null
  fills?: Fill[]
}

export interface Fill {
  provider: string
  amount: number
  price_sun: number
  cost_sun: number
  tx_id?: string
  status?: string
  verified?: boolean
  tronscan_url?: string
}

export interface EnsureResult {
  action: string
  energy?: { current?: number; deficit?: number; surplus?: number; order_id?: string; cost_trx?: number }
  bandwidth?: { current?: number; deficit?: number; surplus?: number; order_id?: string; cost_trx?: number }
  total_cost_trx?: number
}

function safe(v: unknown, fallback = 'N/A'): string {
  if (v == null) return fallback
  return String(v)
}

export function formatOrderSummary(o: Order): string {
  const cost = o.total_cost_sun ? sunToTrx(Number(o.total_cost_sun)) : 'pending'
  const dur = o.duration_sec ? formatDuration(o.duration_sec) : 'N/A'
  const amt = o.amount ? formatNumber(o.amount) : 'N/A'
  return [
    `Order: ${o.id}`,
    `Status: ${o.status}`,
    o.resource_type ? `Resource: ${o.resource_type} | Amount: ${amt}` : null,
    o.duration_sec ? `Duration: ${dur} | Cost: ${cost} TRX` : `Cost: ${cost} TRX`,
    o.target_address ? `Target: ${o.target_address}` : null,
    `Created: ${safe(o.created_at)}`,
  ].filter(Boolean).join('\n')
}

function formatFills(fills: Fill[]): string {
  if (!fills || fills.length === 0) return ''
  const lines = ['', `Fills (${fills.length}):`]
  for (const f of fills) {
    const cost = sunToTrx(f.cost_sun)
    const status = f.verified ? 'verified' : (f.status ?? 'pending')
    lines.push(`  ${f.provider}: ${formatNumber(f.amount)} @ ${f.price_sun} SUN = ${cost} TRX [${status}]`)
    if (f.tx_id) lines.push(`    TX: ${f.tx_id}`)
  }
  return lines.join('\n')
}

export function formatOrderDetail(o: Order): string {
  return formatOrderSummary(o) + formatFills(o.fills ?? [])
}

function formatOrderRow(o: Order): string {
  const id = o.id.slice(0, 8)
  const cost = o.total_cost_sun ? sunToTrx(Number(o.total_cost_sun)) : '-'
  const dur = o.duration_sec ? formatDuration(o.duration_sec) : '-'
  const amt = o.amount ? formatNumber(o.amount) : '-'
  return `${id}.. | ${o.status} | ${safe(o.resource_type, '-')} | ${amt} | ${dur} | ${cost}`
}

export function formatOrderTable(data: unknown): string {
  // API returns { orders: [...], total: N }
  let orders: Order[]
  if (Array.isArray(data)) {
    orders = data
  } else if (data && typeof data === 'object' && 'orders' in data) {
    orders = (data as { orders: Order[] }).orders ?? []
  } else {
    return 'No orders found.'
  }
  if (orders.length === 0) return 'No orders found.'
  const header = 'ID | Status | Resource | Amount | Duration | Cost (TRX)'
  const sep = '---|--------|----------|--------|----------|----------'
  const rows = orders.map(formatOrderRow)
  return [header, sep, ...rows].join('\n')
}

export function formatEnsureResult(data: EnsureResult): string {
  if (data.action === 'no_action_needed') {
    return 'Resources sufficient. No purchase needed.'
  }
  const lines = ['--- Ensure Resources ---', '']
  if (data.energy) {
    lines.push(`Energy: current ${data.energy.current ?? 0}, deficit ${data.energy.deficit ?? 0}`)
    if (data.energy.order_id) {
      const cost = typeof data.energy.cost_trx === 'number' ? data.energy.cost_trx.toFixed(4) : '?'
      lines.push(`  Order: ${data.energy.order_id} (${cost} TRX)`)
    }
  }
  if (data.bandwidth) {
    lines.push(`Bandwidth: current ${data.bandwidth.current ?? 0}, deficit ${data.bandwidth.deficit ?? 0}`)
    if (data.bandwidth.order_id) {
      const cost = typeof data.bandwidth.cost_trx === 'number' ? data.bandwidth.cost_trx.toFixed(4) : '?'
      lines.push(`  Order: ${data.bandwidth.order_id} (${cost} TRX)`)
    }
  }
  if (data.total_cost_trx != null) lines.push('', `Total cost: ${Number(data.total_cost_trx).toFixed(4)} TRX`)
  return lines.join('\n')
}
