import { sunToTrx, formatNumber } from '../lib/formatter.js'
import { hexToBase58 } from './network-helpers.js'
import { lookupTokenByAddress } from '../lib/known-tokens.js'

// Decode an ABI-encoded uint256 from a 64-char hex string
function decodeUint256(hex: string): bigint {
  const clean = hex.replace(/^0x/, '').slice(0, 64)
  return BigInt('0x' + clean)
}

// Decode an ABI-encoded TRON address from a 64-char hex string
// (last 20 bytes are the EVM-style address; prepend 0x41 for TRON base58 conversion)
function decodeAddress(hex: string): string {
  const clean = hex.replace(/^0x/, '').slice(-40)
  try {
    return hexToBase58('41' + clean)
  } catch {
    return '0x' + clean
  }
}

// Decode an ABI-encoded dynamic string. ABI string layout:
//   [32 bytes offset][32 bytes length][N bytes data, padded to multiple of 32]
function decodeAbiString(hex: string): string {
  try {
    const clean = hex.replace(/^0x/, '')
    if (clean.length < 128) return ''
    const lengthHex = clean.slice(64, 128)
    const length = parseInt(lengthHex, 16)
    if (length === 0 || length > 1000) return ''
    const dataHex = clean.slice(128, 128 + length * 2)
    let result = ''
    for (let i = 0; i < dataHex.length; i += 2) {
      const code = parseInt(dataHex.slice(i, i + 2), 16)
      if (code >= 32 && code < 127) result += String.fromCharCode(code)
    }
    return result
  } catch {
    return ''
  }
}

// Format a uint256 raw value with the correct decimals when we know the token.
// Falls back to raw integer string if we can't.
function formatTokenAmount(raw: bigint, decimals: number, symbol?: string): string {
  if (decimals === 0) return symbol ? `${raw.toString()} ${symbol}` : raw.toString()
  const divisor = 10n ** BigInt(decimals)
  const whole = raw / divisor
  const frac = raw % divisor
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '') || '0'
  // Limit displayed fraction to 6 chars to keep things readable
  const displayFrac = fracStr.length > 6 ? fracStr.slice(0, 6) : fracStr
  // Add thousands separators to whole part
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formatted = displayFrac === '0' ? wholeStr : `${wholeStr}.${displayFrac}`
  return symbol ? `${formatted} ${symbol}` : formatted
}

// Try to decode a single 32-byte ABI return value based on the function name.
// If `tokenInfo` is provided (we recognized the contract), uint256 token-amount
// functions are formatted with the correct decimals.
// Returns a human-readable representation, or null if we can't guess.
function tryDecode(
  selector: string,
  hex: string,
  tokenInfo: { symbol: string; decimals: number; name: string } | null
): string | null {
  // Extract return-type hint from common ERC20/TRC20 patterns
  const fn = selector.split('(')[0].toLowerCase()

  // Strings: name(), symbol()
  if (fn === 'name' || fn === 'symbol') {
    const decoded = decodeAbiString(hex)
    return decoded ? `"${decoded}"` : null
  }

  // uint8: decimals()
  if (fn === 'decimals') {
    return decodeUint256(hex).toString()
  }

  // uint256: totalSupply(), balanceOf(), allowance() — apply token decimals if known
  if (fn === 'totalsupply' || fn === 'balanceof' || fn === 'allowance') {
    const raw = decodeUint256(hex)
    if (tokenInfo) {
      return formatTokenAmount(raw, tokenInfo.decimals, tokenInfo.symbol)
    }
    return raw.toString()
  }

  // address: owner(), getOwner(), implementation()
  if (fn === 'owner' || fn === 'getowner' || fn === 'implementation') {
    return decodeAddress(hex)
  }

  // bool: paused(), isOwner()
  if (fn.startsWith('is') || fn === 'paused') {
    const v = decodeUint256(hex)
    return v === 0n ? 'false' : 'true'
  }

  return null
}

export function formatReadResult(
  contract: string,
  selector: string,
  rawResult: string[]
): string {
  // Detect if this is a known TRC20 contract — enables decimals-aware formatting
  // for balanceOf/totalSupply/allowance.
  const tokenInfo = lookupTokenByAddress(contract)
  const lines = [
    '--- Contract Read ---',
    `Contract: ${contract}${tokenInfo ? ` (${tokenInfo.symbol} — ${tokenInfo.name})` : ''}`,
    `Function: ${selector}`,
    '',
    '--- Result ---',
  ]
  if (rawResult.length === 0) {
    lines.push('(empty result)')
    return lines.join('\n')
  }
  for (let i = 0; i < rawResult.length; i++) {
    const hex = rawResult[i]
    const decoded = tryDecode(selector, hex, tokenInfo)
    if (decoded != null) {
      lines.push(`[${i}] ${decoded}`)
      lines.push(`     (raw: 0x${hex})`)
    } else {
      lines.push(`[${i}] 0x${hex}`)
    }
  }
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
