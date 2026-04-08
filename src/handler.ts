import type { McpRequest, McpResponse, McpTool } from './types.js'
import { pricingTools }       from './tools/prices.js'
import { estimationTools }    from './tools/estimation.js'
import { tradingTools }       from './tools/trading.js'
import { accountTools }       from './tools/account.js'
import { convenienceTools }   from './tools/convenience.js'
import { chainTools }         from './tools/chain.js'
import { networkTools }       from './tools/network.js'
import { tokenTools }         from './tools/tokens.js'
import { contractTools }      from './tools/contracts.js'
import { dexTools }           from './tools/dex.js'
import { onboardingTools }    from './tools/onboarding.js'
import { paymentTools }       from './tools/payments.js'
import { intentTools }        from './tools/intent.js'
import { standingOrderTools } from './tools/standing-orders.js'
import { withdrawTools }      from './tools/withdraw.js'
import { policyTools }        from './tools/compile-policy.js'
import { broadcastTools }    from './tools/broadcast.js'
import { agentPaymentTools } from './tools/agent-payments.js'
import { TOOL_ANNOTATIONS }   from './tools/annotations.js'
import { ALL_PROMPTS }        from './prompts/index.js'
import { STATIC_RESOURCES, RESOURCE_TEMPLATES, readResource } from './resources/index.js'

const TOOLS: McpTool[] = [
  ...pricingTools, ...estimationTools, ...tradingTools,
  ...accountTools, ...convenienceTools, ...chainTools,
  ...networkTools, ...tokenTools, ...contractTools,
  ...dexTools, ...onboardingTools, ...paymentTools,
  ...intentTools, ...standingOrderTools, ...withdrawTools, ...policyTools, ...broadcastTools,
  ...agentPaymentTools,
]

// Apply annotations from central registry
for (const t of TOOLS) {
  if (TOOL_ANNOTATIONS[t.name]) t.annotations = TOOL_ANNOTATIONS[t.name]
}

const toolMap = new Map(TOOLS.map(t => [t.name, t]))
const promptMap = new Map(ALL_PROMPTS.map(p => [p.name, p]))

export async function handleRequest(req: McpRequest): Promise<McpResponse> {
  try {
    let result: unknown
    switch (req.method) {
      case 'initialize': {
        const clientVersion = (req.params as Record<string, unknown>)?.protocolVersion as string ?? '2024-11-05'
        const supported = ['2024-11-05', '2025-03-26', '2025-06-18']
        const version = supported.includes(clientVersion) ? clientVersion : '2024-11-05'
        result = {
          protocolVersion: version,
          capabilities: { tools: {}, prompts: {}, resources: {} },
          serverInfo: { name: 'merx', version: '2.0.0' },
        }
        break
      }
      case 'notifications/initialized':
        result = {}
        break
      case 'tools/list':
        result = { tools: TOOLS.map(t => ({
          name: t.name, description: t.description, inputSchema: t.inputSchema,
          ...(t.annotations ? { annotations: t.annotations } : {}),
        })) }
        break
      case 'tools/call':
        result = await callTool(req.params ?? {})
        break
      case 'prompts/list':
        result = { prompts: ALL_PROMPTS.map(p => ({ name: p.name, description: p.description, arguments: p.arguments })) }
        break
      case 'prompts/get':
        result = getPrompt(req.params ?? {})
        break
      case 'resources/list':
        result = { resources: STATIC_RESOURCES, resourceTemplates: RESOURCE_TEMPLATES }
        break
      case 'resources/read':
        result = { contents: [await readResource((req.params?.uri as string) ?? '')] }
        break
      default:
        return { jsonrpc: '2.0' as const, id: req.id, error: { code: -32601, message: `Method not found: ${req.method}` } }
    }
    return { jsonrpc: '2.0' as const, id: req.id, result }
  } catch (err) {
    const e = err as Error & { code?: number }
    if (e.code === -32601) return { jsonrpc: '2.0' as const, id: req.id, error: { code: -32601, message: e.message } }
    return { jsonrpc: '2.0' as const, id: req.id, result: { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true } }
  }
}

async function callTool(params: Record<string, unknown>): Promise<unknown> {
  const name = params.name as string | undefined
  const tool = name ? toolMap.get(name) : undefined
  if (!tool) throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32601 })
  return tool.handler((params.arguments ?? {}) as Record<string, unknown>)
}

function getPrompt(params: Record<string, unknown>): unknown {
  const name = params.name as string | undefined
  const prompt = name ? promptMap.get(name) : undefined
  if (!prompt) throw Object.assign(new Error(`Unknown prompt: ${name}`), { code: -32601 })
  const args = (params.arguments ?? {}) as Record<string, string>
  let text = prompt.description + '\n\n'
  for (const a of prompt.arguments) {
    const val = args[a.name] ?? (a.required ? `{${a.name}}` : '')
    if (val) text += `${a.name}: ${val}\n`
  }
  return { messages: [{ role: 'user', content: { type: 'text', text } }] }
}
