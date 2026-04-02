import type { McpPrompt } from '../types.js'

export const transactionPrompts: McpPrompt[] = [
  {
    name: 'send-usdt',
    description: 'Send USDT (TRC-20) to a TRON address with optimized fees',
    arguments: [
      {
        name: 'to_address',
        description: 'Destination TRON address',
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount of USDT to send',
        required: true,
      },
    ],
  },
  {
    name: 'send-trx',
    description: 'Send TRX to a TRON address',
    arguments: [
      {
        name: 'to_address',
        description: 'Destination TRON address',
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount of TRX to send',
        required: true,
      },
    ],
  },
  {
    name: 'send-token',
    description: 'Send any TRC-20 token to a TRON address',
    arguments: [
      {
        name: 'token',
        description:
          'Token symbol or contract address (e.g. USDD, JST, or contract address)',
        required: true,
      },
      {
        name: 'to_address',
        description: 'Destination TRON address',
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount of tokens to send',
        required: true,
      },
    ],
  },
  {
    name: 'multi-transfer',
    description:
      'Send tokens to multiple recipients in one batch operation',
    arguments: [
      {
        name: 'token',
        description: 'Token symbol or contract address (e.g. USDT, TRX)',
        required: true,
      },
      {
        name: 'recipients',
        description:
          'Comma-separated list of address:amount pairs ' +
          '(e.g. "TAddr1:100,TAddr2:200,TAddr3:50")',
        required: true,
      },
    ],
  },
  {
    name: 'explain-transaction',
    description:
      'Analyze and explain a TRON transaction in human-readable terms',
    arguments: [
      {
        name: 'tx_id',
        description: 'TRON transaction hash to analyze',
        required: true,
      },
    ],
  },
]
