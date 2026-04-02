import { sunToTrx, formatNumber } from '../lib/formatter.js'

// API returns: { balance, exists, resources: { energyLimit, energyUsed, bandwidthLimit, bandwidthUsed, freeNetLimit, freeNetUsed } }
export function formatAccountInfo(data: Record<string, unknown>, address: string): string {
  const balSun = Number(data.balance ?? 0)
  const res = data.resources as Record<string, number> | undefined
  const eLimit = res?.energyLimit ?? 0
  const eUsed = res?.energyUsed ?? 0
  const bwLimit = res?.bandwidthLimit ?? 0
  const bwUsed = res?.bandwidthUsed ?? 0
  const bwFree = (res?.freeNetLimit ?? 0) - (res?.freeNetUsed ?? 0)
  const n = formatNumber
  return [
    'Account Info',
    '------------',
    `  Address:    ${address}`,
    `  TRX:        ${sunToTrx(balSun)} TRX (${n(balSun)} SUN)`,
    '',
    `  Energy:     ${n(eLimit - eUsed)} avail / ${n(eLimit)} limit`,
    `  Bandwidth:  ${n(bwLimit - bwUsed)} avail / ${n(bwLimit)} limit`,
    `  Free BW:    ${n(Math.max(0, bwFree))}`,
  ].join('\n')
}

// API returns: { address, balance_sun, balance_trx }
export function formatTrxBalance(data: Record<string, unknown>): string {
  const sun = Number(data.balance_sun ?? 0)
  return `Balance: ${data.balance_trx ?? sunToTrx(sun)} TRX (${formatNumber(sun)} SUN)`
}

export function formatTokenBalance(token: string, rawBal: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = rawBal / divisor
  const frac = rawBal % divisor
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 6)
  return `Balance: ${whole}.${fracStr} ${token} (raw: ${rawBal.toString()})`
}

function extractTxFields(tx: Record<string, unknown>) {
  const raw = tx.raw_data as Record<string, unknown> | undefined
  const contracts = raw?.contract as Array<Record<string, unknown>> | undefined
  const c = contracts?.[0] ?? {}
  const param = c.parameter as Record<string, unknown> | undefined
  const val = param?.value as Record<string, unknown> | undefined
  const ret = tx.ret as Array<Record<string, unknown>> | undefined
  const status = ret?.[0]?.contractRet ?? 'UNKNOWN'
  const amount = val?.amount != null ? sunToTrx(Number(val.amount)) + ' TRX' : 'N/A'
  const ts = raw?.timestamp ? new Date(Number(raw.timestamp)).toISOString() : 'N/A'
  return { status, type: c.type ?? 'Unknown', from: val?.owner_address ?? 'N/A', to: val?.to_address ?? val?.contract_address ?? 'N/A', amount, ts }
}

// API returns: { transaction: {...}, info: {...} }
export function formatTransaction(resp: Record<string, unknown>): string {
  const tx = (resp.transaction ?? resp) as Record<string, unknown>
  const info = (resp.info ?? {}) as Record<string, unknown>
  const t = extractTxFields(tx)
  const receipt = info.receipt as Record<string, number> | undefined
  return [
    'Transaction',
    '-----------',
    `  TX ID:      ${tx.txID ?? 'N/A'}`,
    `  Status:     ${t.status}`,
    `  Type:       ${t.type}`,
    `  From:       ${t.from}`,
    `  To:         ${t.to}`,
    `  Value:      ${t.amount}`,
    `  Energy:     ${receipt?.energy_usage_total ?? 0}`,
    `  Bandwidth:  ${receipt?.net_usage ?? 0}`,
    `  Timestamp:  ${t.ts}`,
  ].join('\n')
}

export function formatBlock(data: Record<string, unknown>): string {
  const header = data.block_header as Record<string, unknown> | undefined
  const raw = header?.raw_data as Record<string, unknown> | undefined
  const txs = data.transactions as unknown[] | undefined
  const ts = raw?.timestamp ? new Date(Number(raw.timestamp)).toISOString() : 'N/A'
  return [
    'Block',
    '-----',
    `  Number:    ${raw?.number ?? 'N/A'}`,
    `  Timestamp: ${ts}`,
    `  TX Count:  ${txs?.length ?? 0}`,
    `  Hash:      ${data.blockID ?? 'N/A'}`,
  ].join('\n')
}
