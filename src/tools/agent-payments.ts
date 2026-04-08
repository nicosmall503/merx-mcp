import { authPost, authGet } from '../lib/api.js'
import { textResult, errorResult } from '../lib/formatter.js'
import type { McpTool } from '../types.js'

const AGENT_BASE = process.env.MERX_AGENT_URL ?? 'https://agent.merx.exchange'

function enrichError(err: Record<string, unknown>): Error {
  const code = String(err.code ?? '')
  const message = String(err.message ?? 'unknown error')
  if (code === 'AGENT_NOT_REGISTERED') {
    return new Error(
      'Agent not registered for this API key. Call register_agent({ tron_address: "T..." }) first to register your TRON address as an agent. Then retry this call.'
    )
  }
  return new Error(message)
}

async function agentPost(path: string, payload: unknown): Promise<unknown> {
  const key = process.env.MERX_API_KEY
  if (!key) throw new Error('MERX_API_KEY required for agent operations')
  const res = await fetch(`${AGENT_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify(payload),
  })
  const body = await res.json() as Record<string, unknown>
  if (body.error) throw enrichError(body.error as Record<string, unknown>)
  return body.data
}

async function agentGet(path: string): Promise<unknown> {
  const key = process.env.MERX_API_KEY
  if (!key) throw new Error('MERX_API_KEY required for agent operations')
  const res = await fetch(`${AGENT_BASE}${path}`, {
    headers: { 'x-api-key': key },
  })
  const body = await res.json() as Record<string, unknown>
  if (body.error) throw enrichError(body.error as Record<string, unknown>)
  return body.data
}

export const agentPaymentTools: McpTool[] = [
  {
    name: 'register_agent',
    description: 'Register your TRON address as an agent on agent.merx.exchange. Required ONCE before using request_payment, create_invoice, watch_address, agent_status, or any other agent payment tool. Pass the TRON address you want to use as the on-chain identity for this API key. Idempotent — calling twice with the same key returns the existing registration. Auth required (API key).',
    inputSchema: {
      type: 'object',
      properties: {
        tron_address: { type: 'string', description: 'Your TRON address (T...) that will receive payments and act as the agent identity.' },
        label: { type: 'string', description: 'Optional human-readable label (max 64 chars)' },
      },
      required: ['tron_address'],
    },
    handler: async (params: Record<string, unknown>) => {
      try {
        const data = await agentPost('/api/v1/agent/register', {
          tron_address: params.tron_address,
          label: params.label,
        }) as Record<string, unknown>
        if (data.already_registered) {
          return textResult([
            `Agent already registered for this API key.`,
            ``,
            `Agent ID:     ${data.agent_id}`,
            `TRON address: ${data.tron_address}`,
            `Label:        ${data.label ?? '(none)'}`,
          ].join('\n'))
        }
        return textResult([
          `Agent registered successfully.`,
          ``,
          `Agent ID:      ${data.agent_id}`,
          `TRON address:  ${data.tron_address}`,
          `Registered at: ${data.registered_at}`,
          ``,
          `You can now use: request_payment, create_invoice, watch_address, agent_status, lookup_invoice.`,
        ].join('\n'))
      } catch (e) {
        return errorResult((e as Error).message)
      }
    },
  },
  {
    name: 'request_payment',
    description: 'Create a TRC20 payment request on TRON (USDT, USDC, USDD, or any TRC20). Returns a payment address. Fires webhook when payment arrives (<3 seconds). Use for receiving payments from other agents or humans. Requires agent registration first — call register_agent if you get AGENT_NOT_REGISTERED error.',
    inputSchema: {
      type: 'object',
      properties: {
        amount_usdt:      { type: 'string', description: 'Amount in token units (e.g. "5.00")' },
        description:      { type: 'string', description: 'What this payment is for' },
        timeout_seconds:  { type: 'number', description: 'Wait timeout (10-3600, default 300)' },
        tolerance_pct:    { type: 'number', description: 'Amount tolerance % (default 0 = exact)' },
        webhook_url:      { type: 'string', description: 'URL to notify on payment (optional)' },
      },
      required: ['amount_usdt'],
    },
    handler: async (params: Record<string, unknown>) => {
      try {
        const data = await agentPost('/api/v1/agent/receive', {
          expected_amount: params.amount_usdt,
          tolerance_pct: params.tolerance_pct ?? 0,
          timeout_seconds: params.timeout_seconds ?? 300,
          webhook_url: params.webhook_url,
        }) as Record<string, unknown>

        return textResult([
          'Payment request created',
          '---',
          `Payment ID: ${data.payment_id}`,
          `Pay to: ${data.watch_address}`,
          `Amount: ${params.amount_usdt} USDT`,
          `Expires: ${data.expires_at}`,
          `QR: ${data.qr_data}`,
          '',
          'Waiting for payment via ZeroMQ (<3 second detection).',
          params.webhook_url ? `Webhook: ${params.webhook_url}` : 'No webhook configured — call lookup_invoice(invoice_id) periodically to check status, or pass webhook_url next time for instant notification.',
        ].join('\n'))
      } catch (e) { return errorResult(e instanceof Error ? e.message : String(e)) }
    },
  },
  {
    name: 'lookup_invoice',
    description: 'Look up a MERX invoice. Shows amount, recipient, token, and status. Agent must sign and broadcast the transfer separately (non-custodial).',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'Invoice UUID (e.g. eaa00c4e-1234-5678-90ab-cdef12345678) returned by create_invoice, or a full payment URL containing /pay/<uuid>.' },
      },
      required: ['invoice_id'],
    },
    handler: async (params: Record<string, unknown>) => {
      try {
        let id = params.invoice_id as string
        // Extract ID from URL if needed
        if (id.includes('/pay/')) id = id.split('/pay/').pop()!

        const inv = await agentGet(`/api/v1/agent/invoice/${id}`) as Record<string, unknown>
        const status = String(inv.status ?? 'unknown').toUpperCase()

        // Always show full details + status field, regardless of state
        const lines = [
          'Invoice details',
          '---',
          `Invoice ID:  ${inv.invoice_id}`,
          `Status:      ${status}`,
          `Amount:      ${inv.amount_usdt} USDT`,
          `Pay to:      ${inv.pay_to_address}`,
          `Description: ${inv.description ?? 'None'}`,
          `Expires:     ${inv.expires_at}`,
        ]

        if (status === 'PAID') {
          lines.push(``, `Paid TX:     ${inv.paid_txid}`, `Paid at:     ${inv.paid_at}`)
        } else if (status === 'EXPIRED') {
          lines.push(``, `This invoice has expired and can no longer be paid.`)
        } else {
          // PENDING — show actionable instructions
          lines.push(
            ``,
            `To pay: send ${inv.amount_usdt} USDT to ${inv.pay_to_address}`,
            `Use transfer_trc20 to send the payment, or share the payment URL with the payer.`,
            `Poll lookup_invoice(${inv.invoice_id}) to check status.`
          )
        }

        return textResult(lines.join('\n'))
      } catch (e) { return errorResult(e instanceof Error ? e.message : String(e)) }
    },
  },
  {
    name: 'create_invoice',
    description: 'Create an invoice for another agent or human to pay. Returns payment URL, address, and QR code. Payment is detected automatically via ZeroMQ (<3 seconds).',
    inputSchema: {
      type: 'object',
      properties: {
        amount_usdt:  { type: 'string', description: 'Amount in USDT' },
        description:  { type: 'string', description: 'What the invoice is for' },
        expires_in:   { type: 'number', description: 'Expiry in seconds (60-86400, default 3600)' },
      },
      required: ['amount_usdt'],
    },
    handler: async (params: Record<string, unknown>) => {
      try {
        const data = await agentPost('/api/v1/agent/invoice/create', {
          amount_usdt: params.amount_usdt,
          description: params.description,
          expires_in_seconds: params.expires_in ?? 3600,
        }) as Record<string, unknown>

        return textResult([
          'Invoice created',
          '---',
          `Invoice ID: ${data.invoice_id}`,
          `Amount: ${params.amount_usdt} USDT`,
          `Pay to: ${data.pay_to_address}`,
          `Payment URL: ${data.payment_url}`,
          `QR: ${data.qr_data}`,
          `Expires: ${data.expires_at}`,
          '',
          'Share the payment URL or QR with the payer.',
        ].join('\n'))
      } catch (e) { return errorResult(e instanceof Error ? e.message : String(e)) }
    },
  },
  {
    name: 'watch_address',
    description: 'Watch any TRON address for TRC20 transfers (USDT, USDC, USDD, or any token). Fires webhook on each matching transfer. Persistent - runs 24/7 even when conversation ends.',
    inputSchema: {
      type: 'object',
      properties: {
        address:        { type: 'string', description: 'TRON address to watch (T...)' },
        event_types:    { type: 'array', items: { type: 'string', enum: ['usdt_incoming', 'usdt_outgoing', 'trx_incoming'] }, description: 'Event types to watch' },
        min_amount_usdt: { type: 'string', description: 'Minimum amount filter (default "0")' },
        webhook_url:    { type: 'string', description: 'Webhook URL for notifications' },
        ttl_hours:      { type: 'number', description: 'Watch duration in hours (1-720, default 24)' },
      },
      required: ['address', 'webhook_url'],
    },
    handler: async (params: Record<string, unknown>) => {
      try {
        const data = await agentPost('/api/v1/agent/watch', {
          address: params.address,
          event_types: params.event_types ?? ['usdt_incoming'],
          min_amount_usdt: params.min_amount_usdt ?? '0',
          webhook_url: params.webhook_url,
          ttl_hours: params.ttl_hours ?? 24,
        }) as Record<string, unknown>

        return textResult([
          'Watch created',
          '---',
          `Watch ID: ${data.watch_id}`,
          `Address: ${params.address}`,
          `Webhook: ${params.webhook_url}`,
          `Expires: ${data.expires_at}`,
          `Status: ${data.status}`,
        ].join('\n'))
      } catch (e) { return errorResult(e instanceof Error ? e.message : String(e)) }
    },
  },
  {
    name: 'agent_status',
    description: 'Get a snapshot of your agent payment service: registered TRON address, count of pending payment requests (request_payment), active address watches (watch_address), and outstanding invoices (create_invoice). Use this right after register_agent to confirm the agent is set up, or any time you want to see how much in-flight activity your agent has. Auth required (API key) and agent must be registered first via register_agent.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      try {
        const data = await agentGet('/api/v1/agent/status') as Record<string, unknown>
        return textResult([
          'Agent Payment Status',
          '---',
          `Address: ${data.tron_address}`,
          `Active receives: ${data.active_receives}`,
          `Active watches: ${data.active_watches}`,
          `Active invoices: ${data.active_invoices}`,
        ].join('\n'))
      } catch (e) { return errorResult(e instanceof Error ? e.message : String(e)) }
    },
  },
]
