import { createHash } from 'crypto'

const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function sha256(data: Buffer): Buffer {
  return createHash('sha256').update(data).digest()
}

function base58Decode(str: string): Buffer {
  let num = 0n
  for (const c of str) {
    const idx = B58_ALPHABET.indexOf(c)
    if (idx < 0) throw new Error('Invalid base58 character')
    num = num * 58n + BigInt(idx)
  }
  const hex = num.toString(16).padStart(50, '0')
  return Buffer.from(hex, 'hex')
}

function base58Encode(buf: Buffer): string {
  let num = BigInt('0x' + buf.toString('hex'))
  let str = ''
  while (num > 0n) {
    str = B58_ALPHABET[Number(num % 58n)] + str
    num /= 58n
  }
  for (const b of buf) {
    if (b === 0) str = '1' + str
    else break
  }
  return str
}

export function base58ToHex(addr: string): string {
  const decoded = base58Decode(addr)
  const payload = decoded.slice(0, 21)
  const checksum = decoded.slice(21, 25)
  const hash = sha256(sha256(payload)).slice(0, 4)
  if (!hash.equals(checksum)) throw new Error('Invalid checksum')
  return payload.toString('hex')
}

export function hexToBase58(hex: string): string {
  const payload = Buffer.from(hex, 'hex')
  if (payload.length !== 21) {
    throw new Error('Hex address must be 21 bytes (42 hex chars)')
  }
  const checksum = sha256(sha256(payload)).slice(0, 4)
  return base58Encode(Buffer.concat([payload, checksum]))
}
