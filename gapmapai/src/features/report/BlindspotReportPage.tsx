import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Download,
  EyeOff,
  Map,
  Sparkles,
  Target,
} from 'lucide-react'
import { nanoid } from 'nanoid'

import { createAIClient } from '../../lib/ai/client'
import { getErrorMessage } from '../../lib/ai/errors'
import { downloadGoalMarkdown } from '../../lib/export/markdownExport'
import { generateLearningPathPrompt } from '../../lib/prompts/generateLearningPathPrompt'
import {
  getAISettings,
  getBlindspotReportByGoalId,
  getKnowledgeTreeByGoalId,
  saveLearningPath,
} from '../../lib/storage/repository'
import type {
  BlindspotReport,
  Goal,
  LearningPath,
  LearningStep,
} from '../../lib/types'
import { extractJsonFromText, safeJsonParse } from '../../lib/utils/json'
import { generateAndSaveConceptCard } from '../concept-card/generateConceptCard'

type BlindspotReportPageProps = {
  currentGoal: Goal | null
  onConceptCardGenerated: () => void
  onLearningPathGenerated: () => void
}

const reportSections: Array<{
  key: keyof Pick<
    BlindspotReport,
    | 'mastered'
    | 'fuzzy'
    | 'missing'
    | 'misconceptions'
    | 'canSkipForNow'
    | 'nextFocus'
  >
  title: string
  description: string
  icon: LucideIcon
}> = [
  {
    key: 'mastered',
    title: '已掌握',
    description: '用户已经理解得比较好的知识点。',
    icon: CheckCircle2,
  },
  {
    key: 'fuzzy',
    title: '模糊理解',
    description: '听过但讲不清，或者只理解表面的知识点。',
    icon: CircleHelp,
  },
  {
    key: 'missing',
    title: '严重缺口',
    description: '为了完成当前目标必须补的知识点。',
    icon: AlertTriangle,
  },
  {
    key: 'misconceptions',
    title: '错误理解',
    description: '可能理解错，或容易走偏的地方。',
    icon: AlertTriangle,
  },
  {
    key: 'canSkipForNow',
    title: '暂时不用学',
    description: '为了当前目标可以先放一放的内容。',
    icon: EyeOff,
  },
  {
    key: 'nextFocus',
    title: '下一步重点',
    description: '最多 5 个最应该优先补的知识点。',
    icon: Target,
  },
]

export function BlindspotReportPage({
  currentGoal,
  onConceptCardGenerated,
  onLearningPathGenerated,
}: BlindspotReportPageProps) {
  const [report, setReport] = useState<BlindspotReport | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingConcept, setGeneratingConcept] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadReport() {
      if (!currentGoal) {
        setReport(null)
        return
      }

      const nextReport = await getBlindspotReportByGoalId(currentGoal.id)
      if (isMounted) {
        setReport(nextReport)
      }
    }

    void loadReport()

    return () => {
      isMounted = false
    }
  }, [currentGoal])

  async function handleGenerateLearningPath() {
    if (!currentGoal || !report) {
      setError('请先生成盲区报告。')
      return
    }

    const knowledgeTree = await getKnowledgeTreeByGoalId(currentGoal.id)
    const aiSettings = await getAISettings()

    if (!knowledgeTree) {
      setError('当前目标还没有知识树。请先生成知识树。')
      return
    }

    if (!aiSettings) {
      setError('请先到“设置”页面填写并保存 AI Provider 信息。')
      return
    }

    setError('')
    setIsGenerating(true)

    try {
      const client = createAIClient(aiSettings)
      const content = await client.chat(
        generateLearningPathPrompt({
          blindspotReport: report,
          goal: currentGoal,
          knowledgeTree,
        }),
        {
          temperature: 0.2,
          maxTokens: 3500,
          responseFormat: { type: 'json_object' },
          stream: false,
        },
      )
      const parseResult = safeJsonParse<Partial<LearningPath>>(
        extractJsonFromText(content),
      )

      if (!parseResult.ok) {
        setError('AI 返回格式错误，可以重试。')
        return
      }

      await saveLearningPath(normalizeLearningPath(parseResult.data, currentGoal))
      onLearningPathGenerated()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleGenerateConceptCard(conceptName: string) {
    if (!currentGoal) {
      setError('请先选择目标。')
      return
    }

    setError('')
    setGeneratingConcept(conceptName)

    try {
      await generateAndSaveConceptCard({ conceptName, goal: currentGoal })
      onConceptCardGenerated()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setGeneratingConcept('')
    }
  }

  async function handleExportMarkdown() {
    if (!currentGoal) {
      setError('请先选择目标。')
      return
    }

    try {
      setError('')
      setSuccess('')
      const result = await downloadGoalMarkdown(currentGoal.id)
      if (!result.canceled) {
        setSuccess(result.message)
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : '导出失败。')
    }
  }

  if (!currentGoal) {
    return (
      <EmptyReport
        title="还没有选择目标"
        description="请先新建目标或从历史记录中选择目标。"
      />
    )
  }

  if (!report) {
    return (
      <EmptyReport
        title="还没有盲区报告"
        description="请先进入“AI 诊断”页面，完成追问诊断后生成盲区报告。"
      />
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">盲区报告</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              盲区报告
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              这份报告根据目标、知识树和 AI 诊断记录生成，用来帮你把学习精力放在真正卡住目标的地方。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
              disabled={isGenerating}
              type="button"
              onClick={() => void handleGenerateLearningPath()}
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? '正在生成...' : '生成最小学习路径'}
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              type="button"
              onClick={() => void handleExportMarkdown()}
            >
              <Download className="h-4 w-4" />
              导出 Markdown
            </button>
          </div>
        </div>
        <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">当前目标：</span>
          {currentGoal.title}
        </div>
        {error ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {reportSections.map((section) => {
          const Icon = section.icon
          const items = report[section.key]

          return (
            <article
              key={section.key}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    {section.title}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {section.description}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {items.length > 0 ? (
                  items.map((item) => {
                    const isGeneratingCard = generatingConcept === item

                    return (
                      <li
                        key={item}
                        className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
                      >
                        <span>{item}</span>
                        <button
                          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
                          disabled={Boolean(generatingConcept)}
                          type="button"
                          onClick={() => void handleGenerateConceptCard(item)}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {isGeneratingCard ? '正在生成' : '生成卡片'}
                        </button>
                      </li>
                    )
                  })
                ) : (
                  <li className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    暂无明确判断。
                  </li>
                )}
              </ul>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function normalizeLearningPath(
  value: Partial<LearningPath>,
  goal: Goal,
): LearningPath {
  return {
    id: typeof value.id === 'string' ? value.id : nanoid(),
    goalId: goal.id,
    title:
      typeof value.title === 'string' && value.title.trim()
        ? value.title
        : `${goal.title}：最小学习路径`,
    summary:
      typeof value.summary === 'string' && value.summary.trim()
        ? value.summary
        : '围绕当前目标生成的最短可执行学习路径。',
    steps: Array.isArray(value.steps)
      ? value.steps.map(normalizeLearningStep)
      : [],
    createdAt: new Date().toISOString(),
  }
}

function normalizeLearningStep(value: Partial<LearningStep>): LearningStep {
  return {
    id: typeof value.id === 'string' ? value.id : nanoid(),
    title: typeof value.title === 'string' ? value.title : '未命名步骤',
    explanation:
      typeof value.explanation === 'string' ? value.explanation : '',
    output: typeof value.output === 'string' ? value.output : '',
    estimatedTime:
      typeof value.estimatedTime === 'string' ? value.estimatedTime : '待评估',
    relatedConcepts: normalizeStringList(value.relatedConcepts),
    whyThisStepNow:
      typeof value.whyThisStepNow === 'string' ? value.whyThisStepNow : '',
    skipTheseForNow: normalizeStringList(value.skipTheseForNow),
  }
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function EmptyReport({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        <Map className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  )
}
