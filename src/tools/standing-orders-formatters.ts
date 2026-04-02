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

export function describeTrigger(order: StandingOrder): string {
  const p = order.trigger_params
  const res = (p.resource as string) ?? ''
  const threshold = p.threshold_sun ? sunToTrx(p.threshold_sun as number) : '?'
  switch (order.trigger_type) {
    case 'price_below': return `${res} price < ${threshold} TRX`
    case 'price_above': return `${res} price > ${threshold} TRX`
    case 'schedule': return `schedule: ${p.cron ?? p.interval ?? '?'}`
    case 'balance_below': return `balance < ${threshold} TRX`
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
  const header = 'ID | Trigger | Action | Budget (spent/total) | Executions | Status'
  const sep = '-'.repeat(header.length)
  const rows = orders.map(o => {
    const budget = sunToTrx(o.budget_sun)
    const spent = sunToTrx(o.spent_sun ?? 0)
    const execs = `${o.executions ?? 0}/${o.max_executions}`
    const id = o.id.slice(0, 8)
    return `${id} | ${describeTrigger(o)} | ${describeAction(o)} | ${spent}/${budget} TRX | ${execs} | ${o.status}`
  })
  return [header, sep, ...rows].join('\n')
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
  const header = 'ID | Type | Target | Status'
  const sep = '-'.repeat(header.length)
  const rows = monitors.map(m => {
    const id = m.id.slice(0, 8)
    const target = m.target_address?.slice(0, 12) ?? '-'
    return `${id} | ${m.monitor_type} | ${target} | ${m.status}`
  })
  return [header, sep, ...rows].join('\n')
}
