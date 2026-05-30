import type { LucideIcon } from 'lucide-react'

type PlaceholderPageProps = {
  currentGoalTitle?: string | null
  description: string
  icon: LucideIcon
  title: string
}

export function PlaceholderPage({
  currentGoalTitle,
  description,
  icon: Icon,
  title,
}: PlaceholderPageProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
        <span className="font-medium text-slate-800">当前目标：</span>
        {currentGoalTitle ?? '尚未选择目标，请先新建或从历史记录中选择。'}
      </div>
    </section>
  )
}
