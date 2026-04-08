import { sunToTrx, formatNumber } from '../lib/formatter.js'

export interface StandingOrder {
  id: string
  trigger_type: string
  trigger_params: Record<string, unknown>
  action_type: string
  action_params: Record<string, unknown>
  budget_sun: number
  spent_sun: number
  max_executions: number
  executions: number
  status: string
  expires_at?: string
  created_at: string
}

export interface Monitor {
  id: string
  monitor_type: string
  target_address?: string
  params: Record<string, unknown>
  notification: Record<string, unknown>
  status: string
  created_at: string
}

// Resolve which resource a standing order watches.
// 1. trigger_params.resource — explicit, modern format
// 2. action_params.resource_type — explicit, alternative location
// 3. action_params.{energy_target,energy_minimum,...} — heuristic for legacy ensure_resources
// 4. action_params.{bandwidth_target,bandwidth_minimum,...} — same for bandwidth
// 5. fall back to ENERGY (the overwhelmingly common case on TRON)
function resolveResource(order: StandingOrder): string {
  const p = order.trigger_params
  if (typeof p.resource === 'string') return p.resource
  const ap = order.action_params ?? {}
  if (typeof ap.resource_type === 'string') return ap.resource_type
  const apKeys = Object.keys(ap).map(k => k.toLowerCase())
  if (apKeys.some(k => k.startsWith('energy'))) return 'ENERGY'
  if (apKeys.some(k => k.startsWith('bandwidth'))) return 'BANDWIDTH'
  return 'ENERGY'
}

export function describeTrigger(order: StandingOrder): string {
  const p = order.trigger_params
  const res = resolveResource(order)
  // For price triggers, threshold_sun is a per-unit price (e.g. 20 SUN per energy unit).
  // It is NOT a TRX total — do not convert via sunToTrx (that would show 0.0000 TRX
  // because per-unit prices are tiny in absolute SUN).
  const priceThreshold = p.threshold_sun != null ? `${p.threshold_sun} SUN/unit` : '?'
  // For balance triggers, the threshold IS a total amount, so TRX conversion makes sense.
  const balanceThreshold = p.threshold_sun != null ? `${sunToTrx(p.threshold_sun as number)} TRX` : '?'
  switch (order.trigger_type) {
    case 'price_below': return `${res} price < ${priceThreshold}`
    case 'price_above': return `${res} price > ${priceThreshold}`
    case 'schedule': return `schedule: ${p.cron ?? p.interval ?? '?'}`
    case 'balance_below': return `${res} balance < ${balanceThreshold}`
    case 'provider_available': return `provider ${p.provider ?? '?'} available`
    default: return order.trigger_type
  }
}

export function describeAction(order: StandingOrder): string {
  const p = order.action_params
  switch (order.action_type) {
    case 'buy_resource':
      return `buy ${formatNumber((p.amount as number) ?? 0)} ${p.resource_type ?? '?'}`
    case 'ensure_resources':
      return `ensure resources for ${p.target_address ?? '?'}`
    case 'notify_only':
      return 'notify only'
    default:
      return order.action_type
  }
}

export function formatStandingOrderDetail(order: StandingOrder): string {
  const budget = sunToTrx(order.budget_sun)
  const spent = sunToTrx(order.spent_sun ?? 0)
  return [
    `Standing Order: ${order.id}`,
    `  Trigger: ${describeTrigger(order)}`,
    `  Action: ${describeAction(order)}`,
    `  Budget: ${spent} / ${budget} TRX`,
    `  Executions: ${order.executions ?? 0} / ${order.max_executions}`,
    `  Status: ${order.status}`,
    order.expires_at ? `  Expires: ${order.expires_at}` : null,
    `  Created: ${order.created_at}`,
  ].filter(Boolean).join('\n')
}

export function formatStandingOrderTable(orders: StandingOrder[]): string {
  if (!orders.length) return 'No standing orders found.'
  // Full UUIDs — agents need them for cancel_standing_order / get_standing_order
  const rows = orders.map(o => {
    const budget = sunToTrx(o.budget_sun)
    const spent = sunToTrx(o.spent_sun ?? 0)
    const execs = `${o.executions ?? 0}/${o.max_executions}`
    return `${o.id} | ${describeTrigger(o)} | ${describeAction(o)} | ${spent}/${budget} TRX | ${execs} | ${o.status}`
  })
  const header = 'Standing Order ID (UUID) | Trigger | Action | Budget (spent/total) | Executions | Status'
  const sep = '-------------------------|---------|--------|----------------------|------------|-------'
  // Hint moved AFTER data so machine consumers can split on the blank line
  return [header, sep, ...rows, '', `(Pass the full UUID to get_standing_order or cancel_standing_order to inspect or remove an order.)`].join('\n')
}

export function formatMonitorDetail(m: Monitor): string {
  return [
    `Monitor: ${m.id}`,
    `  Type: ${m.monitor_type}`,
    m.target_address ? `  Target: ${m.target_address}` : null,
    `  Params: ${JSON.stringify(m.params)}`,
    `  Notify: ${JSON.stringify(m.notification ?? {})}`,
    `  Status: ${m.status}`,
    `  Created: ${m.created_at}`,
  ].filter(Boolean).join('\n')
}

export function formatMonitorTable(monitors: Monitor[]): string {
  if (!monitors.length) return 'No monitors found.'
  // Full UUIDs and full addresses — agents need them for cancel/inspect operations
  const header = 'Monitor ID (UUID) | Type | Target | Status'
  const sep = '------------------|------|--------|-------'
  const rows = monitors.map(m => {
    let target: string
    if (m.target_address) {
      target = m.target_address
    } else if (m.monitor_type === 'price_alert') {
      target = '(market-wide)'
    } else if (m.monitor_type === 'balance_threshold') {
      target = '(own account)'
    } else {
      target = '-'
    }
    return `${m.id} | ${m.monitor_type} | ${target} | ${m.status}`
  })
  return [header, sep, ...rows].join('\n')
}
