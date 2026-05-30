import { useEffect, useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'

import { getErrorMessage } from '../../lib/ai/errors'
import { getKnowledgeTreeByGoalId } from '../../lib/storage/repository'
import type { Concept, Goal, KnowledgeModule, KnowledgeTree } from '../../lib/types'
import { generateAndSaveConceptCard } from '../concept-card/generateConceptCard'

type KnowledgeTreePageProps = {
  currentGoal: Goal | null
  onConceptCardGenerated: () => void
}

const importanceLabels: Record<KnowledgeModule['importance'], string> = {
  required: '必须学',
  useful: '有帮助',
  optional: '可选',
}

const difficultyLabels: Record<KnowledgeModule['difficulty'], string> = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '进阶',
}

export function KnowledgeTreePage({
  currentGoal,
  onConceptCardGenerated,
}: KnowledgeTreePageProps) {
  const [knowledgeTree, setKnowledgeTree] = useState<KnowledgeTree | null>(null)
  const [error, setError] = useState('')
  const [generatingConcept, setGeneratingConcept] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadTree() {
      if (!currentGoal) {
        setKnowledgeTree(null)
        return
      }

      const tree = await getKnowledgeTreeByGoalId(currentGoal.id)
      if (isMounted) {
        setKnowledgeTree(tree)
      }
    }

    void loadTree()

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

  if (!currentGoal) {
    return (
      <EmptyTree
        title="还没有选择目标"
        description="请先在“新建目标”中生成知识树，或从“历史记录”里选择一个目标。"
      />
    )
  }

  if (!knowledgeTree) {
    return (
      <EmptyTree
        title="当前目标还没有知识树"
        description="请回到“新建目标”生成知识树，后续这里会展示 AI 生成的目标导向知识结构。"
      />
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">知识树</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {knowledgeTree.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {knowledgeTree.summary}
        </p>
        <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">当前目标：</span>
          {currentGoal.title}
        </div>
        {error ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </header>

      <div className="space-y-4">
        {knowledgeTree.modules.map((module, index) => (
          <ModuleCard
            key={module.id}
            generatingConcept={generatingConcept}
            module={module}
            order={`${index + 1}`}
            onGenerateConceptCard={handleGenerateConceptCard}
          />
        ))}
      </div>
    </section>
  )
}

function ModuleCard({
  generatingConcept,
  module,
  onGenerateConceptCard,
  order,
}: {
  generatingConcept: string
  module: KnowledgeModule
  onGenerateConceptCard: (conceptName: string) => void
  order: string
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-400">模块 {order}</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {module.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {module.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{importanceLabels[module.importance]}</Badge>
          <Badge>{difficultyLabels[module.difficulty]}</Badge>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">关键概念</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {module.concepts.map((concept) => (
            <ConceptItem
              key={concept.id}
              concept={concept}
              isGenerating={generatingConcept === concept.name}
              isLocked={Boolean(generatingConcept)}
              onGenerateConceptCard={onGenerateConceptCard}
            />
          ))}
        </div>
      </div>

      {module.children.length > 0 ? (
        <div className="mt-5 space-y-3 border-l border-slate-200 pl-4">
          {module.children.map((child, index) => (
            <ModuleCard
              key={child.id}
              generatingConcept={generatingConcept}
              module={child}
              order={`${order}.${index + 1}`}
              onGenerateConceptCard={onGenerateConceptCard}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function ConceptItem({
  concept,
  isGenerating,
  isLocked,
  onGenerateConceptCard,
}: {
  concept: Concept
  isGenerating: boolean
  isLocked: boolean
  onGenerateConceptCard: (conceptName: string) => void
}) {
  return (
    <div className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-950">
            {concept.name}
          </h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {concept.shortExplanation}
          </p>
        </div>
        <button
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
          disabled={isLocked}
          type="button"
          onClick={() => onGenerateConceptCard(concept.name)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isGenerating ? '正在生成' : '生成卡片'}
        </button>
      </div>
      {concept.whyLearn ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          为什么学：{concept.whyLearn}
        </p>
      ) : null}
    </div>
  )
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {children}
    </span>
  )
}

function EmptyTree({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        <FileText className="h-5 w-5" />
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
