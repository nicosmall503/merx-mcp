import { authGet, authPost, hasApiKey } from '../lib/api.js'
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
    'Create a persistent monitor (delegation expiry, balance, price alert). Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      monitor_type: {
        type: 'string',
        enum: ['delegation_expiry', 'balance_threshold', 'price_alert'],
        description: 'Type of monitor to create.',
      },
      target_address: {
        type: 'string',
        description: 'TRON address to monitor (for delegation_expiry).',
      },
      params: {
        type: 'object',
        description: 'Monitor params: { alert_before_sec, auto_renew, resource_type, max_price_sun, duration_sec }.',
      },
      notify: {
        type: 'object',
        description: 'Notification config: { webhook, telegram_chat_id }.',
      },
    },
    required: ['monitor_type', 'params', 'notify'],
  },
  async handler(input) {
    try {
      requireAuth()
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
  description: 'List all monitors with optional status filter. Auth required.',
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

export const standingOrderTools: McpTool[] = [
  createStandingOrder,
  listStandingOrders,
  createMonitor,
  listMonitors,
]
