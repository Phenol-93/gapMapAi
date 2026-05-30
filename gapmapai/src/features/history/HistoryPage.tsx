import { useEffect, useState } from 'react'
import { Clock, Download, Trash2 } from 'lucide-react'

import { downloadGoalMarkdown } from '../../lib/export/markdownExport'
import {
  deleteGoal,
  getGoals,
} from '../../lib/storage/repository'
import type { Goal } from '../../lib/types'
import { goalTypeLabels } from '../../lib/types/goalLabels'

type HistoryPageProps = {
  currentGoalId: string | null
  onDeleteCurrentGoal: () => void
  onSelectGoal: (goal: Goal) => void
}

export function HistoryPage({
  currentGoalId,
  onDeleteCurrentGoal,
  onSelectGoal,
}: HistoryPageProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void refreshGoals()
  }, [])

  async function refreshGoals() {
    setGoals(await getGoals())
  }

  async function handleDeleteGoal(goalId: string) {
    await deleteGoal(goalId)
    if (goalId === currentGoalId) {
      onDeleteCurrentGoal()
    }
    await refreshGoals()
  }

  async function handleExportGoal(goalId: string) {
    try {
      setError('')
      setSuccess('')
      const result = await downloadGoalMarkdown(goalId)
      if (!result.canceled) {
        setSuccess(result.message)
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : '导出失败。')
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-slate-500">历史记录</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          已保存目标
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          这里展示本地保存过的目标。点击任意目标即可切换为当前目标，也可以导出完整 Markdown。
        </p>
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

      {goals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          还没有保存目标。可以先去“新建目标”创建第一个目标。
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <article
              key={goal.id}
              className={
                goal.id === currentGoalId
                  ? 'rounded-lg border border-slate-900 bg-white p-4 shadow-sm'
                  : 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm'
              }
            >
              <div className="flex items-start justify-between gap-4">
                <button
                  className="min-w-0 flex-1 text-left"
                  type="button"
                  onClick={() => onSelectGoal(goal)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-base font-semibold text-slate-950">
                      {goal.title}
                    </h2>
                    {goal.id === currentGoalId ? (
                      <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs font-medium text-white">
                        当前目标
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{goalTypeLabels[goal.goalType]}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(goal.createdAt)}
                    </span>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="导出 Markdown"
                    type="button"
                    onClick={() => void handleExportGoal(goal.id)}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="删除目标"
                    type="button"
                    onClick={() => void handleDeleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '时间未知'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
