import { publicGet, publicPost } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import { resolveToken, KNOWN_TOKENS } from '../lib/known-tokens.js'
import type { McpTool } from '../types.js'

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function encodeAddressParam(addr: string): string {
  let num = 0n
  for (const c of addr) { num = num * 58n + BigInt(B58.indexOf(c)) }
  const hex = num.toString(16).padStart(50, '0').slice(0, 42) // 41... hex
  return hex.slice(2).padStart(64, '0') // strip 41 prefix, pad to 32 bytes
}
import {
  formatAccountInfo,
  formatTrxBalance,
  formatTokenBalance,
  formatTransaction,
  formatBlock,
} from './chain-formatters.js'

// --- 19. get_account_info ---

const getAccountInfo: McpTool = {
  name: 'get_account_info',
  description: 'Full on-chain account state: TRX balance, energy, bandwidth, creation date. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'TRON address (T...).' },
    },
    required: ['address'],
  },
  async handler(input) {
    try {
      const data = await publicGet(
        `/api/v1/chain/account/${input.address}`
      ) as Record<string, unknown>
      return textResult(formatAccountInfo(data, input.address as string))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

// --- 20. get_trx_balance ---

const getTrxBalance: McpTool = {
  name: 'get_trx_balance',
  description: 'Quick TRX balance for a TRON address. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'TRON address (T...).' },
    },
    required: ['address'],
  },
  async handler(input) {
    try {
      const addr = input.address as string
      const data = await publicGet(
        `/api/v1/chain/balance/${addr}`
      ) as Record<string, unknown>
      return textResult(formatTrxBalance(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

// --- 21. get_trc20_balance ---

const getTrc20Balance: McpTool = {
  name: 'get_trc20_balance',
  description: 'Get TRC-20 token balance for an address. Supports symbol (USDT, USDC) or contract address. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'TRON address to query.' },
      token: { type: 'string', description: 'Token symbol (USDT, USDC) or contract address.' },
    },
    required: ['address', 'token'],
  },
  async handler(input) {
    try {
      const addr = input.address as string
      const tokenInput = input.token as string
      const resolved = resolveToken(tokenInput)
      if (!resolved) return errorResult(`Unknown token: ${tokenInput}`)
      // ABI-encode address: base58 -> hex -> strip 41 prefix -> pad to 64
      const abiParam = encodeAddressParam(addr)
      const data = await publicPost('/api/v1/chain/read-contract', {
        contract_address: resolved.address,
        function_selector: 'balanceOf(address)',
        parameter: abiParam,
        owner_address: addr,
      }) as Record<string, unknown>
      const hexResult = (data.constant_result as string[])?.[0] ?? '0'
      const rawBal = BigInt('0x' + (hexResult || '0'))
      const symbol = tokenInput.toUpperCase() in KNOWN_TOKENS
        ? tokenInput.toUpperCase()
        : resolved.name
      return textResult(formatTokenBalance(symbol, rawBal, resolved.decimals))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

// --- 22. get_transaction ---

const getTransaction: McpTool = {
  name: 'get_transaction',
  description: 'Look up a transaction by ID on TRON. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      tx_id: { type: 'string', description: 'Transaction ID (hash).' },
    },
    required: ['tx_id'],
  },
  async handler(input) {
    try {
      const data = await publicGet(
        `/api/v1/chain/transaction/${input.tx_id}`
      ) as Record<string, unknown>
      return textResult(formatTransaction(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

// --- 23. get_block ---

const getBlock: McpTool = {
  name: 'get_block',
  description: 'Get TRON block info by number (or latest if omitted). No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      block_number: { type: 'number', description: 'Block number. Omit for latest.' },
    },
  },
  async handler(input) {
    try {
      const num = input.block_number as number | undefined
      const path = num != null
        ? `/api/v1/chain/block/${num}`
        : '/api/v1/chain/block'
      const data = await publicGet(path) as Record<string, unknown>
      return textResult(formatBlock(data))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const chainTools: McpTool[] = [
  getAccountInfo,
  getTrxBalance,
  getTrc20Balance,
  getTransaction,
  getBlock,
]
