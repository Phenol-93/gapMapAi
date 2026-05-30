export type AIProviderType =
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'qwen'
  | 'siliconflow'
  | 'ollama'
  | 'custom'

export type AIConnectionMode = 'openai-compatible' | 'ollama-native'

export type AISettings = {
  providerType: AIProviderType
  connectionMode: AIConnectionMode
  providerName: string
  baseUrl: string
  apiKey: string
  model: string
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatOptions = {
  temperature?: number
  maxTokens?: number
  responseFormat?: {
    type: string
  }
  stream?: boolean
}

export type AIClient = {
  chat: (messages: ChatMessage[], options?: ChatOptions) => Promise<string>
}
