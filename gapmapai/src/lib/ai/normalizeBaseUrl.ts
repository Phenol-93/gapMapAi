import type { AIConnectionMode } from './types'

export function normalizeBaseUrl(
  baseUrl: string,
  connectionMode: AIConnectionMode = 'openai-compatible',
): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')

  if (connectionMode === 'ollama-native') {
    return trimmed.replace(/\/api$/, '')
  }

  return trimmed.replace(/\/chat\/completions$/, '')
}
