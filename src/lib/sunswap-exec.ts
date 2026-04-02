import { TronWeb } from 'tronweb'
import { ROUTER, WTRX, resolveToken, getDecimals, getQuote } from './sunswap.js'
import { getAddress } from './tron-signer.js'
import { approveTrc20 } from './tron-signer.js'
import type { SwapResult } from './sunswap.js'

function getSigningTronWeb(): InstanceType<typeof TronWeb> {
  const pk = process.env.TRON_PRIVATE_KEY
  if (!pk) throw new Error('TRON_PRIVATE_KEY is required for swaps')
  const tw = new TronWeb({ fullHost: 'https://api.trongrid.io', privateKey: pk })
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

function getDeadline(): number {
  return Math.floor(Date.now() / 1000) + 300
}

function isTrx(symbol: string): boolean {
  return symbol.toUpperCase() === 'TRX'
}

function computeMinOut(amountOutRaw: string, slippagePct: number): string {
  const out = BigInt(amountOutRaw)
  const factor = BigInt(Math.floor((100 - slippagePct) * 100))
  return (out * factor / 10000n).toString()
}

async function swapTrxForToken(
  tw: InstanceType<typeof TronWeb>, path: string[],
  amountInSun: string, minOut: string, sender: string
): Promise<{ txId: string; success: boolean; error: string | null }> {
  const deadline = getDeadline()
  const selector = 'swapExactETHForTokens(uint256,address[],address,uint256)'
  const params = [
    { type: 'uint256', value: minOut },
    { type: 'address[]', value: path },
    { type: 'address', value: sender },
    { type: 'uint256', value: String(deadline) },
  ]
  const opts = { feeLimit: 150_000_000, callValue: Number(amountInSun) }
  const { transaction } = await tw.transactionBuilder.triggerSmartContract(
    ROUTER, selector, opts, params, sender,
  )
  const signed = await tw.trx.sign(transaction)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

async function swapTokenForTrx(
  tw: InstanceType<typeof TronWeb>, path: string[],
  amountIn: string, minOut: string, sender: string
): Promise<{ txId: string; success: boolean; error: string | null }> {
  const deadline = getDeadline()
  const selector = 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)'
  const params = [
    { type: 'uint256', value: amountIn },
    { type: 'uint256', value: minOut },
    { type: 'address[]', value: path },
    { type: 'address', value: sender },
    { type: 'uint256', value: String(deadline) },
  ]
  const { transaction } = await tw.transactionBuilder.triggerSmartContract(
    ROUTER, selector, { feeLimit: 150_000_000 }, params, sender,
  )
  const signed = await tw.trx.sign(transaction)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

async function swapTokenForToken(
  tw: InstanceType<typeof TronWeb>, path: string[],
  amountIn: string, minOut: string, sender: string
): Promise<{ txId: string; success: boolean; error: string | null }> {
  const deadline = getDeadline()
  const selector = 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)'
  const params = [
    { type: 'uint256', value: amountIn },
    { type: 'uint256', value: minOut },
    { type: 'address[]', value: path },
    { type: 'address', value: sender },
    { type: 'uint256', value: String(deadline) },
  ]
  const { transaction } = await tw.transactionBuilder.triggerSmartContract(
    ROUTER, selector, { feeLimit: 150_000_000 }, params, sender,
  )
  const signed = await tw.trx.sign(transaction)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

export async function executeSwap(
  fromSymbol: string, toSymbol: string,
  amountHuman: string, slippage: number, senderAddress: string
): Promise<SwapResult> {
  const tw = getSigningTronWeb()
  const quote = await getQuote(fromSymbol, toSymbol, amountHuman)
  const minOut = computeMinOut(quote.amountOutRaw, slippage)
  const fromDecimals = getDecimals(fromSymbol)
  const rawAmountIn = humanToRaw(amountHuman, fromDecimals)
  const fromIsTrx = isTrx(fromSymbol)
  const toIsTrx = isTrx(toSymbol)
  const path = [resolveToken(fromSymbol), resolveToken(toSymbol)]

  if (!fromIsTrx) {
    await approveTrc20(path[0], ROUTER, rawAmountIn)
  }

  let result: { txId: string; success: boolean; error: string | null }
  if (fromIsTrx) {
    result = await swapTrxForToken(tw, path, rawAmountIn, minOut, senderAddress)
  } else if (toIsTrx) {
    result = await swapTokenForTrx(tw, path, rawAmountIn, minOut, senderAddress)
  } else {
    result = await swapTokenForToken(tw, path, rawAmountIn, minOut, senderAddress)
  }

  return {
    txId: result.txId,
    success: result.success,
    fromSymbol: fromSymbol.toUpperCase(),
    toSymbol: toSymbol.toUpperCase(),
    amountIn: amountHuman,
    amountOut: quote.amountOut,
    error: result.error,
  }
}
