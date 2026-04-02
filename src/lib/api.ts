const BASE_URL = process.env.MERX_BASE_URL ?? 'https://merx.exchange'

function getApiKey(): string | undefined {
  return process.env.MERX_API_KEY
}

function requireApiKey(): string {
  const key = getApiKey()
  if (!key) throw new Error('MERX_API_KEY is required for this operation')
  return key
}

export async function publicGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`)
  const body = await res.json()
  if (body.error) throw new Error(body.error.message)
  return body.data
}

export async function authGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'x-api-key': requireApiKey() },
  })
  const body = await res.json()
  if (body.error) throw new Error(body.error.message)
  return body.data
}

export async function authPost(
  path: string,
  payload: unknown,
  headers?: Record<string, string>
): Promise<unknown> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': requireApiKey(),
    ...headers,
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  if (body.error) throw new Error(body.error.message)
  return body.data
}

export async function publicPost(
  path: string,
  payload: unknown
): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  if (body.error) throw new Error(body.error.message)
  return body.data
}

export async function authDelete(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'x-api-key': requireApiKey() },
  })
  const body = await res.json()
  if (body.error) throw new Error(body.error.message)
  return body.data
}

export function hasApiKey(): boolean {
  return !!process.env.MERX_API_KEY
}

export function hasPrivateKey(): boolean {
  return !!process.env.TRON_PRIVATE_KEY
}
