import { hasPrivateKey, hasApiKey } from '../lib/api.js'
import { textResult, errorResult, formatNumber } from '../lib/formatter.js'
import { getQuote, estimateSwapEnergy, getDecimals } from '../lib/sunswap.js'
import { executeSwap } from '../lib/sunswap-exec.js'
import { ensureResources, getSenderAddress, formatResourceResult } from '../lib/resource-manager.js'
import type { McpTool } from '../types.js'

const SWAP_BANDWIDTH = 500

function formatQuoteResult(
  q: { fromSymbol: string; toSymbol: string; amountIn: string; amountOut: string; priceImpactEstimate: string },
  slippage: number
): string {
  const minOut = (parseFloat(q.amountOut) * (1 - slippage / 100)).toFixed(6)
  return [
    `Swap Quote: ${q.amountIn} ${q.fromSymbol} -> ${q.toSymbol}`,
    '-------------------------------------------',
    `  Expected output: ${q.amountOut} ${q.toSymbol}`,
    `  Min output (${slippage}% slippage): ${minOut} ${q.toSymbol}`,
    `  Price impact: ${q.priceImpactEstimate}`,
    `  Energy required: estimated at execution time (full simulation)`,
    `  Bandwidth required: ~${formatNumber(SWAP_BANDWIDTH)}`,
  ].join('\n')
}

function formatSwapResult(
  r: { txId: string; success: boolean; fromSymbol: string; toSymbol: string; amountIn: string; amountOut: string; error: string | null },
  resourceInfo: string | null
): string {
  const lines = [
    `Swap ${r.success ? 'Broadcast' : 'Failed'}: ${r.amountIn} ${r.fromSymbol} -> ${r.toSymbol}`,
    '-------------------------------------------',
    `  TX ID: ${r.txId}`,
    `  Expected output: ${r.amountOut} ${r.toSymbol}`,
    `  Status: ${r.success ? 'BROADCAST' : 'FAILED'}`,
  ]
  if (r.error) lines.push(`  Error: ${r.error}`)
  if (resourceInfo) lines.push('', resourceInfo)
  if (r.success) lines.push('', `  https://tronscan.org/#/transaction/${r.txId}`)
  return lines.join('\n')
}

async function fetchTrxUsdPrice(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd'
    )
    const data = await res.json() as { tron?: { usd?: number } }
    return data.tron?.usd ?? null
  } catch {
    return null
  }
}

async function handleExecuteSwap(input: Record<string, unknown>) {
  const slippage = (input.slippage as number) ?? 1
  const fromToken = input.from_token as string
  const toToken = input.to_token as string
  const amount = input.amount as string
  const sender = getSenderAddress()

  // Get quote first to have minOut for simulation
  const quote = await getQuote(fromToken, toToken, amount)
  const minOutRaw = (BigInt(quote.amountOutRaw) * BigInt(Math.floor((100 - slippage) * 100)) / 10000n).toString()

  // Simulate exact swap call to get precise energy
  const energyNeeded = await estimateSwapEnergy(fromToken, toToken, amount, minOutRaw, sender)

  // Acquire resources based on real simulation
  let resourceInfo: string | null = null
  if (hasApiKey()) {
    const r = await ensureResources(sender, energyNeeded, SWAP_BANDWIDTH)
    resourceInfo = r ? formatResourceResult(r) : null
  }

  const result = await executeSwap(fromToken, toToken, amount, slippage, sender)
  return textResult(formatSwapResult(result, resourceInfo))
}

function formatTokenPriceLines(token: string, amountOut: string, trxUsd: number | null): string[] {
  const lines = [`Token: ${token}`, '-------------------------------------------', `  1 TRX = ${amountOut} ${token}`]
  const priceInTrx = parseFloat(amountOut)
  if (priceInTrx > 0) {
    lines.push(`  1 ${token} = ${(1 / priceInTrx).toFixed(6)} TRX`)
    if (trxUsd) lines.push(`  1 ${token} ~ $${(trxUsd / priceInTrx).toFixed(4)} USD`)
  }
  return lines
}

async function handleGetTokenPrice(input: Record<string, unknown>) {
  const token = (input.token as string).toUpperCase()
  if (token === 'TRX') {
    const usdPrice = await fetchTrxUsdPrice()
    const lines = ['Token: TRX', '-------------------------------------------']
    lines.push(usdPrice ? `  Price: $${usdPrice.toFixed(4)} USD` : '  USD price unavailable')
    return textResult(lines.join('\n'))
  }
  const quote = await getQuote('TRX', token, '1')
  const trxUsd = await fetchTrxUsdPrice()
  return textResult(formatTokenPriceLines(token, quote.amountOut, trxUsd).join('\n'))
}

// --- Tools ---

const getSwapQuoteTool: McpTool = {
  name: 'get_swap_quote',
  description: 'Get a real swap quote from SunSwap V2. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      from_token: { type: 'string', description: 'Source token symbol (TRX, USDT, USDC, etc.)' },
      to_token: { type: 'string', description: 'Destination token symbol' },
      amount: { type: 'string', description: 'Amount of source token to swap' },
      slippage: { type: 'number', description: 'Slippage tolerance in percent (default 1)' },
    },
    required: ['from_token', 'to_token', 'amount'],
  },
  async handler(input) {
    try {
      const slippage = (input.slippage as number) ?? 1
      const quote = await getQuote(input.from_token as string, input.to_token as string, input.amount as string)
      return textResult(formatQuoteResult(quote, slippage))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

const executeSwapTool: McpTool = {
  name: 'execute_swap',
  description: 'Execute a token swap on SunSwap V2. Requires TRON_PRIVATE_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      from_token: { type: 'string', description: 'Source token symbol (TRX, USDT, USDC, etc.)' },
      to_token: { type: 'string', description: 'Destination token symbol' },
      amount: { type: 'string', description: 'Amount of source token to swap' },
      slippage: { type: 'number', description: 'Slippage tolerance in percent (default 1)' },
    },
    required: ['from_token', 'to_token', 'amount'],
  },
  async handler(input) {
    if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required for swaps')
    try {
      return await handleExecuteSwap(input)
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

const getTokenPriceTool: McpTool = {
  name: 'get_token_price',
  description: 'Get token price via SunSwap quote + CoinGecko USD rate. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'Token symbol (USDT, USDC, SUN, etc.)' },
    },
    required: ['token'],
  },
  async handler(input) {
    try {
      return await handleGetTokenPrice(input)
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

export const dexTools: McpTool[] = [getSwapQuoteTool, executeSwapTool, getTokenPriceTool]
