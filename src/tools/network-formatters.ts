import { formatNumber } from '../lib/formatter.js'

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

function formatTxRow(e: Record<string, unknown>): string {
  // TronGrid format: raw_data.timestamp, raw_data.contract[0].type + parameter.value
  const rawData = e.raw_data as Record<string, unknown> | undefined
  const ts = rawData?.timestamp ?? e.block_timestamp ?? e.timestamp
  const date = ts ? new Date(Number(ts)).toISOString().slice(0, 19).replace('T', ' ') : 'N/A'
  const contracts = rawData?.contract as Array<Record<string, unknown>> | undefined
  const c = contracts?.[0]
  const txType = String(c?.type ?? e.type ?? 'transfer').replace('Contract', '')
  const val = (c?.parameter as Record<string, unknown>)?.value as Record<string, unknown> | undefined
  const to = String(val?.to_address ?? val?.contract_address ?? e.to ?? '')
  const counterparty = to ? to.slice(0, 12) + '...' : 'N/A'
  const amt = val?.amount != null ? (Number(val.amount) / 1_000_000).toFixed(2) + ' TRX' : ''
  return `  ${date.padEnd(20)} ${txType.padEnd(16)} ${counterparty.padEnd(16)} ${amt}`
}
