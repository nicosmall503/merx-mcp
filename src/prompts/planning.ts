import type { McpPrompt } from '../types.js'

export const planningPrompts: McpPrompt[] = [
  {
    name: 'estimate-costs',
    description:
      'Estimate the cost of a TRON operation including energy, bandwidth, ' +
      'and fees. Compare burning TRX vs renting resources.',
    arguments: [
      {
        name: 'operation',
        description:
          'Operation to estimate (e.g. "send USDT", "deploy contract", ' +
          '"approve token", "stake TRX")',
        required: true,
      },
      {
        name: 'address',
        description:
          'TRON address to check existing resources against. ' +
          'Helps determine if additional resources are needed.',
        required: false,
      },
    ],
  },
  {
    name: 'budget-plan',
    description:
      'Create a daily/weekly/monthly budget plan for TRON operations. ' +
      'Calculates optimal resource strategy based on transaction volume.',
    arguments: [
      {
        name: 'daily_transfers',
        description:
          'Number of token transfers per day (e.g. 10, 50, 200)',
        required: true,
      },
      {
        name: 'token',
        description:
          'Primary token being transferred (e.g. USDT, TRX). Defaults to USDT.',
        required: false,
      },
      {
        name: 'bandwidth_intensive',
        description:
          'Whether operations are bandwidth-intensive ' +
          '(true/false, e.g. batch transfers or memo-heavy TXs)',
        required: false,
      },
    ],
  },
  {
    name: 'stake-vs-rent',
    description:
      'Compare staking TRX for resources vs renting on Merx. ' +
      'Shows breakeven point and total cost over 30/90/365 days.',
    arguments: [
      {
        name: 'daily_energy',
        description:
          'Daily energy consumption (e.g. 65000 per USDT transfer)',
        required: false,
      },
      {
        name: 'daily_bandwidth',
        description: 'Daily bandwidth consumption',
        required: false,
      },
    ],
  },
]
