import { publicPost, hasPrivateKey } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import {
  ensureResources, formatResourceResult,
} from '../lib/resource-manager.js'
import { callContract as signCallContract, getAddress } from '../lib/tron-signer.js'
import {
  formatReadResult, formatContractEstimate, formatContractCall,
} from './contract-formatters.js'
import type { McpTool } from '../types.js'

interface EstimateResponse {
  energy_required: number
  bandwidth_required: number
  rental_cost: { energy: { cost_trx: string }; bandwidth: { cost_trx: string } }
  total_rental_trx: string
  total_burn_trx: string
  savings_percent: number
}

const readContract: McpTool = {
  name: 'read_contract',
  description:
    'Call a view/pure function on a TRON smart contract. ' +
    'No auth or private key required.',
  inputSchema: {
    type: 'object',
    properties: {
      contract_address: {
        type: 'string',
        description: 'Contract TRON address.',
      },
      function_selector: {
        type: 'string',
        description: 'Function signature, e.g. "balanceOf(address)".',
      },
      parameter: {
        type: 'string',
        description: 'ABI-encoded parameter hex (optional).',
      },
    },
    required: ['contract_address', 'function_selector'],
  },
  async handler(input) {
    try {
      const contract = input.contract_address as string
      const selector = input.function_selector as string
      const param = (input.parameter as string) ?? ''

      const data = await publicPost('/api/v1/chain/read-contract', {
        contract_address: contract,
        function_selector: selector,
        parameter: param,
        owner_address: contract,
      }) as Record<string, unknown>

      const results = (data.constant_result as string[]) ?? []
      return textResult(formatReadResult(contract, selector, results))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const estimateContractCall: McpTool = {
  name: 'estimate_contract_call',
  description:
    'Estimate energy and bandwidth cost for a smart contract call. ' +
    'Compares rental vs burn cost. No auth required.',
  inputSchema: {
    type: 'object',
    properties: {
      contract_address: {
        type: 'string',
        description: 'Contract TRON address.',
      },
      function_selector: {
        type: 'string',
        description: 'Function signature, e.g. "transfer(address,uint256)".',
      },
      parameter: {
        type: 'string',
        description: 'ABI-encoded parameter hex (optional).',
      },
      caller_address: {
        type: 'string',
        description: 'Caller TRON address for simulation (optional).',
      },
    },
    required: ['contract_address', 'function_selector'],
  },
  async handler(input) {
    try {
      const contract = input.contract_address as string
      const selector = input.function_selector as string

      const payload: Record<string, unknown> = {
        operation: 'custom',
        contract_address: contract,
        function_selector: selector,
      }
      if (input.parameter) payload.parameter = input.parameter
      if (input.caller_address) {
        payload.from_address = input.caller_address
      }

      const est = await publicPost(
        '/api/v1/estimate', payload
      ) as EstimateResponse

      const rentalSun = parseFloat(est.total_rental_trx) * 1_000_000
      const burnSun = parseFloat(est.total_burn_trx) * 1_000_000
      return textResult(
        formatContractEstimate(
          contract, selector,
          est.energy_required, est.bandwidth_required,
          rentalSun, burnSun,
          est.savings_percent
        )
      )
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

const callContract: McpTool = {
  name: 'call_contract',
  description:
    'Execute a state-changing smart contract function. Estimates resources, ' +
    'buys via Merx if needed. Requires TRON_PRIVATE_KEY and TRON_ADDRESS.',
  inputSchema: {
    type: 'object',
    properties: {
      contract_address: {
        type: 'string',
        description: 'Contract TRON address.',
      },
      function_selector: {
        type: 'string',
        description: 'Function signature, e.g. "stake(uint256)".',
      },
      parameter: {
        type: 'string',
        description: 'ABI-encoded parameter hex (optional).',
      },
      call_value_trx: {
        type: 'string',
        description: 'TRX to send with call (optional).',
      },
    },
    required: ['contract_address', 'function_selector'],
  },
  async handler(input) {
    try {
      if (!hasPrivateKey()) return errorResult('TRON_PRIVATE_KEY is required. Use set_private_key first.')
      const sender = getAddress()
      const contract = input.contract_address as string
      const selector = input.function_selector as string
      const callValue = (input.call_value_trx as string) ?? null

      const estPayload: Record<string, unknown> = {
        operation: 'custom',
        contract_address: contract,
        function_selector: selector,
        from_address: sender,
      }
      if (input.parameter) estPayload.parameter = input.parameter

      const est = await publicPost('/api/v1/estimate', estPayload) as EstimateResponse

      const res = await ensureResources(sender, est.energy_required, est.bandwidth_required)
      const resInfo = res ? formatResourceResult(res) : null

      // Parse parameters for TronWeb
      const params: Array<{ type: string; value: string }> = []
      if (input.parameter) {
        params.push({ type: 'bytes', value: input.parameter as string })
      }
      const callValueSun = callValue ? Math.round(parseFloat(callValue) * 1_000_000) : undefined

      const tx = await signCallContract(contract, selector, params, callValueSun)
      const lines = [
        `Contract Call: ${contract}`,
        `Function: ${selector}`,
        `TX ID: ${tx.txId}`,
        `Status: ${tx.success ? 'BROADCAST' : 'FAILED'}`,
      ]
      if (tx.error) lines.push(`Error: ${tx.error}`)
      if (resInfo) lines.push('', resInfo)
      return textResult(lines.join('\n'))
    } catch (e) {
      return errorResult((e as Error).message)
    }
  },
}

export const contractTools: McpTool[] = [
  readContract,
  estimateContractCall,
  callContract,
]
