import type { McpPrompt } from '../types.js'

export const monitoringPrompts: McpPrompt[] = [
  {
    name: 'setup-standing-order',
    description:
      'Create a standing order that buys resources when price conditions are met',
    arguments: [
      {
        name: 'resource',
        description: 'Resource type: ENERGY or BANDWIDTH',
        required: true,
      },
      {
        name: 'trigger_price',
        description:
          'Price threshold in SUN per unit that triggers the order',
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount of resource to buy when triggered',
        required: true,
      },
      {
        name: 'budget_trx',
        description:
          'Maximum TRX budget for the standing order. If omitted, no budget limit.',
        required: false,
      },
    ],
  },
  {
    name: 'auto-renew-delegations',
    description:
      'Automatically renew resource delegations before they expire',
    arguments: [
      {
        name: 'address',
        description: 'TRON address whose delegations should be auto-renewed',
        required: true,
      },
      {
        name: 'max_price_sun',
        description:
          'Maximum price in SUN per energy unit for renewal. Defaults to 40 SUN.',
        required: false,
      },
    ],
  },
]
