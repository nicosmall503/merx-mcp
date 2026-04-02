import type { McpPrompt } from '../types.js'

export const walletPrompts: McpPrompt[] = [
  {
    name: 'check-wallet',
    description:
      'Full wallet overview: balances, resources, staking, and recent activity',
    arguments: [
      {
        name: 'address',
        description: 'TRON address to check',
        required: true,
      },
    ],
  },
  {
    name: 'audit-spending',
    description:
      'Analyze spending on energy, bandwidth, and fees over a time period',
    arguments: [
      {
        name: 'period',
        description:
          'Time period to audit: 7d, 30d, or 90d. Defaults to 30d.',
        required: false,
      },
      {
        name: 'address',
        description:
          'TRON address to audit. Uses connected wallet if omitted.',
        required: false,
      },
    ],
  },
  {
    name: 'monitor-delegations',
    description:
      'Show all active resource delegations to and from an address',
    arguments: [
      {
        name: 'address',
        description: 'TRON address to check delegations for',
        required: true,
      },
    ],
  },
  {
    name: 'optimize-wallet',
    description:
      'Analyze wallet usage patterns and recommend optimizations ' +
      'for staking, resources, and fee reduction',
    arguments: [
      {
        name: 'address',
        description: 'TRON address to optimize',
        required: true,
      },
    ],
  },
]
