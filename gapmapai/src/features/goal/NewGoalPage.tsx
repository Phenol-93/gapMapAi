import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { nanoid } from 'nanoid'

import { createAIClient } from '../../lib/ai/client'
import { AIClientError, getErrorMessage } from '../../lib/ai/errors'
import { generateKnowledgeTreePrompt } from '../../lib/prompts/generateKnowledgeTreePrompt'
import {
  getAISettings,
  saveGoal,
  saveKnowledgeTree,
} from '../../lib/storage/repository'
import type { Concept, Goal, KnowledgeModule, KnowledgeTree } from '../../lib/types'
import type { AIClient } from '../../lib/ai/types'
import { goalTypeOptions } from '../../lib/types/goalLabels'
import { extractJsonFromText, safeJsonParse } from '../../lib/utils/json'

type NewGoalPageProps = {
  initialTitle: string
  onKnowledgeTreeGenerated: (goal: Goal, knowledgeTree: KnowledgeTree) => void
}

export function NewGoalPage({
  initialTitle,
  onKnowledgeTreeGenerated,
}: NewGoalPageProps) {
  const [title, setTitle] = useState(initialTitle)
  const [knownBackground, setKnownBackground] = useState('')
  const [analogyDomain, setAnalogyDomain] = useState('')
  const [goalType, setGoalType] =
    useState<Goal['goalType']>('learning-domain')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('请先填写你想学习、理解或完成什么。')
      return
    }

    const aiSettings = await getAISettings()

    if (!aiSettings) {
      setError('请先到“设置”页面填写并保存 AI Provider 信息。')
      return
    }

    const now = new Date().toISOString()
    const goal: Goal = {
      id: nanoid(),
      title: trimmedTitle,
      description: trimmedTitle,
      goalType,
      knownBackground: knownBackground.trim(),
      analogyDomain: analogyDomain.trim(),
      createdAt: now,
      updatedAt: now,
    }

    setIsGenerating(true)
    setError('')

    try {
      await saveGoal(goal)

      const client = createAIClient(aiSettings)
      const content = await generateKnowledgeTreeContent(client, goal)
      const parseResult = safeJsonParse<Partial<KnowledgeTree>>(
        extractJsonFromText(content),
      )

      if (!parseResult.ok) {
        setError('AI 返回内容不是合法 JSON，请重试或换一个模型。')
        return
      }

      const knowledgeTree = normalizeKnowledgeTree(parseResult.data, goal)
      await saveKnowledgeTree(knowledgeTree)
      onKnowledgeTreeGenerated(goal, knowledgeTree)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-slate-500">新建目标</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          创建一个学习目标
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          填写目标后直接生成第一版知识树。后续诊断、盲区报告和学习路径都会围绕这个目标展开。
        </p>
      </header>

      <form
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              我想学习 / 理解 / 完成什么？
            </span>
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="例如：我想做一个 AI PDF 问答工具"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError('')
              }}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                我已经懂什么？
              </span>
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                placeholder="例如：我会 React，懂一点后端 API"
                value={knownBackground}
                onChange={(event) => setKnownBackground(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                我希望 AI 用什么领域来类比？
              </span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                placeholder="编程、游戏、商业、生活经验"
                value={analogyDomain}
                onChange={(event) => setAnalogyDomain(event.target.value)}
              />
            </label>
          </div>

          <label className="block max-w-sm">
            <span className="text-sm font-medium text-slate-700">
              目标类型
            </span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={goalType}
              onChange={(event) =>
                setGoalType(event.target.value as Goal['goalType'])
              }
            >
              {goalTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
            disabled={isGenerating}
            type="submit"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? '正在生成...' : '生成知识树'}
          </button>
          <div className="inline-flex h-11 items-center gap-2 text-sm text-slate-500">
            生成后自动进入知识树页面
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </form>
    </section>
  )
}

async function generateKnowledgeTreeContent(
  client: AIClient,
  goal: Goal,
): Promise<string> {
  const messages = generateKnowledgeTreePrompt(goal)

  try {
    return await client.chat(messages, {
      temperature: 0.2,
      maxTokens: 4000,
      responseFormat: { type: 'json_object' },
      stream: false,
    })
  } catch (error) {
    if (isJsonModeUnsupported(error)) {
      return client.chat(messages, {
        temperature: 0.2,
        maxTokens: 4000,
        stream: false,
      })
    }

    throw error
  }
}

function isJsonModeUnsupported(error: unknown): boolean {
  if (!(error instanceof AIClientError)) {
    return false
  }

  return (
    error.code === 'bad-request' &&
    Boolean(error.providerMessage?.toLowerCase().includes('response_format'))
  )
}

function normalizeKnowledgeTree(
  value: Partial<KnowledgeTree>,
  goal: Goal,
): KnowledgeTree {
  if (!value || typeof value !== 'object') {
    throw new Error('AI 返回 JSON 格式异常，缺少知识树对象。')
  }

  return {
    id: typeof value.id === 'string' ? value.id : nanoid(),
    goalId: goal.id,
    title:
      typeof value.title === 'string' && value.title.trim()
        ? value.title
        : `${goal.title}：知识树`,
    summary:
      typeof value.summary === 'string' && value.summary.trim()
        ? value.summary
        : 'AI 已生成围绕当前目标的知识结构。',
    modules: Array.isArray(value.modules)
      ? value.modules.map(normalizeModule)
      : [],
    createdAt: new Date().toISOString(),
  }
}

function normalizeModule(value: Partial<KnowledgeModule>): KnowledgeModule {
  return {
    id: typeof value.id === 'string' ? value.id : nanoid(),
    title: typeof value.title === 'string' ? value.title : '未命名模块',
    description:
      typeof value.description === 'string' ? value.description : '',
    importance: normalizeImportance(value.importance),
    difficulty: normalizeDifficulty(value.difficulty),
    concepts: Array.isArray(value.concepts)
      ? value.concepts.map(normalizeConcept)
      : [],
    children: Array.isArray(value.children)
      ? value.children.map(normalizeModule)
      : [],
  }
}

function normalizeConcept(value: Partial<Concept>): Concept {
  return {
    id: typeof value.id === 'string' ? value.id : nanoid(),
    name: typeof value.name === 'string' ? value.name : '未命名概念',
    shortExplanation:
      typeof value.shortExplanation === 'string'
        ? value.shortExplanation
        : '',
    whyLearn: typeof value.whyLearn === 'string' ? value.whyLearn : '',
    requiredDepth:
      typeof value.requiredDepth === 'string' ? value.requiredDepth : '',
    misconceptions: Array.isArray(value.misconceptions)
      ? value.misconceptions.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
    relatedConcepts: Array.isArray(value.relatedConcepts)
      ? value.relatedConcepts.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
  }
}

function normalizeImportance(
  value: KnowledgeModule['importance'] | undefined,
): KnowledgeModule['importance'] {
  return value === 'required' || value === 'useful' || value === 'optional'
    ? value
    : 'useful'
}

function normalizeDifficulty(
  value: KnowledgeModule['difficulty'] | undefined,
): KnowledgeModule['difficulty'] {
  return value === 'beginner' ||
    value === 'intermediate' ||
    value === 'advanced'
    ? value
    : 'beginner'
}
