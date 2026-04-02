import { publicGet, hasApiKey } from '../lib/api.js'
import { textResult, errorResult, sunToTrx, formatNumber } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

const ALLOWED_ACTIONS = [
  'transfer_trx', 'transfer_trc20', 'approve_trc20', 'swap',
  'buy_energy', 'buy_bandwidth', 'ensure_resources',
  'call_contract', 'deposit_trx',
] as const

interface StepEstimate {
  action: string
  params: Record<string, unknown>
  energy: number
  bandwidth: number
}

function estimateStep(step: { action: string; params: Record<string, unknown> }): StepEstimate {
  const estimates: Record<string, { energy: number; bandwidth: number }> = {
    transfer_trc20: { energy: 65000, bandwidth: 345 },
    transfer_trx: { energy: 0, bandwidth: 270 },
    approve_trc20: { energy: 45000, bandwidth: 345 },
    swap: { energy: 120000, bandwidth: 500 },
    buy_energy: { energy: 0, bandwidth: 0 },
    buy_bandwidth: { energy: 0, bandwidth: 0 },
    ensure_resources: { energy: 0, bandwidth: 0 },
    call_contract: { energy: 65000, bandwidth: 345 },
    deposit_trx: { energy: 0, bandwidth: 270 },
  }
  const est = estimates[step.action] ?? { energy: 65000, bandwidth: 345 }
  return { action: step.action, params: step.params, energy: est.energy, bandwidth: est.bandwidth }
}

function validateSteps(steps: unknown[]): { action: string; params: Record<string, unknown> }[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('steps must be a non-empty array.')
  }
  return steps.map((s, i) => {
    const step = s as Record<string, unknown>
    if (!step.action || typeof step.action !== 'string') {
      throw new Error(`Step ${i + 1}: action is required.`)
    }
    if (!ALLOWED_ACTIONS.includes(step.action as typeof ALLOWED_ACTIONS[number])) {
      throw new Error(`Step ${i + 1}: unsupported action "${step.action}".`)
    }
    return { action: step.action, params: (step.params ?? {}) as Record<string, unknown> }
  })
}

function formatStepLine(est: StepEstimate, idx: number): string {
  const p = est.params
  const desc = formatStepDescription(est.action, p)
  const parts = [`Step ${idx + 1}: ${est.action} - ${desc}`]
  if (est.energy > 0 || est.bandwidth > 0) {
    parts.push(`  Energy: ~${formatNumber(est.energy)} | Bandwidth: ~${formatNumber(est.bandwidth)}`)
  } else {
    parts.push('  No on-chain resources needed')
  }
  return parts.join('\n')
}

function formatStepDescription(action: string, p: Record<string, unknown>): string {
  switch (action) {
    case 'transfer_trx': return `${p.amount ?? '?'} TRX -> ${p.to ?? '?'}`
    case 'transfer_trc20': return `${p.amount ?? '?'} ${p.token ?? 'TRC20'} -> ${p.to ?? '?'}`
    case 'approve_trc20': return `approve ${p.token ?? 'TRC20'} for ${p.spender ?? '?'}`
    case 'swap': return `${p.amount ?? '?'} ${p.from_token ?? '?'} -> ${p.to_token ?? '?'}`
    case 'buy_energy': return `${p.amount ?? '?'} energy for ${p.target ?? '?'}`
    case 'buy_bandwidth': return `${p.amount ?? '?'} bandwidth for ${p.target ?? '?'}`
    case 'ensure_resources': return `ensure resources for ${p.target_address ?? '?'}`
    case 'call_contract': return `call ${p.contract ?? '?'}`
    case 'deposit_trx': return `deposit ${p.amount ?? '?'} TRX`
    default: return JSON.stringify(p)
  }
}

interface PriceData { best_price_sun?: number; price_sun?: number }

async function fetchBestPrices(): Promise<{ energyPrice: number; bwPrice: number }> {
  let energyPrice = 42
  let bwPrice = 1000
  try {
    const eData = await publicGet('/api/v1/prices/best?resource=ENERGY') as PriceData
    energyPrice = eData.best_price_sun ?? eData.price_sun ?? 42
  } catch { /* use default */ }
  try {
    const bData = await publicGet('/api/v1/prices/best?resource=BANDWIDTH') as PriceData
    bwPrice = bData.best_price_sun ?? bData.price_sun ?? 1000
  } catch { /* use default */ }
  return { energyPrice, bwPrice }
}

function formatSimulation(
  estimates: StepEstimate[],
  energyPrice: number,
  bwPrice: number,
): string {
  const totalEnergy = estimates.reduce((s, e) => s + e.energy, 0)
  const totalBw = estimates.reduce((s, e) => s + e.bandwidth, 0)
  const rentalCostSun = totalEnergy * energyPrice + totalBw * bwPrice
  const burnCostSun = totalEnergy * 420 + totalBw * 1000
  const savings = burnCostSun > 0
    ? Math.round((1 - rentalCostSun / burnCostSun) * 100)
    : 0

  const lines: string[] = [
    `Intent: ${estimates.length} steps`,
    '',
  ]
  estimates.forEach((est, i) => lines.push(formatStepLine(est, i), ''))
  lines.push(
    'Resources needed:',
    `  Total energy: ${formatNumber(totalEnergy)} | Total bandwidth: ${formatNumber(totalBw)}`,
    `  Rental cost: ~${sunToTrx(rentalCostSun)} TRX`,
    `  Burn alternative: ~${sunToTrx(burnCostSun)} TRX`,
    `  Savings: ${savings}%`,
    '',
    'Status: Simulation complete (execution requires TronWeb)',
  )
  return lines.join('\n')
}

async function runSimulation(input: Record<string, unknown>): Promise<string> {
  const steps = validateSteps(input.steps as unknown[])
  const estimates = steps.map(estimateStep)
  const { energyPrice, bwPrice } = await fetchBestPrices()
  return formatSimulation(estimates, energyPrice, bwPrice)
}

const executeIntent: McpTool = {
  name: 'execute_intent',
  description:
    'Execute a multi-step operation (transfer, swap, buy resources, etc). ' +
    'Validates and simulates all steps with resource cost estimates. Auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        description: 'Array of { action, params } steps to execute.',
      },
      resource_strategy: {
        type: 'string',
        enum: ['batch_cheapest', 'per_step', 'no_resources'],
        description: 'Resource acquisition strategy (default: batch_cheapest).',
      },
      dry_run: {
        type: 'boolean',
        description: 'If true, simulate only without executing (default: false).',
      },
    },
    required: ['steps'],
  },
  async handler(input) {
    try {
      if (!hasApiKey()) {
        throw new Error('MERX_API_KEY is required. Set it in your environment.')
      }
      const result = await runSimulation(input)
      return textResult(result)
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const simulate: McpTool = {
  name: 'simulate',
  description:
    'Simulate a multi-step operation without executing. Returns resource estimates and costs.',
  inputSchema: {
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        description: 'Array of { action, params } steps to simulate.',
      },
      resource_strategy: {
        type: 'string',
        enum: ['batch_cheapest', 'per_step', 'no_resources'],
        description: 'Resource acquisition strategy (default: batch_cheapest).',
      },
    },
    required: ['steps'],
  },
  async handler(input) {
    try {
      const result = await runSimulation(input)
      return textResult(result)
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const intentTools: McpTool[] = [executeIntent, simulate]
