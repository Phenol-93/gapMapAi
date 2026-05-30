import { invoke } from '@tauri-apps/api/core'

import { isTauriRuntime } from './sqlite/database'

export async function saveSecureApiKey(apiKey: string): Promise<void> {
  ensureTauriRuntime()

  if (apiKey.trim()) {
    await invoke('save_api_key', { apiKey })
  } else {
    await invoke('delete_api_key')
  }
}

export async function getSecureApiKey(): Promise<string> {
  ensureTauriRuntime()

  return (await invoke<string | null>('get_api_key')) ?? ''
}

function ensureTauriRuntime(): void {
  if (!isTauriRuntime()) {
    throw new Error('安全 API Key 存储仅在 GapmapAI 桌面版中可用。')
  }
}
