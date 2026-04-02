import type { McpPrompt } from '../types.js'

export const dexPrompts: McpPrompt[] = [
  {
    name: 'swap-tokens',
    description:
      'Swap tokens on TRON DEX with best route and slippage protection',
    arguments: [
      {
        name: 'from_token',
        description:
          'Token to sell (symbol or contract address, e.g. TRX, USDT)',
        required: true,
      },
      {
        name: 'to_token',
        description:
          'Token to buy (symbol or contract address, e.g. USDD, JST)',
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount of from_token to swap',
        required: true,
      },
    ],
  },
  {
    name: 'check-token',
    description:
      'Get detailed information about a TRC-20 token: price, liquidity, ' +
      'holders, contract verification, and risk assessment',
    arguments: [
      {
        name: 'token',
        description: 'Token symbol or contract address to research',
        required: true,
      },
    ],
  },
  {
    name: 'price-check',
    description:
      'Get current prices for one or more tokens with 24h change and volume',
    arguments: [
      {
        name: 'tokens',
        description:
          'Comma-separated list of token symbols (e.g. "TRX,USDT,JST,SUN")',
        required: true,
      },
    ],
  },
]
