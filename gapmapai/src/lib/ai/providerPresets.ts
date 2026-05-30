import type { AIProviderType, AISettings } from './types'

export const providerPresets: Record<AIProviderType, AISettings> = {
  openai: {
    providerType: 'openai',
    connectionMode: 'openai-compatible',
    providerName: 'GPT / OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4.1-mini',
  },
  gemini: {
    providerType: 'gemini',
    connectionMode: 'openai-compatible',
    providerName: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey: '',
    model: 'gemini-3.5-flash',
  },
  deepseek: {
    providerType: 'deepseek',
    connectionMode: 'openai-compatible',
    providerName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-v4-flash',
  },
  qwen: {
    providerType: 'qwen',
    connectionMode: 'openai-compatible',
    providerName: '千问 / Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    model: 'qwen-plus',
  },
  siliconflow: {
    providerType: 'siliconflow',
    connectionMode: 'openai-compatible',
    providerName: '硅基流动 / SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKey: '',
    model: 'deepseek-ai/DeepSeek-R1',
  },
  ollama: {
    providerType: 'ollama',
    connectionMode: 'ollama-native',
    providerName: 'Ollama 本地',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
    model: 'llama3.2',
  },
  custom: {
    providerType: 'custom',
    connectionMode: 'openai-compatible',
    providerName: '自定义 OpenAI-Compatible',
    baseUrl: '',
    apiKey: '',
    model: '',
  },
}

export const providerOptions: Array<{
  label: string
  value: AIProviderType
}> = [
  { label: 'GPT / OpenAI', value: 'openai' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: '千问 / Qwen', value: 'qwen' },
  { label: '硅基流动 / SiliconFlow', value: 'siliconflow' },
  { label: 'Ollama 本地', value: 'ollama' },
  { label: '自定义 OpenAI-Compatible', value: 'custom' },
]

export function getProviderPreset(providerType: AIProviderType): AISettings {
  return { ...providerPresets[providerType] }
}
