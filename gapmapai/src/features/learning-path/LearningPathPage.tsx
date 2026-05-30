import { useEffect, useState } from 'react'
import {
  Clock3,
  Download,
  FileCheck2,
  Map,
  Route,
  Sparkles,
} from 'lucide-react'

import { getErrorMessage } from '../../lib/ai/errors'
import { downloadGoalMarkdown } from '../../lib/export/markdownExport'
import { getLearningPathByGoalId } from '../../lib/storage/repository'
import type { Goal, LearningPath, LearningStep } from '../../lib/types'
import { generateAndSaveConceptCard } from '../concept-card/generateConceptCard'

type LearningPathPageProps = {
  currentGoal: Goal | null
  onConceptCardGenerated: () => void
}

export function LearningPathPage({
  currentGoal,
  onConceptCardGenerated,
}: LearningPathPageProps) {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [generatingConcept, setGeneratingConcept] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadPath() {
      if (!currentGoal) {
        setLearningPath(null)
        return
      }

      const path = await getLearningPathByGoalId(currentGoal.id)
      if (isMounted) {
        setLearningPath(path)
      }
    }

    void loadPath()

    return () => {
      isMounted = false
    }
  }, [currentGoal])

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
      <EmptyPath
        title="还没有选择目标"
        description="请先新建目标或从历史记录中选择目标。"
      />
    )
  }

  if (!learningPath) {
    return (
      <EmptyPath
        title="还没有学习路径"
        description="请先进入“盲区报告”页面，基于报告生成最小学习路径。"
      />
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">学习路径</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {learningPath.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {learningPath.summary}
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
            type="button"
            onClick={() => void handleExportMarkdown()}
          >
            <Download className="h-4 w-4" />
            导出 Markdown
          </button>
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

      <div className="space-y-4">
        {learningPath.steps.map((step, index) => (
          <LearningStepCard
            key={step.id}
            generatingConcept={generatingConcept}
            order={index + 1}
            step={step}
            onGenerateConceptCard={handleGenerateConceptCard}
          />
        ))}
      </div>
    </section>
  )
}

function LearningStepCard({
  generatingConcept,
  onGenerateConceptCard,
  order,
  step,
}: {
  generatingConcept: string
  onGenerateConceptCard: (conceptName: string) => void
  order: number
  step: LearningStep
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-400">
            Step {order}
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {step.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {step.explanation}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          <Clock3 className="h-3.5 w-3.5" />
          {step.estimatedTime}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <InfoBlock icon={FileCheck2} title="可验证产出" value={step.output} />
        <InfoBlock
          icon={Route}
          title="为什么现在学这一步"
          value={step.whyThisStepNow}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ConceptListBlock
          generatingConcept={generatingConcept}
          title="相关概念"
          values={step.relatedConcepts}
          onGenerateConceptCard={onGenerateConceptCard}
        />
        <ListBlock title="当前阶段先不要学" values={step.skipTheseForNow} />
      </div>
    </article>
  )
}

function InfoBlock({
  icon: Icon,
  title,
  value,
}: {
  icon: typeof FileCheck2
  title: string
  value: string
}) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-slate-500" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </div>
  )
}

function ConceptListBlock({
  generatingConcept,
  onGenerateConceptCard,
  title,
  values,
}: {
  generatingConcept: string
  onGenerateConceptCard: (conceptName: string) => void
  title: string
  values: string[]
}) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {values.length > 0 ? (
          values.map((value) => {
            const isGenerating = generatingConcept === value

            return (
              <li
                key={value}
                className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm leading-5 text-slate-700 ring-1 ring-slate-200"
              >
                <span>{value}</span>
                <button
                  className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
                  disabled={Boolean(generatingConcept)}
                  type="button"
                  onClick={() => onGenerateConceptCard(value)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGenerating ? '正在生成' : '生成卡片'}
                </button>
              </li>
            )
          })
        ) : (
          <li className="text-sm text-slate-500">暂无</li>
        )}
      </ul>
    </div>
  )
}

function ListBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {values.length > 0 ? (
          values.map((value) => (
            <li
              key={value}
              className="rounded-md bg-white px-3 py-2 text-sm leading-5 text-slate-700 ring-1 ring-slate-200"
            >
              {value}
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">暂无</li>
        )}
      </ul>
    </div>
  )
}

function EmptyPath({
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
