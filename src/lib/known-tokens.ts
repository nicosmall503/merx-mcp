export const KNOWN_TOKENS: Record<
  string,
  { address: string; decimals: number; name: string }
> = {
  USDT: {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    name: 'Tether USD',
  },
  USDC: {
    address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
    decimals: 6,
    name: 'USD Coin',
  },
  USDD: {
    address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
    decimals: 18,
    name: 'USDD',
  },
  SUN: {
    address: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9',
    decimals: 18,
    name: 'SUN',
  },
  BTT: {
    address: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4',
    decimals: 18,
    name: 'BitTorrent',
  },
  WIN: {
    address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
    decimals: 6,
    name: 'WINkLink',
  },
  JST: {
    address: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9',
    decimals: 18,
    name: 'JUST',
  },
}

export function resolveToken(
  token: string
): { address: string; decimals: number; name: string } | null {
  const upper = token.toUpperCase()
  if (KNOWN_TOKENS[upper]) return KNOWN_TOKENS[upper]
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(token)) {
    return { address: token, decimals: 6, name: token }
  }
  return null
}
