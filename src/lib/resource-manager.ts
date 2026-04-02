import { publicGet, authPost, hasApiKey } from './api.js'
import { sunToTrx } from './formatter.js'

export interface ResourceAwareResult {
  energyPurchased: number
  bandwidthPurchased: number
  energyCost: number
  bandwidthCost: number
  energyProvider: string
  bandwidthProvider: string
  burnAlternative: number
  savingsPercent: number
}

interface ResourcesResponse {
  energyLimit?: number
  energyUsed?: number
  bandwidthLimit?: number
  bandwidthUsed?: number
  freeNetLimit?: number
  freeNetUsed?: number
  // Nested format
  energy?: { available: number; limit: number; used: number }
  bandwidth?: { available: number; limit: number; used: number; free_limit: number }
}

interface OrderResponse {
  id?: string
  order_id?: string
  status?: string
  total_cost_sun?: number
  provider?: string
}

const ENERGY_BURN_RATE = 420
const BANDWIDTH_BURN_RATE = 1000
const POLL_INTERVAL_MS = 2000
const MAX_POLL_RETRIES = 15 // 30 seconds max

export function getSenderAddress(): string {
  const addr = process.env.TRON_ADDRESS
  if (!addr) {
    throw new Error(
      'Set TRON_ADDRESS env var to your TRON address for write operations'
    )
  }
  return addr
}

export function getPrivateKey(): string {
  const key = process.env.TRON_PRIVATE_KEY
  if (!key) {
    throw new Error('TRON_PRIVATE_KEY is required for write operations')
  }
  return key
}

function computeDeficits(
  res: ResourcesResponse,
  energyNeeded: number,
  bandwidthNeeded: number
): { energyDeficit: number; bandwidthDeficit: number } {
  const eLimit = res.energy?.limit ?? res.energyLimit ?? 0
  const eUsed = res.energy?.used ?? res.energyUsed ?? 0
  const bwLimit = res.bandwidth?.limit ?? res.bandwidthLimit ?? 0
  const bwUsed = res.bandwidth?.used ?? res.bandwidthUsed ?? 0
  const freeBw = res.bandwidth?.free_limit ?? ((res.freeNetLimit ?? 0) - (res.freeNetUsed ?? 0))
  const energyAvail = eLimit - eUsed
  const bwAvail = (bwLimit - bwUsed) + Math.max(0, freeBw)
  return {
    energyDeficit: Math.max(0, energyNeeded - energyAvail),
    bandwidthDeficit: Math.max(0, bandwidthNeeded - bwAvail),
  }
}

async function buyEnergy(
  amount: number,
  target: string,
  duration: number
): Promise<OrderResponse> {
  return authPost('/api/v1/orders', {
    resource_type: 'ENERGY',
    order_type: 'MARKET',
    amount,
    duration_sec: duration,
    target_address: target,
  }) as Promise<OrderResponse>
}

async function buyBandwidth(
  amount: number,
  target: string,
  duration: number
): Promise<OrderResponse> {
  return authPost('/api/v1/orders', {
    resource_type: 'BANDWIDTH',
    order_type: 'MARKET',
    amount,
    duration_sec: duration,
    target_address: target,
  }) as Promise<OrderResponse>
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForDelegation(
  address: string, energyNeeded: number, bwNeeded: number
): Promise<void> {
  for (let i = 0; i < MAX_POLL_RETRIES; i++) {
    await sleep(POLL_INTERVAL_MS)
    const res = await publicGet(
      `/api/v1/chain/resources/${address}`
    ) as ResourcesResponse
    const { energyDeficit, bandwidthDeficit } = computeDeficits(
      res, energyNeeded, bwNeeded
    )
    if (energyDeficit === 0 && bandwidthDeficit < 1500) {
      return // delegation arrived
    }
  }
  // Timeout - proceed anyway, TX will burn remaining deficit
}

export async function ensureResources(
  senderAddress: string,
  energyNeeded: number,
  bandwidthNeeded: number,
  durationSec?: number
): Promise<ResourceAwareResult | null> {
  const res = await publicGet(
    `/api/v1/chain/resources/${senderAddress}`
  ) as ResourcesResponse

  const { energyDeficit, bandwidthDeficit } = computeDeficits(
    res, energyNeeded, bandwidthNeeded
  )

  // Round up to API minimums
  const effectiveEnergyDeficit = energyDeficit > 0 && energyDeficit < 65000 ? 65000 : energyDeficit
  const effectiveBwDeficit = bandwidthDeficit > 0 && bandwidthDeficit < 1500 ? 0 : bandwidthDeficit
  if (effectiveEnergyDeficit === 0 && effectiveBwDeficit === 0) return null
  if (!hasApiKey()) {
    throw new Error(
      'MERX_API_KEY is required to purchase resources. ' +
      `Need ${energyDeficit} energy + ${bandwidthDeficit} bandwidth.`
    )
  }

  const duration = durationSec ?? 300
  let energyCost = 0
  let bandwidthCost = 0
  let energyProvider = 'none'
  let bandwidthProvider = 'none'

  if (effectiveEnergyDeficit > 0) {
    const order = await buyEnergy(effectiveEnergyDeficit, senderAddress, duration)
    energyCost = order.total_cost_sun ?? 0
    energyProvider = order.provider ?? 'unknown'
  }
  if (effectiveBwDeficit > 0) {
    const order = await buyBandwidth(effectiveBwDeficit, senderAddress, duration)
    bandwidthCost = order.total_cost_sun ?? 0
    bandwidthProvider = order.provider ?? 'unknown'
  }

  // Poll until delegation arrives on-chain
  await waitForDelegation(senderAddress, energyNeeded, bandwidthNeeded)

  const burnAlt = energyNeeded * ENERGY_BURN_RATE +
    bandwidthNeeded * BANDWIDTH_BURN_RATE
  const totalCost = energyCost + bandwidthCost
  const savings = burnAlt > 0
    ? ((burnAlt - totalCost) / burnAlt) * 100
    : 0

  return {
    energyPurchased: effectiveEnergyDeficit,
    bandwidthPurchased: effectiveBwDeficit,
    energyCost,
    bandwidthCost,
    energyProvider,
    bandwidthProvider,
    burnAlternative: burnAlt,
    savingsPercent: Math.max(0, savings),
  }
}

export function formatResourceResult(r: ResourceAwareResult): string {
  const lines = [
    '--- Resources Acquired ---',
    `Energy purchased:    ${r.energyPurchased} (${sunToTrx(r.energyCost)} TRX)`,
    `Bandwidth purchased: ${r.bandwidthPurchased} (${sunToTrx(r.bandwidthCost)} TRX)`,
    `Total rental cost:   ${sunToTrx(r.energyCost + r.bandwidthCost)} TRX`,
    `Burn alternative:    ${sunToTrx(r.burnAlternative)} TRX`,
    `Savings:             ${r.savingsPercent.toFixed(1)}%`,
  ]
  return lines.join('\n')
}
