export interface McpToolAnnotations {
  title?: string
  readOnlyHint?: boolean
  destructiveHint?: boolean
  idempotentHint?: boolean
  openWorldHint?: boolean
}

export interface McpTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  annotations?: McpToolAnnotations
  handler: (input: Record<string, unknown>) => Promise<McpToolResult>
}

export interface McpToolResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

export interface McpPrompt {
  name: string
  description: string
  arguments: McpPromptArg[]
}

export interface McpPromptArg {
  name: string
  description: string
  required?: boolean
}

export interface McpResource {
  uri: string
  name: string
  description: string
  mimeType: string
}

export interface McpResourceTemplate {
  uriTemplate: string
  name: string
  description: string
  mimeType: string
}

export interface McpRequest {
  id?: number | string
  method: string
  params?: Record<string, unknown>
}

export interface McpResponse {
  jsonrpc?: '2.0'
  id?: number | string
  result?: unknown
  error?: { code: number; message: string }
}
