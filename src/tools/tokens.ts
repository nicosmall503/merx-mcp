import { publicPost, hasPrivateKey } from '../lib/api.js'
import { textResult, errorResult, sunToTrx } from '../lib/formatter.js'
import { resolveToken } from '../lib/known-tokens.js'
import { ensureResources, formatResourceResult } from '../lib/resource-manager.js'
import {
  formatTokenInfo, decodeString, decodeUint,
  readContractField, tokenLabel,
} from './token-formatters.js'
import {
  transferTrx as signTransferTrx,
  transferTrc20 as signTransferTrc20,
  approveTrc20 as signApproveTrc20,
  getAddress,
} from '../lib/tron-signer.js'
import type { McpTool } from '../types.js'

interface EstResponse {
  energy_required: number
  bandwidth_required: number
  total_rental_trx: string
  total_burn_trx: string
  savings_percent: number
}

const transferTrx: McpTool = {
  name: 'transfer_trx',
  description: 'Send TRX to an address. Checks bandwidth, buys via Merx if needed. Signs and broadcasts on-chain. Requires TRON_PRIVATE_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      to_address: { type: 'string', description: 'Recipient TRON address.' },
      amount_trx: { type: 'string', description: 'Amount of TRX to send.' },
    },
    required: ['to_address', 'amount_trx'],
  },
  async handler(input) {
    try {
      if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required. Use set_private_key first.')
      const sender = getAddress()
      const to = input.to_address as string
      const amountTrx = parseFloat(input.amount_trx as string)
      const amountSun = Math.round(amountTrx * 1_000_000)

      // TRX transfer needs only bandwidth (~270), no energy
      const res = await ensureResources(sender, 0, 270)
      const resInfo = res ? formatResourceResult(res) : null

      const tx = await signTransferTrx(to, amountSun)
      const lines = [
        `TRX Transfer: ${amountTrx} TRX -> ${to}`,
        `TX ID: ${tx.txId}`,
        `Status: ${tx.success ? 'BROADCAST' : 'FAILED'}`,
      ]
      if (tx.error) lines.push(`Error: ${tx.error}`)
      if (resInfo) lines.push('', resInfo)
      return textResult(lines.join('\n'))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const transferTrc20: McpTool = {
  name: 'transfer_trc20',
  description: 'Transfer TRC-20 tokens with automatic energy optimization. Signs and broadcasts on-chain. Requires TRON_PRIVATE_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      to_address: { type: 'string', description: 'Recipient TRON address.' },
      token: { type: 'string', description: 'Token symbol (USDT, USDC) or contract address.' },
      amount: { type: 'string', description: 'Amount to transfer (human-readable).' },
    },
    required: ['to_address', 'token', 'amount'],
  },
  async handler(input) {
    try {
      if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required. Use set_private_key first.')
      const sender = getAddress()
      const to = input.to_address as string
      const tokenInput = input.token as string
      const amount = input.amount as string

      const resolved = resolveToken(tokenInput)
      if (!resolved) return errorResult(`Unknown token: ${tokenInput}`)

      // Estimate resources
      const est = await publicPost('/api/v1/estimate', {
        operation: 'trc20_transfer',
        from_address: sender,
        to_address: to,
        token_address: resolved.address,
      }) as EstResponse

      // Buy resources if needed
      const res = await ensureResources(sender, est.energy_required, est.bandwidth_required)
      const resInfo = res ? formatResourceResult(res) : null

      // Convert amount to raw
      const rawAmount = BigInt(Math.round(parseFloat(amount) * (10 ** resolved.decimals))).toString()

      // Sign and broadcast
      const tx = await signTransferTrc20(resolved.address, to, rawAmount)
      const label = tokenLabel(tokenInput, resolved.name)
      const lines = [
        `${label} Transfer: ${amount} -> ${to}`,
        `TX ID: ${tx.txId}`,
        `Status: ${tx.success ? 'BROADCAST' : 'FAILED'}`,
        '',
        `Rental: ${est.total_rental_trx} TRX vs Burn: ${est.total_burn_trx} TRX (${est.savings_percent}% saved)`,
      ]
      if (tx.error) lines.push(`Error: ${tx.error}`)
      if (resInfo) lines.push('', resInfo)
      return textResult(lines.join('\n'))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const approveTrc20: McpTool = {
  name: 'approve_trc20',
  description: 'Approve TRC-20 spending allowance. Signs and broadcasts on-chain. Requires TRON_PRIVATE_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'Token symbol or contract address.' },
      spender: { type: 'string', description: 'Spender TRON address.' },
      amount: { type: 'string', description: 'Allowance amount (human-readable, or "unlimited").' },
    },
    required: ['token', 'spender', 'amount'],
  },
  async handler(input) {
    try {
      if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required. Use set_private_key first.')
      const sender = getAddress()
      const tokenInput = input.token as string
      const spender = input.spender as string
      const amount = input.amount as string

      const resolved = resolveToken(tokenInput)
      if (!resolved) return errorResult(`Unknown token: ${tokenInput}`)

      const res = await ensureResources(sender, 45000, 345)
      const resInfo = res ? formatResourceResult(res) : null

      const rawAmount = amount === 'unlimited'
        ? '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        : BigInt(Math.round(parseFloat(amount) * (10 ** resolved.decimals))).toString()

      const tx = await signApproveTrc20(resolved.address, spender, rawAmount)
      const label = tokenLabel(tokenInput, resolved.name)
      const lines = [
        `${label} Approval: ${amount} for ${spender}`,
        `TX ID: ${tx.txId}`,
        `Status: ${tx.success ? 'BROADCAST' : 'FAILED'}`,
      ]
      if (tx.error) lines.push(`Error: ${tx.error}`)
      if (resInfo) lines.push('', resInfo)
      return textResult(lines.join('\n'))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const getTokenInfo: McpTool = {
  name: 'get_token_info',
  description: 'Get TRC-20 token metadata: name, symbol, decimals, total supply. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'Token symbol or contract address.' },
    },
    required: ['token'],
  },
  async handler(input) {
    try {
      const tokenInput = input.token as string
      const resolved = resolveToken(tokenInput)
      if (!resolved) return errorResult(`Unknown token: ${tokenInput}`)
      const [nameHex, symbolHex, decHex, supplyHex] = await Promise.all([
        readContractField(resolved.address, 'name()'),
        readContractField(resolved.address, 'symbol()'),
        readContractField(resolved.address, 'decimals()'),
        readContractField(resolved.address, 'totalSupply()'),
      ])
      const name = decodeString(nameHex)
      const symbol = decodeString(symbolHex)
      const decimals = Number(decodeUint(decHex))
      const rawSupply = BigInt('0x' + (supplyHex || '0'))
      const supply = decimals > 0
        ? (Number(rawSupply) / 10 ** decimals).toFixed(2)
        : rawSupply.toString()
      return textResult(formatTokenInfo(resolved.address, name, symbol, decimals, supply))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const tokenTools: McpTool[] = [transferTrx, transferTrc20, approveTrc20, getTokenInfo]
