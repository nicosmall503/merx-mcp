import { authGet, hasApiKey } from '../lib/api.js'
import { textResult, errorResult, sunToTrx, formatNumber } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

// --- get_balance ---

function formatBalance(data: Record<string, unknown>): string {
  const trx = sunToTrx(Number(data.trx_sun ?? data.trx ?? 0))
  const usdt = Number(data.usdt ?? 0).toFixed(2)
  const locked = sunToTrx(Number(data.trx_locked_sun ?? data.trx_locked ?? 0))
  return [
    'Merx Account Balance',
    '--------------------',
    `  TRX available:  ${trx} TRX`,
    `  USDT available: ${usdt} USDT`,
    `  TRX locked:     ${locked} TRX`,
  ].join('\n')
}

const getBalanceTool: McpTool = {
  name: 'get_balance',
  description: 'Get your Merx account balance (TRX, USDT, locked). Requires MERX_API_KEY.',
  inputSchema: { type: 'object', properties: {} },
  async handler(): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required')
    try {
      const data = (await authGet('/api/v1/balance')) as Record<string, unknown>
      return textResult(formatBalance(data))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

// --- get_deposit_info ---

function formatDepositInfo(data: Record<string, unknown>): string {
  const lines = [
    'Deposit Information',
    '-------------------',
    `  Address: ${data.address}`,
  ]
  if (data.memo) {
    lines.push(`  Memo:    ${data.memo}`)
    lines.push('')
    lines.push('  WARNING: Always include the memo when depositing.')
    lines.push('  Deposits without the correct memo may be lost.')
  }
  if (data.min_trx) {
    lines.push(`  Minimum TRX deposit:  ${sunToTrx(Number(data.min_trx))} TRX`)
  }
  if (data.min_usdt) {
    lines.push(`  Minimum USDT deposit: ${Number(data.min_usdt)} USDT`)
  }
  return lines.join('\n')
}

const getDepositInfoTool: McpTool = {
  name: 'get_deposit_info',
  description: 'Get your Merx deposit address and memo. Requires MERX_API_KEY.',
  inputSchema: { type: 'object', properties: {} },
  async handler(): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required')
    try {
      const data = (await authGet('/api/v1/deposit/info')) as Record<string, unknown>
      return textResult(formatDepositInfo(data))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

// --- get_transaction_history ---

interface HistoryEntry {
  created_at: string
  provider: string
  resource_type: string
  amount: number
  price_sun: number
  cost_sun: number
}

function formatHistoryEntry(e: HistoryEntry): string {
  const date = e.created_at.slice(0, 16).replace('T', ' ')
  const cost = sunToTrx(e.cost_sun)
  const amt = formatNumber(e.amount)
  return `  ${date}  ${e.provider.padEnd(12)} ${amt.padStart(10)} ${e.resource_type.padEnd(10)} ${e.price_sun} SUN/u  ${cost} TRX`
}

function formatHistory(entries: HistoryEntry[], period: string): string {
  if (entries.length === 0) {
    return `No transactions found in the last ${period}.`
  }
  const header = `  ${'Date'.padEnd(17)} ${'Provider'.padEnd(12)} ${'Amount'.padStart(10)} ${'Resource'.padEnd(10)} ${'Price'.padEnd(10)} Cost`
  const sep = '  ' + '-'.repeat(75)
  const rows = entries.map(formatHistoryEntry)
  return [
    `Transaction History (${period})`,
    header,
    sep,
    ...rows,
    sep,
    `  ${entries.length} transaction(s)`,
  ].join('\n')
}

const getTransactionHistoryTool: McpTool = {
  name: 'get_transaction_history',
  description: 'Get your Merx account transaction history. Requires MERX_API_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      period: {
        type: 'string',
        enum: ['7D', '30D', '90D'],
        description: 'Time period to query. Default: 30D.',
      },
    },
  },
  async handler(input): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required')
    const period = (input.period as string) ?? '30D'
    try {
      const data = (await authGet(`/api/v1/history?period=${period}`)) as HistoryEntry[]
      const entries = Array.isArray(data) ? data : []
      return textResult(formatHistory(entries, period))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

// --- Export ---

export const accountTools: McpTool[] = [
  getBalanceTool,
  getDepositInfoTool,
  getTransactionHistoryTool,
]
