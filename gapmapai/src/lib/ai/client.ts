import { AIClientError } from './errors'
import { normalizeBaseUrl } from './normalizeBaseUrl'
import type { AIClient, AISettings, ChatMessage, ChatOptions } from './types'

type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
    code?: string | number
    type?: string
  }
}

type OllamaChatResponse = {
  message?: {
    content?: string
  }
  error?: string
}

export function createAIClient(settings: AISettings): AIClient {
  return {
    chat: (messages, options = {}) => chat(settings, messages, options),
  }
}

async function chat(
  settings: AISettings,
  messages: ChatMessage[],
  options: ChatOptions,
): Promise<string> {
  validateSettings(settings)

  if (settings.connectionMode === 'ollama-native') {
    return chatWithOllama(settings, messages)
  }

  return chatWithOpenAICompatible(settings, messages, options)
}

function validateSettings(settings: AISettings): void {
  if (!settings.baseUrl.trim()) {
    throw new AIClientError('missing-base-url', 'Missing Base URL')
  }

  if (!settings.model.trim()) {
    throw new AIClientError('missing-model', 'Missing model')
  }

  if (
    settings.connectionMode !== 'ollama-native' &&
    !settings.apiKey.trim()
  ) {
    throw new AIClientError('missing-api-key', 'Missing API Key')
  }
}

async function chatWithOpenAICompatible(
  settings: AISettings,
  messages: ChatMessage[],
  options: ChatOptions,
): Promise<string> {
  const endpoint = `${normalizeBaseUrl(settings.baseUrl, settings.connectionMode)}/chat/completions`
  const body: Record<string, unknown> = {
    model: settings.model.trim(),
    messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    stream: false,
  }

  if (options.responseFormat) {
    body.response_format = options.responseFormat
  }

  const response = await safeFetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await readResponseJson(response)) as OpenAICompatibleResponse

  if (!response.ok) {
    throwStatusError(
      response.status,
      extractProviderMessage(data),
      settings.connectionMode,
    )
  }

  const content = data.choices?.[0]?.message?.content

  if (typeof content !== 'string') {
    throw new AIClientError('invalid-response', 'Invalid AI response', {
      connectionMode: settings.connectionMode,
    })
  }

  return content
}

async function chatWithOllama(
  settings: AISettings,
  messages: ChatMessage[],
): Promise<string> {
  const endpoint = `${normalizeBaseUrl(settings.baseUrl, settings.connectionMode)}/api/chat`
  const response = await safeFetch(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model.trim(),
        messages,
        stream: false,
      }),
    },
    settings.connectionMode,
  )

  const data = (await readResponseJson(response)) as OllamaChatResponse

  if (!response.ok) {
    const message = data.error
    const lowerMessage = message?.toLowerCase() ?? ''

    if (lowerMessage.includes('not found') || lowerMessage.includes('pull')) {
      throw new AIClientError('ollama-model-missing', 'Ollama model missing', {
        status: response.status,
        providerMessage: message,
        connectionMode: settings.connectionMode,
      })
    }

    throwStatusError(response.status, message, settings.connectionMode)
  }

  const content = data.message?.content

  if (typeof content !== 'string') {
    throw new AIClientError('invalid-response', 'Invalid Ollama response', {
      connectionMode: settings.connectionMode,
    })
  }

  return content
}

async function safeFetch(
  input: RequestInfo | URL,
  init: RequestInit,
  connectionMode: AISettings['connectionMode'] = 'openai-compatible',
): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (error) {
    if (connectionMode === 'ollama-native') {
      throw new AIClientError('ollama-offline', 'Ollama is offline', {
        connectionMode,
      })
    }

    throw new AIClientError('network-error', 'Network request failed', {
      providerMessage: error instanceof Error ? error.message : undefined,
      connectionMode,
    })
  }
}

async function readResponseJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text.trim()) {
    if (response.ok) {
      throw new AIClientError('invalid-response', 'Response is empty')
    }

    return {}
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    if (!response.ok) {
      return { error: { message: text.slice(0, 500) } }
    }

    throw new AIClientError('invalid-response', 'Response is not JSON', {
      providerMessage: text.slice(0, 500),
    })
  }
}

function extractProviderMessage(data: OpenAICompatibleResponse): string | undefined {
  return data.error?.message
}

function throwStatusError(
  status: number,
  providerMessage?: string,
  connectionMode?: AISettings['connectionMode'],
): never {
  if (status === 401 || status === 403) {
    throw new AIClientError('unauthorized', 'Unauthorized', {
      status,
      providerMessage,
      connectionMode,
    })
  }

  if (status === 404) {
    throw new AIClientError('not-found', 'API endpoint not found', {
      status,
      providerMessage,
      connectionMode,
    })
  }

  if (status === 429) {
    throw new AIClientError('rate-limited', 'Rate limited', {
      status,
      providerMessage,
      connectionMode,
    })
  }

  if (status === 400) {
    throw new AIClientError('bad-request', 'Bad request', {
      status,
      providerMessage,
      connectionMode,
    })
  }

  throw new AIClientError('request-failed', 'AI request failed', {
    status,
    providerMessage,
    connectionMode,
  })
}
