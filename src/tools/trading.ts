import { authGet, authPost, hasApiKey } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import type { McpTool } from '../types.js'
import {
  formatOrderSummary,
  formatOrderDetail,
  formatOrderTable,
  formatEnsureResult,
} from './trading-formatters.js'
import type { Order, EnsureResult } from './trading-formatters.js'

function requireAuth(): void {
  if (!hasApiKey()) {
    throw new Error('MERX_API_KEY is required. Set it in your environment.')
  }
}

const createOrder: McpTool = {
  name: 'create_order',
  description: 'Buy energy or bandwidth on Merx. Routed to cheapest provider. Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      resource_type: {
        type: 'string',
        enum: ['ENERGY', 'BANDWIDTH'],
        description: 'Resource type to purchase.',
      },
      amount: {
        type: 'number',
        description: 'Amount of resource units (min 65000 for ENERGY, 300 for BANDWIDTH).',
      },
      duration_sec: {
        type: 'number',
        description: 'Rental duration in seconds (e.g. 300, 3600, 86400, 2592000).',
      },
      target_address: {
        type: 'string',
        description: 'TRON address to receive delegated resources.',
      },
      max_price_sun: {
        type: 'number',
        description: 'Optional max price in SUN/unit. Order fails if no provider is cheaper.',
      },
    },
    required: ['resource_type', 'amount', 'duration_sec', 'target_address'],
  },
  async handler(input) {
    try {
      requireAuth()
      const payload: Record<string, unknown> = {
        resource_type: input.resource_type,
        order_type: 'MARKET',
        amount: input.amount,
        duration_sec: input.duration_sec,
        target_address: input.target_address,
      }
      if (input.max_price_sun != null) {
        payload.max_price_sun = input.max_price_sun
      }
      const data = await authPost('/api/v1/orders', payload) as Order
      return textResult(formatOrderSummary(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const getOrder: McpTool = {
  name: 'get_order',
  description: 'Get order status by UUID. Aliases: get_order_status, check_order, order_status, order_details, fetch_order. Check the status and fill details of an existing order by its UUID. Returns current status (PENDING/FILLING/FILLED/PARTIAL/FAILED/CANCELLED), fill amounts, provider used, on-chain delegation tx hash if delivered. Use this to poll order progress after creating an order. Auth required (API key).',
  inputSchema: {
    type: 'object',
    properties: {
      order_id: {
        type: 'string',
        description: 'The order UUID.',
      },
    },
    required: ['order_id'],
  },
  async handler(input) {
    try {
      requireAuth()
      const data = await authGet(`/api/v1/orders/${input.order_id}`) as Order
      return textResult(formatOrderDetail(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const listOrders: McpTool = {
  name: 'list_orders',
  description: 'List recent orders with optional status filter. Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['PENDING', 'FILLING', 'FILLED', 'PARTIAL', 'FAILED', 'CANCELLED'],
        description: 'Filter by order status.',
      },
      limit: {
        type: 'number',
        description: 'Max number of orders to return (default: 20).',
      },
    },
  },
  async handler(input) {
    try {
      requireAuth()
      const params = new URLSearchParams()
      if (input.status) params.set('status', input.status as string)
      if (input.limit != null) params.set('limit', String(input.limit))
      const qs = params.toString()
      const path = `/api/v1/orders${qs ? `?${qs}` : ''}`
      const data = await authGet(path)
      return textResult(formatOrderTable(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const ensureResources: McpTool = {
  name: 'ensure_resources',
  description:
    'Declarative resource provisioning. Checks current resources on target address ' +
    'and purchases only what is missing. Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      target_address: {
        type: 'string',
        description: 'TRON address to provision resources for.',
      },
      energy_minimum: {
        type: 'number',
        description: 'Minimum energy the address should have.',
      },
      bandwidth_minimum: {
        type: 'number',
        description: 'Minimum bandwidth the address should have.',
      },
      duration_sec: {
        type: 'number',
        description: 'Rental duration in seconds (default: 3600).',
      },
    },
    required: ['target_address'],
  },
  async handler(input) {
    try {
      requireAuth()
      const payload: Record<string, unknown> = {
        target_address: input.target_address,
      }
      if (input.energy_minimum != null) payload.energy_minimum = input.energy_minimum
      if (input.bandwidth_minimum != null) payload.bandwidth_minimum = input.bandwidth_minimum
      if (input.duration_sec != null) payload.duration_sec = input.duration_sec
      const data = await authPost('/api/v1/ensure', payload) as EnsureResult
      return textResult(formatEnsureResult(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const TERMINAL_STATUSES = new Set(['FILLED', 'PARTIAL', 'FAILED', 'CANCELLED'])

const waitForDelegation: McpTool = {
  name: 'wait_for_delegation',
  description:
    'Block until an order reaches a terminal state (FILLED, PARTIAL, FAILED, or CANCELLED) by polling get_order at fixed intervals. Use this right after create_order when you need to confirm the energy/bandwidth has actually been delegated on-chain before sending the next transaction. Returns the final order details including the on-chain delegation tx hash. Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      order_id: {
        type: 'string',
        description: 'The order UUID returned by create_order.',
      },
      timeout_sec: {
        type: 'number',
        description: 'Maximum time to wait in seconds (default: 60, max: 300).',
      },
      poll_interval_sec: {
        type: 'number',
        description: 'How often to check status in seconds (default: 3, min: 1).',
      },
    },
    required: ['order_id'],
  },
  async handler(input) {
    try {
      requireAuth()
      const orderId = input.order_id as string
      const timeoutSec = Math.min(Math.max(Number(input.timeout_sec ?? 60), 1), 300)
      const pollSec = Math.max(Number(input.poll_interval_sec ?? 3), 1)
      const deadline = Date.now() + timeoutSec * 1000

      let lastOrder: Order | null = null
      let polls = 0
      while (Date.now() < deadline) {
        polls++
        try {
          lastOrder = await authGet(`/api/v1/orders/${orderId}`) as Order
        } catch (e) {
          return errorResult(`Failed to fetch order ${orderId}: ${(e as Error).message}`)
        }
        const status = String((lastOrder as { status?: string }).status ?? 'UNKNOWN')
        if (TERMINAL_STATUSES.has(status)) {
          return textResult(
            `Order ${orderId} reached terminal state after ${polls} polls (${Math.round((Date.now() - (deadline - timeoutSec * 1000)) / 1000)}s):\n\n` +
            formatOrderDetail(lastOrder)
          )
        }
        // Sleep until next poll, but never past the deadline
        const remainingMs = deadline - Date.now()
        if (remainingMs <= 0) break
        await new Promise(r => setTimeout(r, Math.min(pollSec * 1000, remainingMs)))
      }

      const finalStatus = lastOrder ? String((lastOrder as { status?: string }).status ?? 'UNKNOWN') : 'NEVER_FETCHED'
      return errorResult(
        `Timeout after ${timeoutSec}s: order ${orderId} did not reach a terminal state. ` +
        `Last observed status: ${finalStatus}. Polls made: ${polls}. ` +
        `You can call get_order(${orderId}) later to check progress, or call wait_for_delegation again with a longer timeout.`
      )
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const tradingTools: McpTool[] = [
  createOrder,
  getOrder,
  listOrders,
  ensureResources,
  waitForDelegation,
]
