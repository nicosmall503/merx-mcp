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
  description: 'Get order details and fill status by ID. Auth required.',
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

export const tradingTools: McpTool[] = [
  createOrder,
  getOrder,
  listOrders,
  ensureResources,
]
