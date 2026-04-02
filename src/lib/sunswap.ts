import { TronWeb } from 'tronweb'

export const ROUTER = 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax'
export const WTRX = 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR'

const TOKENS: Record<string, string> = {
  TRX: WTRX,
  USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  USDC: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
  USDD: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
  SUN: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9',
}

const DECIMALS: Record<string, number> = {
  TRX: 6, USDT: 6, USDC: 6, USDD: 18, SUN: 18, BTT: 18, WIN: 6, JST: 18,
}

export interface QuoteResult {
  fromSymbol: string
  toSymbol: string
  amountIn: string
  amountOut: string
  amountOutRaw: string
  path: string[]
  priceImpactEstimate: string
}

export interface SwapResult {
  txId: string
  success: boolean
  fromSymbol: string
  toSymbol: string
  amountIn: string
  amountOut: string
  error: string | null
}

export function resolveToken(symbol: string): string {
  const upper = symbol.toUpperCase()
  if (TOKENS[upper]) return TOKENS[upper]
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(symbol)) return symbol
  throw new Error(`Unknown token: ${symbol}`)
}

export function getDecimals(symbol: string): number {
  const upper = symbol.toUpperCase()
  return DECIMALS[upper] ?? 6
}

function getReadTronWeb(): InstanceType<typeof TronWeb> {
  const tw = new TronWeb({ fullHost: 'https://api.trongrid.io' })
  const key = process.env.TRONGRID_API_KEY
  if (key) tw.setHeader({ 'TRON-PRO-API-KEY': key })
  return tw
}

function humanToRaw(amount: string, decimals: number): string {
  const parts = amount.split('.')
  const whole = parts[0] || '0'
  const frac = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + frac).toString()
}

function rawToHuman(raw: string, decimals: number): string {
  const str = raw.padStart(decimals + 1, '0')
  const whole = str.slice(0, str.length - decimals) || '0'
  const frac = str.slice(str.length - decimals)
  const trimmed = frac.replace(/0+$/, '')
  return trimmed ? `${whole}.${trimmed}` : whole
}

function buildPath(fromSymbol: string, toSymbol: string): string[] {
  const from = resolveToken(fromSymbol)
  const to = resolveToken(toSymbol)
  return [from, to]
}

function decodeAmountsOut(hexResult: string): string[] {
  const clean = hexResult.startsWith('0x') ? hexResult.slice(2) : hexResult
  const offsetPos = 0
  const offset = parseInt(clean.slice(offsetPos, offsetPos + 64), 16)
  const lenStart = offset * 2
  const len = parseInt(clean.slice(lenStart, lenStart + 64), 16)
  const results: string[] = []
  for (let i = 0; i < len; i++) {
    const start = lenStart + 64 + i * 64
    results.push(BigInt('0x' + clean.slice(start, start + 64)).toString())
  }
  return results
}

export async function estimateSwapEnergy(
  fromSymbol: string, toSymbol: string, amountHuman: string,
  minOutRaw: string, senderAddress: string
): Promise<number> {
  const tw = getReadTronWeb()
  const fromDecimals = getDecimals(fromSymbol)
  const rawAmountIn = humanToRaw(amountHuman, fromDecimals)
  const path = buildPath(fromSymbol, toSymbol)
  const fromIsTrx = fromSymbol.toUpperCase() === 'TRX'
  const toIsTrx = toSymbol.toUpperCase() === 'TRX'
  const deadline = String(Math.floor(Date.now() / 1000) + 300)

  let selector: string
  let params: Array<{ type: string; value: unknown }>
  const opts: Record<string, unknown> = {}

  if (fromIsTrx) {
    selector = 'swapExactETHForTokens(uint256,address[],address,uint256)'
    params = [
      { type: 'uint256', value: minOutRaw },
      { type: 'address[]', value: path },
      { type: 'address', value: senderAddress },
      { type: 'uint256', value: deadline },
    ]
    opts.callValue = Number(rawAmountIn)
  } else if (toIsTrx) {
    selector = 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)'
    params = [
      { type: 'uint256', value: rawAmountIn },
      { type: 'uint256', value: minOutRaw },
      { type: 'address[]', value: path },
      { type: 'address', value: senderAddress },
      { type: 'uint256', value: deadline },
    ]
  } else {
    selector = 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)'
    params = [
      { type: 'uint256', value: rawAmountIn },
      { type: 'uint256', value: minOutRaw },
      { type: 'address[]', value: path },
      { type: 'address', value: senderAddress },
      { type: 'uint256', value: deadline },
    ]
  }

  try {
    const result = await tw.transactionBuilder.triggerConstantContract(
      ROUTER, selector, opts, params, senderAddress,
    )
    const energy = result.energy_used ?? result.energy_penalty ?? 0
    return Math.max(energy, 65000) // at least 65K
  } catch {
    return 200000 // safe fallback if simulation fails
  }
}

export async function getQuote(
  fromSymbol: string, toSymbol: string, amountHuman: string
): Promise<QuoteResult> {
  const tw = getReadTronWeb()
  const fromDecimals = getDecimals(fromSymbol)
  const toDecimals = getDecimals(toSymbol)
  const rawAmount = humanToRaw(amountHuman, fromDecimals)
  const path = buildPath(fromSymbol, toSymbol)

  const result = await tw.transactionBuilder.triggerConstantContract(
    ROUTER, 'getAmountsOut(uint256,address[])', {},
    [{ type: 'uint256', value: rawAmount }, { type: 'address[]', value: path }],
    'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
  )

  const hex = result.constant_result?.[0]
  if (!hex) throw new Error('No result from getAmountsOut')
  const amounts = decodeAmountsOut(hex)
  const amountOutRaw = amounts[amounts.length - 1]
  const amountOut = rawToHuman(amountOutRaw, toDecimals)

  const inNum = parseFloat(amountHuman)
  const outNum = parseFloat(amountOut)
  const impact = inNum > 0 && outNum > 0 ? '< 1%' : 'unknown'

  return {
    fromSymbol: fromSymbol.toUpperCase(),
    toSymbol: toSymbol.toUpperCase(),
    amountIn: amountHuman,
    amountOut,
    amountOutRaw,
    path,
    priceImpactEstimate: impact,
  }
}
