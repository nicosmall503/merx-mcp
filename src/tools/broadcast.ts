import { authPost, hasApiKey, hasPrivateKey } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

const broadcastTool: McpTool = {
  name: 'resource_broadcast',
  description: `Broadcast a signed TRON transaction with automatic energy optimization.
If the target address lacks sufficient energy, MERX purchases the deficit at the best
market price before broadcasting. One call: estimate, buy energy, wait for delegation, broadcast.

Requires MERX_API_KEY with the "broadcast" scope, and a pre-signed transaction.
Returns txid on success, refunds on timeout.

NOTE: This endpoint is currently behind a feature flag and disabled by default in production.
If you get a 503 MAINTENANCE error, use the manual flow instead: call ensure_resources to
provision energy, then sign and broadcast the transaction with your own TronWeb client.`,
  inputSchema: {
    type: 'object',
    properties: {
      signed_tx: {
        type: 'string',
        description: 'Hex-encoded signed TRON transaction',
      },
      target_address: {
        type: 'string',
        description: 'TRON address that will execute the transaction (must match TX sender)',
      },
    },
    required: ['signed_tx', 'target_address'],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  handler: async (args: Record<string, unknown>) => {
    if (!hasApiKey()) return errorResult('MERX_API_KEY required for broadcast.')

    const signedTx = args.signed_tx as string
    const targetAddress = args.target_address as string
    if (!signedTx || !targetAddress) return errorResult('signed_tx and target_address required.')

    try {
      const result = await authPost('/api/v1/broadcast', {
        signed_tx: signedTx,
        target_address: targetAddress,
      }) as Record<string, unknown>

      if (result.txid) {
        const lines = [
          `Transaction broadcast successful.`,
          `TX ID: ${result.txid}`,
          `Energy purchased: ${result.energy_bought ?? 0}`,
          `Cost: ${Number(result.cost_sun ?? 0) / 1_000_000} TRX`,
        ]
        if (result.delegation_expires_at) lines.push(`Delegation expires: ${result.delegation_expires_at}`)
        return textResult(lines.join('\n'))
      }

      return errorResult(`Broadcast failed: ${result.message ?? 'Unknown error'}`)
    } catch (err) {
      return errorResult((err as Error).message)
    }
  },
}

export const broadcastTools: McpTool[] = [broadcastTool]
