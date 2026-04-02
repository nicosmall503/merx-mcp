import type { McpPrompt } from '../types.js'

export const paymentPrompts: McpPrompt[] = [
  {
    name: 'setup-auto-funding',
    description: 'Configure automatic Merx account funding',
    arguments: [
      {
        name: 'threshold_trx',
        description:
          'TRX balance threshold that triggers auto-funding. Defaults to 10 TRX.',
        required: false,
      },
      {
        name: 'deposit_amount_trx',
        description:
          'Amount of TRX to deposit when threshold is reached. Defaults to 50 TRX.',
        required: false,
      },
    ],
  },
  {
    name: 'buy-without-account',
    description:
      'Buy TRON resources without a Merx account using x402 payment protocol',
    arguments: [
      {
        name: 'resource',
        description: 'Resource type to buy: ENERGY or BANDWIDTH',
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount of resource to buy (in resource units)',
        required: true,
      },
      {
        name: 'target_address',
        description: 'TRON address to receive the resource delegation',
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
]
