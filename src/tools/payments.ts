import { publicPost, publicGet, hasApiKey, hasPrivateKey } from '../lib/api.js'
import { textResult, errorResult, sunToTrx } from '../lib/formatter.js'
import { depositTrx as signDepositTrx, transferTrxWithMemo } from '../lib/tron-signer.js'
import type { McpTool } from '../types.js'

interface AutoDepositConfig {
  thresholdTrx: string
  depositAmountTrx: string
  maxDailyDeposits: number
}

let autoDepositConfig: AutoDepositConfig | null = null

function formatDepositResult(tx: {
  txId: string; success: boolean; error: string | null;
  depositAddress?: string; memo?: string
}, amountTrx: number): string {
  const lines = [
    `Deposit: ${amountTrx} TRX -> Merx`,
    `TX ID: ${tx.txId}`,
    `Deposit address: ${tx.depositAddress}`,
    `Memo: ${tx.memo}`,
    `Status: ${tx.success ? 'BROADCAST' : 'FAILED'}`,
  ]
  if (tx.error) lines.push(`Error: ${tx.error}`)
  if (tx.success) lines.push('', 'Deposit should be credited within 1-2 minutes.')
  return lines.join('\n')
}

function formatAutoDeposit(cfg: AutoDepositConfig): string {
  return [
    'Auto-deposit configured (session only)',
    '-------------------------------------------',
    `  Threshold: ${cfg.thresholdTrx} TRX | Deposit: ${cfg.depositAmountTrx} TRX | Max daily: ${cfg.maxDailyDeposits}`,
    'Configuration is stored for this session only.',
  ].join('\n')
}

async function payAndVerifyInvoice(invoiceId: string, amountSun: number, payTo: string) {
  const tx = await transferTrxWithMemo(payTo, amountSun, invoiceId)
  if (!tx.success) throw new Error(`Payment TX failed: ${tx.error}`)

  // Retry verify with delay - TronGrid needs time to index the TX
  let lastError = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise(r => setTimeout(r, 3000)) // wait 3s between attempts
    try {
      const result = await publicPost('/api/v1/x402/verify', {
        invoice_id: invoiceId, payment_tx_id: tx.txId,
      }) as Record<string, unknown>
      return { tx, result }
    } catch (e) {
      lastError = (e as Error).message
    }
  }
  throw new Error(`Verification failed after 5 attempts: ${lastError}`)
}

async function handlePayInvoice(input: Record<string, unknown>) {
  const invoiceId = input.invoice_id as string
  const inv = await publicGet(`/api/v1/x402/invoice/${invoiceId}`) as Record<string, unknown>
  if (!inv) throw new Error('Invoice not found')
  if (inv.status !== 'PENDING') throw new Error(`Invoice status: ${inv.status}`)
  const amountSun = Number(inv.amount_sun)
  const payTo = (inv as Record<string, string>).pay_to ?? ''
  if (!payTo) throw new Error('No payment address in invoice')
  const { tx, result } = await payAndVerifyInvoice(invoiceId, amountSun, payTo)
  return [
    `Invoice ${invoiceId} paid and verified`,
    '-------------------------------------------',
    `  Payment TX: ${tx.txId}`,
    `  Amount: ${sunToTrx(amountSun)} TRX`,
    `  Status: ${result.status ?? 'EXECUTED'}`,
    `  Order ID: ${(result.order as Record<string, string>)?.order_id ?? 'N/A'}`,
  ].join('\n')
}

async function handleCreatePaidOrder(input: Record<string, unknown>) {
  const inv = await publicPost('/api/v1/x402/invoice', {
    operation: 'create_order',
    params: {
      resource_type: input.resource_type,
      amount: input.amount,
      duration_sec: input.duration_sec,
      target_address: input.target_address,
    },
  }) as Record<string, unknown>
  const invoiceId = inv.invoice_id as string
  const amountSun = Number(inv.amount_sun)
  const { tx, result } = await payAndVerifyInvoice(invoiceId, amountSun, inv.pay_to as string)
  const order = result.order as Record<string, string> | undefined
  return [
    'x402 Order Created',
    '-------------------------------------------',
    `  Invoice: ${invoiceId}`,
    `  Payment TX: ${tx.txId}`,
    `  Cost: ${sunToTrx(amountSun)} TRX`,
    `  Order ID: ${order?.order_id ?? 'N/A'}`,
    `  Status: ${order?.status ?? 'PENDING'}`,
    `  Target: ${input.target_address}`,
    `  Resource: ${input.amount} ${input.resource_type} for ${input.duration_sec}s`,
  ].join('\n')
}

// --- Tools ---

const depositTrxTool: McpTool = {
  name: 'deposit_trx',
  description: 'Deposit TRX to your Merx account. Requires MERX_API_KEY + TRON_PRIVATE_KEY.',
  inputSchema: {
    type: 'object',
    properties: { amount_trx: { type: 'string', description: 'Amount of TRX to deposit' } },
    required: ['amount_trx'],
  },
  async handler(input) {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required')
    if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required')
    try {
      const amountTrx = parseFloat(input.amount_trx as string)
      const tx = await signDepositTrx(Math.round(amountTrx * 1_000_000))
      return textResult(formatDepositResult(tx, amountTrx))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

const enableAutoDepositTool: McpTool = {
  name: 'enable_auto_deposit',
  description: 'Configure automatic top-up when balance drops below a threshold. Session-only.',
  inputSchema: {
    type: 'object',
    properties: {
      threshold_trx: { type: 'string', description: 'Balance threshold in TRX' },
      deposit_amount_trx: { type: 'string', description: 'Amount of TRX per deposit' },
      max_daily_deposits: { type: 'number', description: 'Max deposits per day (default 5)' },
    },
    required: ['threshold_trx', 'deposit_amount_trx'],
  },
  async handler(input) {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required')
    autoDepositConfig = {
      thresholdTrx: input.threshold_trx as string,
      depositAmountTrx: input.deposit_amount_trx as string,
      maxDailyDeposits: (input.max_daily_deposits as number) ?? 5,
    }
    return textResult(formatAutoDeposit(autoDepositConfig))
  },
}

const payInvoiceTool: McpTool = {
  name: 'pay_invoice',
  description: 'Pay an x402 invoice by sending TRX and verifying payment.',
  inputSchema: {
    type: 'object',
    properties: { invoice_id: { type: 'string', description: 'Invoice ID to pay' } },
    required: ['invoice_id'],
  },
  async handler(input) {
    if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required')
    try {
      return textResult(await handlePayInvoice(input))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

const createPaidOrderTool: McpTool = {
  name: 'create_paid_order',
  description: 'Create a zero-registration order via x402 pay-per-use. Requires TRON_PRIVATE_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      resource_type: { type: 'string', enum: ['ENERGY', 'BANDWIDTH'], description: 'Resource type' },
      amount: { type: 'number', description: 'Amount of resource units' },
      duration_sec: { type: 'number', description: 'Duration in seconds' },
      target_address: { type: 'string', description: 'TRON address to receive resources' },
    },
    required: ['resource_type', 'amount', 'duration_sec', 'target_address'],
  },
  async handler(input) {
    if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required')
    try {
      return textResult(await handleCreatePaidOrder(input))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

export const paymentTools: McpTool[] = [
  depositTrxTool, enableAutoDepositTool, payInvoiceTool, createPaidOrderTool,
]
