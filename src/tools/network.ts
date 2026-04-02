import { publicGet } from '../lib/api.js'
import { textResult, errorResult, sunToTrx } from '../lib/formatter.js'
import type { McpTool } from '../types.js'
import { base58ToHex, hexToBase58 } from './network-helpers.js'
import {
  formatChainParams,
  formatTxHistory,
  type ChainParam,
} from './network-formatters.js'

// --- 31. get_chain_parameters ---

const getChainParameters: McpTool = {
  name: 'get_chain_parameters',
  description: 'Get TRON network parameters (energy fee, bandwidth cost, etc.) with Merx price comparison. No auth required.',
  inputSchema: { type: 'object', properties: {} },
  async handler() {
    try {
      const [rawParams, bestData] = await Promise.all([
        publicGet('/api/v1/chain/parameters') as Promise<Record<string, unknown>>,
        publicGet('/api/v1/prices/best?resource=ENERGY')
          .catch(() => null) as Promise<Record<string, unknown> | null>,
      ])
      const params = (rawParams?.chainParameter ?? []) as ChainParam[]
      return textResult(formatChainParams(params, bestData))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

// --- 32. convert_address ---

const convertAddress: McpTool = {
  name: 'convert_address',
  description: 'Convert TRON address between base58 (T...) and hex (41...) formats. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'TRON address in base58 (T...) or hex (41...).',
      },
    },
    required: ['address'],
  },
  async handler(input) {
    try {
      const addr = input.address as string
      if (addr.startsWith('T')) {
        const hex = base58ToHex(addr)
        return textResult(`Base58: ${addr}\nHex:    ${hex}`)
      }
      if (addr.startsWith('41') && addr.length === 42) {
        const b58 = hexToBase58(addr)
        return textResult(`Hex:    ${addr}\nBase58: ${b58}`)
      }
      return errorResult('Address must start with T (base58) or 41 (hex)')
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

// --- 33. get_trx_price ---

const getTrxPrice: McpTool = {
  name: 'get_trx_price',
  description: 'Get current TRX price from CoinGecko. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      currency: {
        type: 'string',
        description: 'Fiat currency code (default: usd).',
      },
    },
  },
  async handler(input) {
    try {
      const cur = ((input.currency as string) ?? 'usd').toLowerCase()
      const url = 'https://api.coingecko.com/api/v3/simple/price'
        + `?ids=tron&vs_currencies=${cur}`
      const res = await fetch(url)
      const body = await res.json() as Record<string, Record<string, number>>
      const price = body?.tron?.[cur]
      if (price == null) return textResult('TRX price: unavailable')
      return textResult(`TRX price: ${price} ${cur.toUpperCase()}`)
    } catch {
      return textResult('TRX price: unavailable')
    }
  },
}

// --- 34. validate_address ---

const validateAddress: McpTool = {
  name: 'validate_address',
  description: 'Validate a TRON address format and check on-chain status. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'TRON address to validate.' },
    },
    required: ['address'],
  },
  async handler(input) {
    try {
      const addr = input.address as string
      const valid = /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)
      if (!valid) {
        return textResult(`Address: ${addr}\nFormat:  Invalid TRON address`)
      }
      const data = await publicGet(`/api/v1/chain/balance/${addr}`)
        .catch(() => null) as Record<string, unknown> | null
      const balSun = Number(data?.balance ?? 0)
      const status = data != null
        ? `Active (balance ${sunToTrx(balSun)} TRX)`
        : 'Not activated'
      return textResult(
        `Address:  ${addr}\nFormat:   Valid TRON address\nOn-chain: ${status}`
      )
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

// --- 35. search_transaction_history ---

const searchTransactionHistory: McpTool = {
  name: 'search_transaction_history',
  description: 'Get on-chain transaction history for a TRON address. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'TRON address.' },
      type: {
        type: 'string',
        enum: ['all', 'trx', 'trc20'],
        description: 'Transaction type filter (default: all).',
      },
      limit: { type: 'number', description: 'Max results (default: 20).' },
    },
    required: ['address'],
  },
  async handler(input) {
    try {
      const addr = input.address as string
      const type = (input.type as string) ?? 'all'
      const limit = (input.limit as number) ?? 20
      const path = `/api/v1/chain/history/${addr}?type=${type}&limit=${limit}`
      const raw = await publicGet(path) as Record<string, unknown> | unknown[]
      let entries: Record<string, unknown>[]
      if (Array.isArray(raw)) {
        entries = raw as Record<string, unknown>[]
      } else if (raw && typeof raw === 'object' && 'data' in raw) {
        entries = ((raw as Record<string, unknown>).data ?? []) as Record<string, unknown>[]
      } else {
        entries = []
      }
      return textResult(formatTxHistory(entries, addr))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const networkTools: McpTool[] = [
  getChainParameters,
  convertAddress,
  getTrxPrice,
  validateAddress,
  searchTransactionHistory,
]
