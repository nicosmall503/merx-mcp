import { authPost, hasApiKey } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

const compilePolicyTool: McpTool = {
  name: 'compile_policy',
  description: `Convert a natural language energy management policy into MERX automation. Creates standing orders and monitors based on your instructions.

Examples:
- "Keep 500k energy on my wallet, buy when price is below 55 SUN, max 200 TRX/week"
- "Buy energy every day at 6 AM UTC, 1 million units, for 24 hours"
- "Alert me when my energy drops below 100k"

Returns a preview of what will be created. Set apply=true to execute.`,
  inputSchema: {
    type: 'object',
    properties: {
      instruction: {
        type: 'string',
        description: 'Natural language description of the desired automation policy',
      },
      address: {
        type: 'string',
        description: 'TRON address this policy applies to (optional)',
      },
      apply: {
        type: 'boolean',
        description: 'Set to true to create the standing orders. Default false (preview only).',
      },
    },
    required: ['instruction'],
  },
  handler: async (args: Record<string, unknown>) => {
    if (!hasApiKey()) return errorResult('MERX_API_KEY is required for policy compilation.')

    const instruction = args.instruction as string
    if (!instruction) return errorResult('instruction parameter is required.')

    try {
      const compiled = await authPost('/api/v1/policy/compile', {
        natural_language: instruction,
        context: args.address ? { address: args.address } : undefined,
      }) as { policy: { preview_text: string; warnings: Array<{ severity: string; message: string }> } }

      const policy = compiled.policy
      // Avoid duplicating Warnings: the backend's preview_text (LLM-generated) often
      // already mentions warnings inline. Only append our own block if preview_text
      // does NOT contain a "Warnings:" / "Warning:" header.
      const previewHasWarnings = /\bwarning(s)?\s*:/i.test(policy.preview_text)
      const warningText = (!previewHasWarnings && policy.warnings.length > 0)
        ? '\n\nWarnings:\n' + policy.warnings.map(w => `[${w.severity.toUpperCase()}] ${w.message}`).join('\n')
        : ''

      if (args.apply !== true) {
        return textResult(`${policy.preview_text}${warningText}\n\nSet apply=true to create these standing orders.`)
      }

      const result = await authPost('/api/v1/policy/apply', { policy }) as { summary: string; standing_order_ids: string[]; monitor_ids: string[] }
      return textResult(`${result.summary}\n\nStanding order IDs: ${result.standing_order_ids.join(', ')}\nMonitor IDs: ${result.monitor_ids.join(', ') || 'none'}`)
    } catch (err) {
      return errorResult((err as Error).message)
    }
  },
}

export const policyTools: McpTool[] = [compilePolicyTool]
