import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { CircleAlert, CircleCheck, Plug, Save } from 'lucide-react'

import { createAIClient } from '../../lib/ai/client'
import { getErrorMessage } from '../../lib/ai/errors'
import { maskApiKey } from '../../lib/ai/maskApiKey'
import { getProviderPreset, providerOptions } from '../../lib/ai/providerPresets'
import type { AIProviderType, AISettings } from '../../lib/ai/types'
import {
  getAISettings,
  saveAISettings,
} from '../../lib/storage/repository'

type TestStatus =
  | { type: 'idle'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }

export function SettingsPage() {
  const [settings, setSettings] = useState<AISettings>(
    getProviderPreset('openai'),
  )
  const [testStatus, setTestStatus] = useState<TestStatus>({
    type: 'idle',
    message: '',
  })
  const [isTesting, setIsTesting] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      const savedSettings = await getAISettings()
      if (isMounted && savedSettings) {
        setSettings(savedSettings)
        setHasSaved(true)
      }
    }

    void loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const requiresApiKey = settings.connectionMode !== 'ollama-native'
  const maskedApiKey = useMemo(
    () => maskApiKey(settings.apiKey),
    [settings.apiKey],
  )

  function updateField<K extends keyof AISettings>(
    field: K,
    value: AISettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }))
    setTestStatus({ type: 'idle', message: '' })
  }

  function handleProviderChange(event: ChangeEvent<HTMLSelectElement>) {
    const providerType = event.target.value as AIProviderType
    setSettings(getProviderPreset(providerType))
    setTestStatus({ type: 'idle', message: '' })
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveAISettings(settings)
    setHasSaved(true)
    setTestStatus({ type: 'success', message: '设置已保存。' })
  }

  async function handleTestConnection() {
    setIsTesting(true)
    setTestStatus({ type: 'idle', message: '' })

    try {
      const client = createAIClient(settings)
      const content = await client.chat(
        [
          { role: 'system', content: '你是一个连接测试助手。' },
          { role: 'user', content: '请只回复 OK。' },
        ],
        { temperature: 0, stream: false },
      )

      if (!content.toUpperCase().includes('OK')) {
        setTestStatus({
          type: 'error',
          message: '已收到响应，但内容不包含 OK。请检查模型是否可用。',
        })
        return
      }

      setTestStatus({ type: 'success', message: '连接成功。' })
    } catch (error) {
      setTestStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-slate-500">设置</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          AI Provider
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          GapmapAI 只在本地保存配置。后续所有 AI 功能都会通过统一的
          aiClient.chat() 调用这里的设置。
        </p>
      </header>

      <form
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSave}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Provider
            </span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={settings.providerType}
              onChange={handleProviderChange}
            >
              {providerOptions.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Provider 名称
            </span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={settings.providerName}
              onChange={(event) =>
                updateField('providerName', event.target.value)
              }
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Base URL
            </span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="https://api.example.com/v1"
              value={settings.baseUrl}
              onChange={(event) => updateField('baseUrl', event.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">模型</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="模型名称"
              value={settings.model}
              onChange={(event) => updateField('model', event.target.value)}
            />
          </label>

          <label className="block">
            <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
              API Key
              <span className="text-xs font-normal text-slate-500">
                {requiresApiKey ? '必填' : '可留空'}
              </span>
            </span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder={requiresApiKey ? '请输入 API Key' : 'Ollama 可留空'}
              type="password"
              value={settings.apiKey}
              onChange={(event) => updateField('apiKey', event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3 rounded-md bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-3">
          <InfoItem label="连接模式" value={settings.connectionMode} />
          <InfoItem label="API Key 状态" value={maskedApiKey} />
          <InfoItem label="保存状态" value={hasSaved ? '已保存' : '未保存'} />
        </div>

        {testStatus.message ? (
          <div
            className={
              testStatus.type === 'error'
                ? 'mt-5 flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'
                : 'mt-5 flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700'
            }
          >
            {testStatus.type === 'error' ? (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{testStatus.message}</span>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
          >
            <Save className="h-4 w-4" />
            保存设置
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
            disabled={isTesting}
            type="button"
            onClick={handleTestConnection}
          >
            <Plug className="h-4 w-4" />
            {isTesting ? '正在测试...' : '测试连接'}
          </button>
        </div>
      </form>
    </section>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-400">{label}</div>
      <div className="mt-1 break-words text-slate-700">{value}</div>
    </div>
  )
}
