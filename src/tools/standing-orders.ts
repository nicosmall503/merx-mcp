import { authGet, authPost, authDelete, hasApiKey } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import type { McpTool } from '../types.js'
import {
  formatStandingOrderDetail,
  formatStandingOrderTable,
  formatMonitorDetail,
  formatMonitorTable,
} from './standing-orders-formatters.js'
import type { StandingOrder, Monitor } from './standing-orders-formatters.js'

function requireAuth(): void {
  if (!hasApiKey()) {
    throw new Error('MERX_API_KEY is required. Set it in your environment.')
  }
}

async function callMonitorsApi(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  try {
    if (method === 'POST') return await authPost(path, body ?? {})
    return await authGet(path)
  } catch (e) {
    const msg = (e as Error).message ?? ''
    if (msg.includes('404') || msg.includes('Not Found')) {
      throw new Error('Monitors API coming soon. Standing orders are available now.')
    }
    throw e
  }
}

const createStandingOrder: McpTool = {
  name: 'create_standing_order',
  description: 'Create a server-side standing order with trigger-based automation. Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      trigger_type: {
        type: 'string',
        enum: ['price_below', 'price_above', 'schedule', 'balance_below'],
        description: 'Condition that triggers the order.',
      },
      trigger_params: {
        type: 'object',
        description: 'Trigger parameters: { resource, threshold_sun } or { cron }.',
      },
      action_type: {
        type: 'string',
        enum: ['buy_resource', 'ensure_resources', 'notify_only'],
        description: 'Action to perform when triggered.',
      },
      action_params: {
        type: 'object',
        description: 'Action parameters: { resource_type, amount, duration_sec, target_address }.',
      },
      budget_trx: {
        type: 'string',
        description: 'Maximum budget in TRX (converted to SUN internally).',
      },
      max_executions: {
        type: 'number',
        description: 'Maximum number of times this order can execute.',
      },
      expires_at: {
        type: 'string',
        description: 'ISO 8601 expiration date (optional).',
      },
    },
    required: [
      'trigger_type', 'trigger_params', 'action_type',
      'action_params', 'budget_trx', 'max_executions',
    ],
  },
  async handler(input) {
    try {
      requireAuth()
      const payload: Record<string, unknown> = {
        trigger_type: input.trigger_type,
        trigger_params: input.trigger_params,
        action_type: input.action_type,
        action_params: input.action_params,
        budget_trx: String(input.budget_trx),
      }
      if (input.max_executions != null) payload.max_executions = input.max_executions
      if (input.expires_at) payload.expires_at = input.expires_at
      const data = await authPost('/api/v1/standing-orders', payload) as StandingOrder
      return textResult(formatStandingOrderDetail(data))
    } catch (e) {
      const err = e as Error
      console.error('Standing order error:', err.message, err.stack?.slice(0, 200))
      return errorResult(`Standing order failed: ${err.message}`)
    }
  },
}

const listStandingOrders: McpTool = {
  name: 'list_standing_orders',
  description: 'List all standing orders with optional status filter. Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['ACTIVE', 'TRIGGERED', 'EXHAUSTED', 'EXPIRED', 'CANCELLED'],
        description: 'Filter by status.',
      },
    },
  },
  async handler(input) {
    try {
      requireAuth()
      const qs = input.status ? `?status=${input.status}` : ''
      const data = await authGet(`/api/v1/standing-orders${qs}`) as StandingOrder[]
      return textResult(formatStandingOrderTable(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const createMonitor: McpTool = {
  name: 'create_monitor',
  description:
    'Create a persistent server-side monitor that fires notifications when a condition is met. Four monitor types: delegation_expiry (warns when leased energy is about to expire so you can re-rent), balance_threshold (fires when an address goes below a TRX/USDT level), price_alert (fires when energy/bandwidth price crosses a SUN threshold), address_activity (fires on any incoming TX). Notification defaults to webhook=true if omitted. Auth required (API key).',
  inputSchema: {
    type: 'object',
    properties: {
      monitor_type: {
        type: 'string',
        enum: ['delegation_expiry', 'balance_threshold', 'price_alert', 'address_activity'],
        description: 'Type of monitor to create.',
      },
      target_address: {
        type: 'string',
        description: 'TRON address to monitor. Required for delegation_expiry, balance_threshold, address_activity. Not used for price_alert.',
      },
      params: {
        type: 'object',
        description: 'Type-specific params. delegation_expiry: { alert_before_sec, auto_renew, resource_type }. balance_threshold: { resource: "TRX"|"ENERGY"|"BANDWIDTH", below: number }. price_alert: { resource: "ENERGY"|"BANDWIDTH", above_sun?: number, below_sun?: number }. address_activity: { min_amount_trx?: number }.',
      },
      notify: {
        type: 'object',
        description: 'Notification config: { webhook?: boolean, telegram_chat_id?: string }. Defaults to { webhook: true } if omitted.',
      },
    },
    required: ['monitor_type', 'params'],
  },
  async handler(input) {
    try {
      requireAuth()
      if (input.monitor_type == null) return errorResult('monitor_type is required')
      if (input.params == null) return errorResult('params is required (object with type-specific fields, see description)')
      const payload: Record<string, unknown> = {
        monitor_type: input.monitor_type,
        params: input.params,
        notification: input.notify ?? { webhook: true },
      }
      if (input.target_address) payload.target_address = input.target_address
      const data = await callMonitorsApi('POST', '/api/v1/monitors', payload) as Monitor
      return textResult(formatMonitorDetail(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const listMonitors: McpTool = {
  name: 'list_monitors',
  description: 'List all monitors you created with create_monitor, optionally filtered by status (ACTIVE/CANCELLED). Each row shows the full monitor UUID (pass to cancel_monitor), monitor type, target address, and status. Note: the Target column will be empty for monitor types that do not have a single watched address — specifically price_alert and balance_threshold (when watching the API key holder rather than a third-party address). For delegation_expiry and address_activity monitors, Target will always be set. Auth required (API key).',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['ACTIVE', 'CANCELLED'],
        description: 'Filter by monitor status.',
      },
    },
  },
  async handler(input) {
    try {
      requireAuth()
      const qs = input.status ? `?status=${input.status}` : ''
      const data = await callMonitorsApi('GET', `/api/v1/monitors${qs}`) as Monitor[]
      return textResult(formatMonitorTable(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const getStandingOrder: McpTool = {
  name: 'get_standing_order',
  description: 'Get full details of a single standing order by its UUID. Returns trigger config, action params, budget, executions count, and status. Auth required (API key).',
  inputSchema: {
    type: 'object',
    properties: {
      order_id: { type: 'string', description: 'Standing order UUID (from list_standing_orders).' },
    },
    required: ['order_id'],
  },
  async handler(input) {
    try {
      requireAuth()
      const id = input.order_id as string
      if (!id) return errorResult('order_id is required')
      const data = await authGet(`/api/v1/standing-orders/${id}`) as StandingOrder
      return textResult(formatStandingOrderDetail(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const cancelStandingOrder: McpTool = {
  name: 'cancel_standing_order',
  description: 'Cancel a standing order by its UUID. The order is moved to CANCELLED status and will not trigger again. Already-executed actions are NOT reversed. Auth required (API key).',
  inputSchema: {
    type: 'object',
    properties: {
      order_id: { type: 'string', description: 'Standing order UUID to cancel.' },
    },
    required: ['order_id'],
  },
  async handler(input) {
    try {
      requireAuth()
      const id = input.order_id as string
      if (!id) return errorResult('order_id is required')
      await authDelete(`/api/v1/standing-orders/${id}`)
      return textResult(`Standing order ${id} cancelled.`)
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const cancelMonitor: McpTool = {
  name: 'cancel_monitor',
  description: 'Cancel an active monitor by its UUID. The monitor stops firing notifications. Auth required (API key).',
  inputSchema: {
    type: 'object',
    properties: {
      monitor_id: { type: 'string', description: 'Monitor UUID to cancel.' },
    },
    required: ['monitor_id'],
  },
  async handler(input) {
    try {
      requireAuth()
      const id = input.monitor_id as string
      if (!id) return errorResult('monitor_id is required')
      await authDelete(`/api/v1/monitors/${id}`)
      return textResult(`Monitor ${id} cancelled.`)
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const standingOrderTools: McpTool[] = [
  createStandingOrder,
  listStandingOrders,
  getStandingOrder,
  cancelStandingOrder,
  createMonitor,
  listMonitors,
  cancelMonitor,
]
