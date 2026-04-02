import { TronWeb } from 'tronweb'

const BASE_URL = process.env.MERX_BASE_URL ?? 'https://merx.exchange'

function getTronWeb(): InstanceType<typeof TronWeb> {
  const pk = process.env.TRON_PRIVATE_KEY
  if (!pk) throw new Error('TRON_PRIVATE_KEY is required for signing')
  const fullHost = process.env.TRON_FULL_NODE ?? 'https://api.trongrid.io'
  const tw = new TronWeb({ fullHost, privateKey: pk })
  const tgKey = process.env.TRONGRID_API_KEY
  if (tgKey) tw.setHeader({ 'TRON-PRO-API-KEY': tgKey })
  return tw
}

export function getAddress(): string {
  const pk = process.env.TRON_PRIVATE_KEY
  if (!pk) throw new Error('TRON_PRIVATE_KEY is required')
  if (process.env.TRON_ADDRESS) return process.env.TRON_ADDRESS
  const derived = TronWeb.address.fromPrivateKey(pk) as string | false
  if (derived) process.env.TRON_ADDRESS = derived as string
  return (derived || 'unknown') as string
}

export async function transferTrx(to: string, amountSun: number): Promise<TxResult> {
  const tw = getTronWeb()
  const tx = await tw.transactionBuilder.sendTrx(to, amountSun, getAddress())
  const signed = await tw.trx.sign(tx)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

export async function transferTrc20(
  token: string, to: string, amountRaw: string
): Promise<TxResult> {
  const tw = getTronWeb()
  const { transaction } = await tw.transactionBuilder.triggerSmartContract(
    token, 'transfer(address,uint256)', { feeLimit: 100_000_000 },
    [{ type: 'address', value: to }, { type: 'uint256', value: amountRaw }],
    getAddress(),
  )
  const signed = await tw.trx.sign(transaction)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

export async function approveTrc20(
  token: string, spender: string, amountRaw: string
): Promise<TxResult> {
  const tw = getTronWeb()
  const { transaction } = await tw.transactionBuilder.triggerSmartContract(
    token, 'approve(address,uint256)', { feeLimit: 100_000_000 },
    [{ type: 'address', value: spender }, { type: 'uint256', value: amountRaw }],
    getAddress(),
  )
  const signed = await tw.trx.sign(transaction)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

export async function callContract(
  contract: string, selector: string,
  params: Array<{ type: string; value: string }>,
  callValueSun?: number,
): Promise<TxResult> {
  const tw = getTronWeb()
  const opts: Record<string, unknown> = { feeLimit: 100_000_000 }
  if (callValueSun) opts.callValue = callValueSun
  const { transaction } = await tw.transactionBuilder.triggerSmartContract(
    contract, selector, opts, params, getAddress(),
  )
  const signed = await tw.trx.sign(transaction)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

export async function depositTrx(amountSun: number): Promise<TxResult> {
  const apiKey = process.env.MERX_API_KEY
  if (!apiKey) throw new Error('MERX_API_KEY required for deposit info')
  const res = await fetch(`${BASE_URL}/api/v1/deposit/info`, {
    headers: { 'x-api-key': apiKey },
  })
  const body = await res.json() as Record<string, unknown>
  const data = body.data as Record<string, string> | undefined
  if (!data?.address || !data?.memo) throw new Error('Could not get deposit address')

  const tw = getTronWeb()
  let tx = await tw.transactionBuilder.sendTrx(data.address, amountSun, getAddress())
  // Add memo via addUpdateData or direct manipulation
  try {
    tx = await tw.transactionBuilder.addUpdateData(tx, Buffer.from(data.memo, 'utf-8').toString('hex'), 'hex')
  } catch {
    // Fallback: set data field directly
    if (tx.raw_data) tx.raw_data.data = Buffer.from(data.memo, 'utf-8').toString('hex')
  }
  const signed = await tw.trx.sign(tx)
  const result = await tw.trx.sendRawTransaction(signed)
  return {
    txId: signed.txID, success: result.result === true, error: result.message ?? null,
    depositAddress: data.address, memo: data.memo,
  }
}

export async function transferTrxWithMemo(
  to: string, amountSun: number, memo: string
): Promise<TxResult> {
  const tw = getTronWeb()
  let tx = await tw.transactionBuilder.sendTrx(to, amountSun, getAddress())
  try {
    tx = await tw.transactionBuilder.addUpdateData(
      tx, Buffer.from(memo, 'utf-8').toString('hex'), 'hex'
    )
  } catch {
    if (tx.raw_data) tx.raw_data.data = Buffer.from(memo, 'utf-8').toString('hex')
  }
  const signed = await tw.trx.sign(tx)
  const result = await tw.trx.sendRawTransaction(signed)
  return { txId: signed.txID, success: result.result === true, error: result.message ?? null }
}

export interface TxResult {
  txId: string
  success: boolean
  error: string | null
  depositAddress?: string
  memo?: string
}
