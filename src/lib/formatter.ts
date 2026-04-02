export function sunToTrx(sun: number): string {
  return (sun / 1_000_000).toFixed(4)
}

export function formatDuration(sec: number): string {
  if (sec <= 0) return 'flexible'
  if (sec < 3600) return `${sec / 60}m`
  if (sec < 86400) return `${sec / 3600}h`
  return `${sec / 86400}d`
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function errorResult(
  message: string
): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  }
}

export function textResult(
  text: string
): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text }] }
}
