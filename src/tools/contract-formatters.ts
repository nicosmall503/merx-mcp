import { sunToTrx, formatNumber } from '../lib/formatter.js'

export function formatReadResult(
  contract: string,
  selector: string,
  rawResult: string[]
): string {
  const lines = [
    '--- Contract Read ---',
    `Contract: ${contract}`,
    `Function: ${selector}`,
    '',
    '--- Result ---',
  ]
  for (let i = 0; i < rawResult.length; i++) {
    lines.push(`[${i}]: 0x${rawResult[i]}`)
  }
  if (rawResult.length === 0) lines.push('(empty result)')
  return lines.join('\n')
}

export function formatContractEstimate(
  contract: string,
  selector: string,
  energyNeeded: number,
  bandwidthNeeded: number,
  rentalCostSun: number,
  burnCostSun: number,
  savingsPercent: number
): string {
  return [
    '--- Contract Call Estimate ---',
    `Contract:  ${contract}`,
    `Function:  ${selector}`,
    '',
    `Energy needed:    ${formatNumber(energyNeeded)}`,
    `Bandwidth needed: ${formatNumber(bandwidthNeeded)}`,
    '',
    `Rental cost: ${sunToTrx(rentalCostSun)} TRX`,
    `Burn cost:   ${sunToTrx(burnCostSun)} TRX`,
    `Savings:     ${savingsPercent.toFixed(1)}%`,
  ].join('\n')
}

export function formatContractCall(
  contract: string,
  selector: string,
  callValue: string | null,
  energyNeeded: number,
  bwNeeded: number,
  resourceInfo: string | null
): string {
  const lines = [
    '--- Contract Call ---',
    `Contract: ${contract}`,
    `Function: ${selector}`,
  ]
  if (callValue) lines.push(`Call value: ${callValue} TRX`)
  lines.push(
    '',
    `Energy needed:    ${formatNumber(energyNeeded)}`,
    `Bandwidth needed: ${formatNumber(bwNeeded)}`,
    '',
  )
  if (resourceInfo) lines.push(resourceInfo, '')
  lines.push('Transaction ready. Signing requires TronWeb integration.')
  return lines.join('\n')
}
