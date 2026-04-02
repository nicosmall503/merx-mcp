import type { McpPrompt } from '../types.js'

export const developerPrompts: McpPrompt[] = [
  {
    name: 'integrate-merx',
    description: 'Generate integration code for Merx SDK',
    arguments: [
      {
        name: 'language',
        description:
          'Programming language or tool: JS, Python, or curl. Defaults to JavaScript.',
        required: false,
      },
      {
        name: 'use_case',
        description:
          'Specific use case for the integration. Defaults to buying energy before TRC20 transfers.',
        required: false,
      },
    ],
  },
  {
    name: 'setup-mcp',
    description: 'Set up Merx MCP server for an AI client',
    arguments: [
      {
        name: 'client',
        description:
          'AI client to configure: Claude Desktop, Cursor, Claude Code, or other',
        required: true,
      },
      {
        name: 'mode',
        description:
          'Server mode: hosted (merx.exchange) or local (self-hosted). Defaults to hosted.',
        required: false,
      },
    ],
  },
]
