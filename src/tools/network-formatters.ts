import { formatNumber } from '../lib/formatter.js'
import { hexToBase58 } from './network-helpers.js'

export interface ChainParam {
  key: string
  value: number
}

const KEY_PARAMS = [
  'getEnergyFee',
  'getCreateNewAccountFeeInSystemContract',
  'getTotalEnergyLimit',
  'getTotalEnergyCurrentLimit',
  'getTransactionFee',
  'getMaintenanceTimeInterval',
]

export function formatChainParams(
  params: ChainParam[],
  bestPrice: Record<string, unknown> | null
): string {
  const filtered = params.filter(p => KEY_PARAMS.includes(p.key))
  const lines = ['Network Parameters', '------------------']
  for (const p of filtered) {
    lines.push(`  ${p.key}: ${formatNumber(p.value)}`)
  }
  appendSavings(lines, params, bestPrice)
  return lines.join('\n')
}

function appendSavings(
  lines: string[],
  params: ChainParam[],
  bestPrice: Record<string, unknown> | null
): void {
  const energyFee = params.find(p => p.key === 'getEnergyFee')
  if (!bestPrice || !energyFee) return
  const burn = energyFee.value
  const merxPrice = Number(bestPrice.price_sun ?? bestPrice.price ?? 0)
  if (merxPrice <= 0 || burn <= 0) return
  const savings = ((1 - merxPrice / burn) * 100).toFixed(1)
  lines.push('')
  lines.push(
    `  Merx best energy price: ${merxPrice} SUN` +
    ` vs network burn: ${burn} SUN (${savings}% savings)`
  )
}

export function formatTxHistory(
  entries: Array<Record<string, unknown>>,
  addr: string
): string {
  if (entries.length === 0) return `No transactions found for ${addr}.`
  const header = `  ${'Date'.padEnd(20)} ${'Type'.padEnd(16)} ${'From/To'.padEnd(36)} Amount`
  const sep = '  ' + '-'.repeat(85)
  const rows = entries.map(formatTxRow)
  return [
    `Transaction History: ${addr}`,
    header,
    sep,
    ...rows,
    sep,
    `  ${entries.length} transaction(s)`,
  ].join('\n')
}

function toBase58IfHex(addr: string): string {
  // TronGrid raw_data returns addresses as hex (41xxxx...). Convert to base58 (T...) for display.
  if (!addr || addr === '-') return addr
  if (addr.startsWith('T') && addr.length === 34) return addr
  if (/^41[0-9a-fA-F]{40}$/.test(addr)) {
    try {
      return hexToBase58(addr)
    } catch {
      return addr
    }
  }
  return addr
}

function formatTxRow(e: Record<string, unknown>): string {
  // Two possible shapes from TronGrid:
  //   1. Native TRX/contract tx: { raw_data: { timestamp, contract: [{type, parameter}] }, ... }
  //   2. TRC20 transfer (from /transactions/trc20): { block_timestamp, from, to, value, token_info: { symbol, decimals } }
  const rawData = e.raw_data as Record<string, unknown> | undefined
  const ts = rawData?.timestamp ?? e.block_timestamp ?? e.timestamp
  const date = ts ? new Date(Number(ts)).toISOString().slice(0, 19).replace('T', ' ') : 'N/A'

  // Path 1: native TRX (TransferContract) or generic smart-contract call
  if (rawData) {
    const contracts = rawData.contract as Array<Record<string, unknown>> | undefined
    const c = contracts?.[0]
    const txType = String(c?.type ?? 'TransferContract').replace('Contract', '')
    const val = (c?.parameter as Record<string, unknown>)?.value as Record<string, unknown> | undefined
    const rawTo = String(val?.to_address ?? val?.contract_address ?? val?.receiver_address ?? '-')
    const to = toBase58IfHex(rawTo)
    const amt = val?.amount != null
      ? (Number(val.amount) / 1_000_000).toFixed(6) + ' TRX'
      : ''
    return `  ${date.padEnd(20)} ${txType.padEnd(16)} ${to.padEnd(36)} ${amt}`
  }

  // Path 2: TRC20 transfer entry (from TronGrid trc20 endpoint)
  const txType = 'TRC20Transfer'
  const to = String(e.to ?? '-')
  const tokenInfo = e.token_info as { symbol?: string; decimals?: number } | undefined
  const symbol = tokenInfo?.symbol ?? 'TRC20'
  const decimals = tokenInfo?.decimals ?? 6
  const rawAmt = e.value
  const amt = rawAmt != null
    ? (Number(rawAmt) / Math.pow(10, decimals)).toFixed(decimals < 6 ? decimals : 6) + ` ${symbol}`
    : ''
  return `  ${date.padEnd(20)} ${txType.padEnd(16)} ${to.padEnd(36)} ${amt}`
}
