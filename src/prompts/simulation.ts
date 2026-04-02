import type { McpPrompt } from '../types.js'

export const simulationPrompts: McpPrompt[] = [
  {
    name: 'simulate-plan',
    description:
      'Simulate a multi-step operation before executing to preview costs and outcomes',
    arguments: [
      {
        name: 'description',
        description:
          'Natural language description of the plan to simulate (e.g. "send USDT to 5 addresses then swap remaining TRX to USDT")',
        required: true,
      },
    ],
  },
  {
    name: 'execute-plan',
    description:
      'Execute a multi-step plan with resource optimization',
    arguments: [
      {
        name: 'description',
        description:
          'Natural language description of the plan to execute',
        required: true,
      },
      {
        name: 'resource_strategy',
        description:
          'Resource acquisition strategy: batch_cheapest (buy all resources upfront at best price) or per_step (buy resources before each step). Defaults to batch_cheapest.',
        required: false,
      },
    ],
  },
]
