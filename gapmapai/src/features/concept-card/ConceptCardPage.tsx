import { useEffect, useState } from 'react'
import { BookOpen, Lightbulb } from 'lucide-react'

import { getConceptCardsByGoalId } from '../../lib/storage/repository'
import type { ConceptCard, Goal } from '../../lib/types'

type ConceptCardPageProps = {
  currentGoal: Goal | null
}

export function ConceptCardPage({ currentGoal }: ConceptCardPageProps) {
  const [cards, setCards] = useState<ConceptCard[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadCards() {
      if (!currentGoal) {
        setCards([])
        return
      }

      const nextCards = await getConceptCardsByGoalId(currentGoal.id)
      if (isMounted) {
        setCards(nextCards)
      }
    }

    void loadCards()

    return () => {
      isMounted = false
    }
  }, [currentGoal])

  if (!currentGoal) {
    return (
      <EmptyCards
        title="还没有选择目标"
        description="请先新建目标或从历史记录中选择目标。"
      />
    )
  }

  if (cards.length === 0) {
    return (
      <EmptyCards
        title="还没有概念卡片"
        description="你可以在知识树、盲区报告或学习路径中点击“生成卡片”。"
      />
    )
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-slate-500">概念卡片</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {currentGoal.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          这些卡片会围绕当前目标解释概念，不做百科式堆砌。
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {card.conceptName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {card.oneSentence}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <Info title="详细解释" value={card.explanation} />
              <Info title="为什么要学" value={card.whyItMatters} />
              <Info title="需要学到什么程度" value={card.learnDepth} />
              <Info title="类比" value={card.analogy} />
              <Info title="例子" value={card.example} />
              <ListInfo title="常见误解" values={card.commonMisunderstandings} />
              <ListInfo title="相关概念" values={card.relatedConcepts} />
              <ListInfo title="暂时不用深究" values={card.notNecessaryYet} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <section>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1">{value || '暂无'}</p>
    </section>
  )
}

function ListInfo({ title, values }: { title: string; values: string[] }) {
  return (
    <section>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {values.length > 0 ? (
          values.map((value) => <li key={value}>{value}</li>)
        ) : (
          <li>暂无</li>
        )}
      </ul>
    </section>
  )
}

function EmptyCards({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        <BookOpen className="h-5 w-5" />
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
