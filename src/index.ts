#!/usr/bin/env node
import { createInterface } from 'readline'
import type { McpRequest } from './types.js'
import { handleRequest } from './handler.js'

const rl = createInterface({ input: process.stdin, terminal: false })

rl.on('line', async (line) => {
  let req: McpRequest
  try {
    req = JSON.parse(line)
  } catch {
    process.stdout.write(
      JSON.stringify({ error: { code: -32700, message: 'Parse error' } }) + '\n',
    )
    return
  }
  const response = await handleRequest(req)
  process.stdout.write(JSON.stringify(response) + '\n')
})
