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
    'Withdraw TRX or USDT from your Merx account to an external TRON address. The "amount" parameter is interpreted in the currency specified by "currency" — i.e. for currency=TRX it is TRX units, for currency=USDT it is USDT units. (The legacy parameter "amount_trx" is still accepted as an alias for backwards compatibility, but is misleading when currency is USDT — prefer "amount" in new code.) Requires MERX_API_KEY.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Destination TRON address (starts with T).',
      },
      amount: {
        type: 'string',
        description: 'Amount to withdraw, in units of the chosen currency. E.g. "100" with currency=TRX = 100 TRX, "100" with currency=USDT = 100 USDT.',
      },
      currency: {
        type: 'string',
        enum: ['TRX', 'USDT'],
        description: 'Currency to withdraw. Default: TRX.',
      },
      amount_trx: {
        type: 'string',
        description: 'DEPRECATED alias for "amount" — kept for backwards compatibility. Pass "amount" instead in new code.',
      },
    },
    required: ['address'],
  },
  async handler(input) {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required')

    const address = input.address as string
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
      return errorResult('Invalid TRON address. Must start with T and be 34 characters.')
    }

    // Accept either `amount` (preferred) or `amount_trx` (legacy alias)
    const rawAmount = input.amount ?? input.amount_trx
    if (rawAmount == null) {
      return errorResult('amount is required (pass "amount" in the chosen currency, or the legacy "amount_trx" alias).')
    }
    const amountFloat = parseFloat(String(rawAmount))
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return errorResult('amount must be a positive number.')
    }

    // Both TRX and USDT have 6 decimals on TRON, so SUN conversion applies to both
    const amountSun = Math.round(amountFloat * 1_000_000)
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
