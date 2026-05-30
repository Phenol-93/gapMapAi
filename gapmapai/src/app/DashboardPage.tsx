import { ArrowRight, GitBranch, Map, MessageSquare } from 'lucide-react'

type DashboardPageProps = {
  onStartNewGoal: (title?: string) => void
}

const capabilities = [
  {
    title: '生成知识树',
    description: '把目标拆成模块、概念和优先级，先知道该学什么。',
    icon: GitBranch,
  },
  {
    title: 'AI 追问诊断',
    description: '像知识面试一样逐轮追问，找出真正卡住你的地方。',
    icon: MessageSquare,
  },
  {
    title: '最小学习路径',
    description: '围绕当前目标补关键缺口，少学暂时用不上的内容。',
    icon: Map,
  },
]

const exampleGoals = [
  '我想做一个 AI PDF 问答工具',
  '我想系统理解投资',
  '我懂编程，想理解商业',
  '为什么 AI 会胡说八道？',
]

export function DashboardPage({ onStartNewGoal }: DashboardPageProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-slate-500">GapmapAI</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            输入目标，发现知识盲区，生成最短学习路径
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            从一个问题、项目或概念出发，先建立目标导向的知识结构，再通过
            AI 追问诊断盲区，最后生成一条更短、更实用的学习路线。
          </p>
          <button
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            type="button"
            onClick={() => onStartNewGoal()}
          >
            开始新目标
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {capabilities.map((capability) => {
          const Icon = capability.icon

          return (
            <article
              key={capability.title}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-950">
                {capability.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {capability.description}
              </p>
            </article>
          )
        })}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-950">示例目标</h2>
          <span className="text-xs text-slate-500">
            点击后会带入新建目标表单
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {exampleGoals.map((goal) => (
            <button
              key={goal}
              className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
              type="button"
              onClick={() => onStartNewGoal(goal)}
            >
              {goal}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
