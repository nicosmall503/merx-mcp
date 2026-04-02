import type { McpPrompt } from '../types.js'

export const marketPrompts: McpPrompt[] = [
  {
    name: 'buy-energy',
    description: 'Buy TRON energy at the best market price',
    arguments: [
      {
        name: 'amount',
        description: 'Amount of energy to buy (in energy units)',
        required: true,
      },
      {
        name: 'target_address',
        description: 'TRON address to receive the energy delegation',
        required: true,
      },
      {
        name: 'duration',
        description:
          'Delegation duration (e.g. 1h, 3d, 14d). Defaults to cheapest available.',
        required: false,
      },
    ],
  },
  {
    name: 'buy-bandwidth',
    description: 'Buy TRON bandwidth at the best market price',
    arguments: [
      {
        name: 'amount',
        description: 'Amount of bandwidth to buy (in bandwidth units)',
        required: true,
      },
      {
        name: 'target_address',
        description: 'TRON address to receive the bandwidth delegation',
        required: true,
      },
      {
        name: 'duration',
        description:
          'Delegation duration (e.g. 1h, 3d, 14d). Defaults to cheapest available.',
        required: false,
      },
    ],
  },
  {
    name: 'ensure-resources',
    description: 'Guarantee minimum energy + bandwidth on an address',
    arguments: [
      {
        name: 'target_address',
        description: 'TRON address to ensure resources on',
        required: true,
      },
      {
        name: 'energy',
        description:
          'Minimum energy to maintain (e.g. 65000 for one USDT transfer)',
        required: false,
      },
      {
        name: 'bandwidth',
        description: 'Minimum bandwidth to maintain',
        required: false,
      },
      {
        name: 'duration',
        description: 'How long to maintain the resources (e.g. 1h, 1d, 7d)',
        required: false,
      },
    ],
  },
  {
    name: 'market-analysis',
    description: 'Full TRON energy and bandwidth market analysis',
    arguments: [],
  },
  {
    name: 'compare-providers',
    description: 'Deep comparison of providers for a specific use case',
    arguments: [
      {
        name: 'resource',
        description: 'Resource type: ENERGY or BANDWIDTH',
        required: true,
      },
      {
        name: 'amount',
        description:
          'Amount of resource needed (helps narrow pricing comparison)',
        required: false,
      },
      {
        name: 'frequency',
        description:
          'How often you need this resource (e.g. once, daily, hourly)',
        required: false,
      },
    ],
  },
]
