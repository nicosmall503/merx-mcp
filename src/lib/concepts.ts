export const CONCEPTS: Record<string, string> = {
  energy: [
    'Energy is a TRON network resource consumed when executing smart contracts.',
    'Every smart contract call (including TRC20 transfers like USDT) costs energy.',
    'Without energy, the caller pays TRX burned as a fee -- typically 13-27 TRX per USDT transfer.',
    'Energy can be obtained by staking TRX (Stake 2.0) or by renting it from providers.',
    'Renting energy through Merx costs a fraction of the burn fee, saving 50-90% on transaction costs.',
    'Energy is measured in units. A standard USDT transfer costs ~65,000 energy.',
  ].join(' '),

  bandwidth: [
    'Bandwidth is a TRON network resource consumed by every transaction for its raw byte size.',
    'Each TRON account receives 600 free bandwidth points daily.',
    'If free bandwidth is exhausted, the network burns TRX to cover the bandwidth cost.',
    'Bandwidth is cheaper than energy and most accounts rarely run out.',
    'Staking TRX for bandwidth is possible but usually unnecessary for normal usage.',
    'Bandwidth can be rented through Merx from providers that offer it (TronSave, TEM, PowerSun).',
  ].join(' '),

  burn_vs_rent: [
    'When a TRON account lacks energy, the network burns TRX from the caller to cover the cost.',
    'The burn price is set by the network and fluctuates with overall resource utilization.',
    'Renting energy from providers is almost always cheaper than burning.',
    'Example: a USDT transfer might burn ~13 TRX, but renting the same energy costs ~3-5 TRX.',
    'Merx aggregates multiple energy providers and routes orders to the cheapest available option.',
    'The savings compound for high-volume users -- hundreds of transactions per day add up fast.',
  ].join(' '),

  sun_units: [
    'SUN is the smallest unit of TRX, analogous to satoshis in Bitcoin or wei in Ethereum.',
    '1 TRX = 1,000,000 SUN.',
    'All internal Merx calculations use SUN to avoid floating-point precision errors.',
    'API responses that include TRX amounts are denominated in SUN unless noted otherwise.',
    'When displaying to users, divide by 1,000,000 to convert SUN back to TRX.',
    'Example: 13,500,000 SUN = 13.5 TRX.',
  ].join(' '),

  merx_routing: [
    'Merx connects to multiple energy providers and aggregates their prices in real-time.',
    'When a user places an order, Merx finds the cheapest provider that can fill it.',
    'If no single provider can fill the full amount, Merx splits the order across providers.',
    'The routing engine considers price, available capacity, minimum order size, and fill rate.',
    'Provider prices are polled every few seconds and cached for fast order matching.',
    'Users always get the best available price without needing to check each provider manually.',
  ].join(' '),

  provider_types: [
    'Merx supports two categories of energy providers.',
    'Fixed-price providers (CatFee, ITRX, PowerSun, Netts) offer resources at set prices for specific durations.',
    'P2P market providers (TronSave, TEM) operate order books where sellers post ask prices.',
    'P2P markets often have better prices for large orders but may have partial fills.',
    'Each provider has different minimum orders, durations, and pricing tiers.',
    'Merx normalizes all providers behind a single API so users do not need to integrate each one.',
  ].join(' '),

  staking: [
    'TRON Stake 2.0 lets TRX holders lock TRX to obtain energy or bandwidth.',
    'Staked TRX is locked for a minimum of 14 days before it can be unstaked.',
    'The amount of energy received depends on the total TRX staked network-wide.',
    'Staking is capital-intensive: generating 65,000 energy (one USDT transfer) requires ~80,000 TRX.',
    'For most users, renting energy is more capital-efficient than staking.',
    'Large holders who already own TRX may prefer staking to avoid ongoing rental costs.',
  ].join(' '),

  delegation: [
    'Delegation is the mechanism by which a staker shares their energy with another address.',
    'On TRON Stake 2.0, the staker calls delegateResource to assign energy to a recipient.',
    'The recipient can then use that energy for smart contract calls at zero marginal cost.',
    'Delegations can be time-locked or revocable, depending on the provider terms.',
    'Merx providers delegate energy to the buyer address after an order is confirmed.',
    'Once the rental period expires, the provider reclaims the delegation automatically.',
  ].join(' '),
}

export function getConcept(topic: string): string | null {
  const key = topic.toLowerCase().replace(/[\s-]/g, '_')
  // 1. Exact match
  if (CONCEPTS[key]) return CONCEPTS[key]
  // 2. Substring match: requested topic is contained in a known key, or vice versa
  // (e.g. "energy" matches "burn_vs_rent" because key contains "rent" — no.
  //  Better: check both directions for prefix/contains)
  for (const k of Object.keys(CONCEPTS)) {
    if (k.includes(key) || key.includes(k)) return CONCEPTS[k]
  }
  return null
}

// Returns the closest matching topic key by substring, or null if nothing close.
// Used by explain_concept to suggest a fallback when the user asks about
// something we don't have a hardcoded entry for.
export function suggestClosestTopic(topic: string): string | null {
  const key = topic.toLowerCase().replace(/[\s-]/g, '_')
  for (const k of Object.keys(CONCEPTS)) {
    if (k.includes(key) || key.includes(k)) return k
  }
  return null
}

export function listTopics(): string[] {
  return Object.keys(CONCEPTS)
}
