import type { McpPrompt } from '../types.js'

export const onboardingPrompts: McpPrompt[] = [
  {
    name: 'onboard',
    description: 'Set up a new Merx account with API key and deposit address',
    arguments: [
      {
        name: 'email',
        description: 'Email address for the new Merx account',
        required: true,
      },
    ],
  },
  {
    name: 'fund-account',
    description: 'Fund your Merx account with TRX',
    arguments: [
      {
        name: 'amount_trx',
        description:
          'Amount of TRX to deposit. If provided, shows how many transfers this covers.',
        required: false,
      },
    ],
  },
]
