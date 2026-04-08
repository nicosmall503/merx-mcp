import { publicPost } from '../lib/api.js'
import { textResult, errorResult, sunToTrx } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

const BASE_URL = process.env.MERX_BASE_URL ?? 'https://merx.exchange'

// --- JWT helpers (register/login need Bearer auth, not x-api-key) ---

async function postWithJwt(path: string, payload: unknown, token: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  if (body.error) throw new Error(body.error.message)
  return body.data
}

async function getWithJwt(path: string, token: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  const body = await res.json()
  if (body.error) throw new Error(body.error.message)
  return body.data
}

// --- Formatters ---

function formatAccountCreated(
  email: string,
  userId: string,
  apiKey: string,
  depositAddr: string,
  memo: string | undefined,
  priceSun: number | undefined
): string {
  const lines = [
    'Account created.',
    '',
    `  Email:   ${email}`,
    `  User ID: ${userId}`,
    '',
    `  API Key: ${apiKey} (save this - shown only once)`,
    '',
    `  Deposit address: ${depositAddr}`,
  ]
  if (memo) {
    lines.push(`  Memo: ${memo} (always include when depositing)`)
  }
  if (priceSun && priceSun > 0) {
    lines.push('')
    lines.push(`  Current energy price: ${priceSun} SUN (${sunToTrx(priceSun * 65000)} TRX for one USDT transfer)`)
  }
  lines.push(
    '',
    'To start trading, deposit TRX to the address above with your memo.',
    'Set MERX_API_KEY=' + apiKey + ' in your MCP config for full access.',
  )
  return lines.join('\n')
}

function formatLoginResult(email: string): string {
  return [
    'Login successful.',
    '',
    `  Email: ${email}`,
    '',
    'For MCP usage, create an API key instead of using login.',
    'API keys are more secure for automated access.',
    'Use create_account to register and get an API key in one step.',
  ].join('\n')
}

// --- Tools ---

const createAccountTool: McpTool = {
  name: 'create_account',
  description: 'Create a new Merx account, generate an API key, and get deposit info. No auth needed.',
  inputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', description: 'Email address for the account' },
      password: { type: 'string', description: 'Password (min 8 characters)' },
    },
    required: ['email', 'password'],
  },
  async handler(input) {
    const email = input.email as string
    const password = input.password as string
    try {
      await publicPost('/api/v1/auth/register', { email, password })
      const loginData = await publicPost('/api/v1/auth/login', { email, password }) as Record<string, unknown>
      const jwt = loginData.token as string
      const userId = (loginData.user_id ?? loginData.userId ?? '') as string
      const keyData = await postWithJwt('/api/v1/keys', {}, jwt) as Record<string, unknown>
      const apiKey = (keyData.key ?? keyData.api_key ?? '') as string
      const depositData = await getWithJwt('/api/v1/deposit/info', jwt) as Record<string, unknown>
      const addr = (depositData.address ?? '') as string
      const memo = depositData.memo as string | undefined
      return textResult(formatAccountCreated(
        email, userId, apiKey, addr, memo, undefined
      ))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

const loginTool: McpTool = {
  name: 'login',
  description: 'Log in to an existing Merx account. No MERX_API_KEY needed.',
  inputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', description: 'Email address' },
      password: { type: 'string', description: 'Password' },
    },
    required: ['email', 'password'],
  },
  async handler(input) {
    const email = input.email as string
    const password = input.password as string
    try {
      await publicPost('/api/v1/auth/login', { email, password })
      return textResult(formatLoginResult(email))
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err))
    }
  },
}

const setApiKeyTool: McpTool = {
  name: 'set_api_key',
  description: 'Set your Merx API key for this session. Unlocks all authenticated tools (trading, balance, orders). Use this if you already have an API key.',
  inputSchema: {
    type: 'object',
    properties: {
      api_key: { type: 'string', description: 'Your Merx API key (starts with sk_live_)' },
    },
    required: ['api_key'],
  },
  async handler(input) {
    const key = input.api_key
    if (typeof key !== 'string' || key.length === 0) {
      return errorResult('api_key parameter is required and must be a non-empty string')
    }
    if (!key.startsWith('sk_live_')) {
      return errorResult('API key must start with sk_live_')
    }
    if (key.length < 24) {
      return errorResult('API key looks too short — expected at least 24 characters after the sk_live_ prefix')
    }
    process.env.MERX_API_KEY = key
    return textResult([
      'API key set for this session.',
      '',
      'All authenticated tools are now available:',
      '  create_order, get_order, list_orders, ensure_resources,',
      '  get_balance, get_deposit_info, get_transaction_history,',
      '  create_standing_order, list_standing_orders, and more.',
    ].join('\n'))
  },
}

const setPrivateKeyTool: McpTool = {
  name: 'set_private_key',
  description: 'Set your TRON private key for this session. Address is derived automatically. Enables write tools: transfer_trx, transfer_trc20, approve_trc20, execute_swap, deposit_trx. Key stays local - never sent to Merx servers.',
  inputSchema: {
    type: 'object',
    properties: {
      private_key: { type: 'string', description: 'Your TRON private key (64 hex characters)' },
    },
    required: ['private_key'],
  },
  async handler(input) {
    const key = input.private_key as string
    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      return errorResult('Private key must be 64 hex characters')
    }
    process.env.TRON_PRIVATE_KEY = key
    try {
      const { getAddress } = await import('../lib/tron-signer.js')
      const addr = getAddress()
      return textResult([
        'Private key set for this session.',
        '',
        `Derived address: ${addr}`,
        '',
        'Write tools now available:',
        '  transfer_trx, transfer_trc20, approve_trc20,',
        '  execute_swap, deposit_trx, call_contract',
        '',
        'Key stays in this process. Never sent to Merx API.',
      ].join('\n'))
    } catch {
      process.env.TRON_ADDRESS = 'unknown'
      return textResult('Private key set. Address derivation requires TronWeb.')
    }
  },
}

export const onboardingTools: McpTool[] = [
  createAccountTool,
  loginTool,
  setApiKeyTool,
  setPrivateKeyTool,
]
