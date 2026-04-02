import { authPost, hasApiKey } from '../lib/api.js'
import { textResult, errorResult, sunToTrx } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

interface WithdrawResponse {
  id: string
  status: string
  amount: number
  currency: string
  address: string
}

const withdrawTool: McpTool = {
  name: 'withdraw',
  description:
    'Withdraw TRX or USDT from your Merx account to an external TRON address. Requires MERX_API_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Destination TRON address (starts with T).',
      },
      amount_trx: {
        type: 'string',
        description: 'Amount to withdraw in TRX (e.g. "100"). Converted to SUN internally.',
      },
      currency: {
        type: 'string',
        enum: ['TRX', 'USDT'],
        description: 'Currency to withdraw. Default: TRX.',
      },
    },
    required: ['address', 'amount_trx'],
  },
  async handler(input) {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required')

    const address = input.address as string
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
      return errorResult('Invalid TRON address. Must start with T and be 34 characters.')
    }

    const amountTrx = parseFloat(input.amount_trx as string)
    if (isNaN(amountTrx) || amountTrx <= 0) {
      return errorResult('amount_trx must be a positive number.')
    }

    const amountSun = Math.round(amountTrx * 1_000_000)
    const currency = (input.currency as string) || 'TRX'

    try {
      const data = (await authPost('/api/v1/withdraw', {
        address,
        amount: amountSun,
        currency,
      })) as WithdrawResponse

      const lines = [
        'Withdrawal Submitted',
        '--------------------',
        `  ID:       ${data.id}`,
        `  Status:   ${data.status}`,
        `  Amount:   ${sunToTrx(data.amount)} ${data.currency}`,
        `  Address:  ${data.address}`,
        '',
        'Withdrawal is processing. Check status in your account.',
      ]
      return textResult(lines.join('\n'))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

export const withdrawTools = [withdrawTool]
