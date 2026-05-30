import type { ReactNode } from 'react'

import { navigationItems, type AppPage } from '../../app/pages'

type AppShellProps = {
  activePage: AppPage
  children: ReactNode
  onNavigate: (page: AppPage) => void
}

export function AppShell({ activePage, children, onNavigate }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5">
          <div className="text-lg font-semibold tracking-tight">GapmapAI</div>
          <div className="mt-1 text-xs text-slate-500">
            本地 AI 知识路径导航器
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === activePage

            return (
              <button
                key={item.id}
                className={
                  isActive
                    ? 'flex h-10 w-full items-center gap-3 rounded-md bg-slate-950 px-3 text-left text-sm font-medium text-white'
                    : 'flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950'
                }
                type="button"
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 px-5 py-4 text-xs leading-5 text-slate-500">
          <div>本地运行，使用你自己的 AI API。</div>
          <div className="mt-1 font-medium text-slate-700">作者：Phenol93</div>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 pl-64">
        <div className="mx-auto w-full max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
