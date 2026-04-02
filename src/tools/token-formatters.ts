import { publicPost } from '../lib/api.js'
import { sunToTrx, formatNumber } from '../lib/formatter.js'
import { KNOWN_TOKENS } from '../lib/known-tokens.js'

export function formatTransferTrx(
  to: string,
  amountTrx: string,
  resourceInfo: string | null
): string {
  const lines = [
    '--- TRX Transfer ---',
    `To:     ${to}`,
    `Amount: ${amountTrx} TRX`,
    '',
  ]
  if (resourceInfo) lines.push(resourceInfo, '')
  lines.push('Transaction ready. Signing requires TronWeb integration.')
  return lines.join('\n')
}

export function formatTrc20Transfer(
  token: string,
  to: string,
  amount: string,
  energyNeeded: number,
  bandwidthNeeded: number,
  resourceInfo: string | null
): string {
  const lines = [
    '--- TRC-20 Transfer ---',
    `Token:  ${token}`,
    `To:     ${to}`,
    `Amount: ${amount}`,
    '',
    `Energy needed:    ${formatNumber(energyNeeded)}`,
    `Bandwidth needed: ${formatNumber(bandwidthNeeded)}`,
    '',
  ]
  if (resourceInfo) lines.push(resourceInfo, '')
  lines.push('Transaction ready. Signing requires TronWeb integration.')
  return lines.join('\n')
}

export function formatApproval(
  token: string,
  spender: string,
  amount: string,
  energyNeeded: number,
  bandwidthNeeded: number,
  resourceInfo: string | null
): string {
  const lines = [
    '--- TRC-20 Approval ---',
    `Token:     ${token}`,
    `Spender:   ${spender}`,
    `Allowance: ${amount}`,
    '',
    `Energy needed:    ${formatNumber(energyNeeded)}`,
    `Bandwidth needed: ${formatNumber(bandwidthNeeded)}`,
    '',
  ]
  if (resourceInfo) lines.push(resourceInfo, '')
  lines.push('Transaction ready. Signing requires TronWeb integration.')
  return lines.join('\n')
}

export function formatTokenInfo(
  address: string,
  name: string,
  symbol: string,
  decimals: number,
  totalSupply: string
): string {
  return [
    '--- Token Info ---',
    `Address:      ${address}`,
    `Name:         ${name}`,
    `Symbol:       ${symbol}`,
    `Decimals:     ${decimals}`,
    `Total Supply: ${totalSupply}`,
  ].join('\n')
}

export function decodeString(hex: string): string {
  if (!hex || hex === '0') return 'unknown'
  const stripped = hex.replace(/^0+/, '')
  try {
    const buf = Buffer.from(stripped, 'hex')
    return buf.toString('utf8').replace(/\0/g, '').trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

export function decodeUint(hex: string): string {
  if (!hex || hex === '0') return '0'
  return BigInt('0x' + (hex || '0')).toString()
}

export async function readContractField(
  contract: string,
  selector: string
): Promise<string> {
  const data = await publicPost('/api/v1/chain/read-contract', {
    contract_address: contract,
    function_selector: selector,
    parameter: '',
    owner_address: contract,
  }) as Record<string, unknown>
  const results = data.constant_result as string[] | undefined
  return results?.[0] ?? '0'
}

export function tokenLabel(input: string, name: string): string {
  return input.toUpperCase() in KNOWN_TOKENS ? input.toUpperCase() : name
}
