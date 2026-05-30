import type { AIConnectionMode } from './types'

export type AIErrorCode =
  | 'missing-api-key'
  | 'missing-base-url'
  | 'missing-model'
  | 'bad-request'
  | 'network-error'
  | 'unauthorized'
  | 'not-found'
  | 'rate-limited'
  | 'invalid-response'
  | 'ollama-offline'
  | 'ollama-model-missing'
  | 'request-failed'

export class AIClientError extends Error {
  code: AIErrorCode
  status?: number
  providerMessage?: string
  connectionMode?: AIConnectionMode

  constructor(
    code: AIErrorCode,
    message: string,
    options: {
      status?: number
      providerMessage?: string
      connectionMode?: AIConnectionMode
    } = {},
  ) {
    super(message)
    this.name = 'AIClientError'
    this.code = code
    this.status = options.status
    this.providerMessage = options.providerMessage
    this.connectionMode = options.connectionMode
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AIClientError) {
    return mapAIClientError(error)
  }

  if (typeof error === 'string') {
    return mapGenericErrorMessage(error)
  }

  if (error instanceof Error) {
    return mapGenericErrorMessage(error.message)
  }

  if (isErrorLike(error)) {
    return mapGenericErrorMessage(error.message)
  }

  return '发生未知错误。请重试；如果仍然失败，请检查 AI 设置、网络和本地数据库状态。'
}

function mapAIClientError(error: AIClientError): string {
  if (error.code === 'missing-api-key') {
    return '请填写 API Key。Ollama Native 模式可以留空，其他 Provider 通常都需要 API Key。'
  }

  if (error.code === 'missing-base-url') {
    return '请填写 Base URL。'
  }

  if (error.code === 'missing-model') {
    return '请填写模型名称。'
  }

  if (error.code === 'network-error') {
    return '网络请求失败，请检查网络、Base URL 或本地代理设置。'
  }

  if (error.code === 'bad-request') {
    if (error.providerMessage?.toLowerCase().includes('response_format')) {
      return 'AI Provider 拒绝了 JSON 输出参数 response_format。请换一个支持 JSON 模式的模型，或改用 OpenAI-Compatible 服务。'
    }

    return error.providerMessage
      ? `AI 请求参数被拒绝：${error.providerMessage}`
      : 'AI 请求参数被拒绝。请检查模型名、Base URL 和 Provider 是否匹配。'
  }

  if (error.code === 'ollama-offline') {
    return '无法连接 Ollama。请确认 Ollama 已启动，并且 Base URL 通常为 http://localhost:11434。'
  }

  if (error.code === 'unauthorized') {
    return '连接失败：API Key 可能错误、已过期，或当前账号没有访问权限。'
  }

  if (error.code === 'not-found') {
    return '连接失败：接口不存在。请检查 Base URL 是否正确，以及是否重复填写了 /v1 或 /api。'
  }

  if (error.code === 'rate-limited') {
    return '连接失败：请求被限流，或当前额度不足。请稍后重试或检查账号额度。'
  }

  if (error.code === 'ollama-model-missing') {
    return 'Ollama 未找到该模型。请先运行 ollama pull 模型名，例如 ollama pull llama3.2。'
  }

  if (error.code === 'invalid-response') {
    return 'AI 返回格式异常。请检查 Provider、Base URL、模型名是否匹配。'
  }

  if (error.providerMessage) {
    return `连接失败：${error.providerMessage}`
  }

  return '连接失败，请检查 API Key、Base URL、模型名和网络状态。'
}

function mapGenericErrorMessage(message: string): string {
  const trimmed = message.trim()

  if (!trimmed) {
    return '发生未知错误。请重试；如果仍然失败，请检查 AI 设置、网络和本地数据库状态。'
  }

  const lowerMessage = trimmed.toLowerCase()

  if (lowerMessage.includes('response_format')) {
    return 'AI Provider 不支持当前 JSON 输出参数 response_format。请换一个支持 JSON 模式的模型，或改用兼容性更好的 Provider。'
  }

  if (
    lowerMessage.includes('database') ||
    lowerMessage.includes('sqlite') ||
    lowerMessage.includes('sql')
  ) {
    return `本地数据库操作失败：${trimmed}`
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch')
  ) {
    return `网络请求失败：${trimmed}`
  }

  return trimmed
}

function isErrorLike(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  )
}
