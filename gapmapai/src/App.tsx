import { useEffect, useState } from 'react'

import { DashboardPage } from './app/DashboardPage'
import { type AppPage } from './app/pages'
import { AppShell } from './components/layout/AppShell'
import { ConceptCardPage } from './features/concept-card/ConceptCardPage'
import { NewGoalPage } from './features/goal/NewGoalPage'
import { HistoryPage } from './features/history/HistoryPage'
import { InterviewPage } from './features/interview/InterviewPage'
import { KnowledgeTreePage } from './features/knowledge-tree/KnowledgeTreePage'
import { LearningPathPage } from './features/learning-path/LearningPathPage'
import { BlindspotReportPage } from './features/report/BlindspotReportPage'
import { SettingsPage } from './features/settings/SettingsPage'
import {
  getGoals,
  initializeRepository,
} from './lib/storage/repository'
import type { Goal } from './lib/types'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('dashboard')
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null)
  const [draftGoalTitle, setDraftGoalTitle] = useState('')
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [startupError, setStartupError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function boot() {
      try {
        await initializeRepository()
        const latestGoal = await getLatestGoal()

        if (isMounted) {
          setCurrentGoal(latestGoal)
          setIsStorageReady(true)
        }
      } catch (error) {
        if (isMounted) {
          setStartupError(
            error instanceof Error
              ? error.message
              : '本地数据库初始化失败，请重启应用后重试。',
          )
          setIsStorageReady(true)
        }
      }
    }

    void boot()

    return () => {
      isMounted = false
    }
  }, [])

  function handleStartNewGoal(title = '') {
    setDraftGoalTitle(title)
    setActivePage('new-goal')
  }

  function handleKnowledgeTreeGenerated(goal: Goal) {
    setCurrentGoal(goal)
    setDraftGoalTitle('')
    setActivePage('knowledge-tree')
  }

  function handleSelectGoal(goal: Goal) {
    setCurrentGoal(goal)
    setActivePage('knowledge-tree')
  }

  function handleConceptCardGenerated() {
    setActivePage('concept-card')
  }

  if (!isStorageReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-sm text-slate-600">
        正在初始化本地数据库...
      </div>
    )
  }

  if (startupError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="rounded-lg border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          {startupError}
        </div>
      </div>
    )
  }

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' ? (
        <DashboardPage onStartNewGoal={handleStartNewGoal} />
      ) : null}

      {activePage === 'new-goal' ? (
        <NewGoalPage
          initialTitle={draftGoalTitle}
          onKnowledgeTreeGenerated={handleKnowledgeTreeGenerated}
        />
      ) : null}

      {activePage === 'knowledge-tree' ? (
        <KnowledgeTreePage
          currentGoal={currentGoal}
          onConceptCardGenerated={handleConceptCardGenerated}
        />
      ) : null}

      {activePage === 'interview' ? (
        <InterviewPage
          currentGoal={currentGoal}
          onReportGenerated={() => setActivePage('report')}
        />
      ) : null}

      {activePage === 'report' ? (
        <BlindspotReportPage
          currentGoal={currentGoal}
          onConceptCardGenerated={handleConceptCardGenerated}
          onLearningPathGenerated={() => setActivePage('learning-path')}
        />
      ) : null}

      {activePage === 'learning-path' ? (
        <LearningPathPage
          currentGoal={currentGoal}
          onConceptCardGenerated={handleConceptCardGenerated}
        />
      ) : null}

      {activePage === 'concept-card' ? (
        <ConceptCardPage currentGoal={currentGoal} />
      ) : null}

      {activePage === 'history' ? (
        <HistoryPage
          currentGoalId={currentGoal?.id ?? null}
          onDeleteCurrentGoal={() => setCurrentGoal(null)}
          onSelectGoal={handleSelectGoal}
        />
      ) : null}

      {activePage === 'settings' ? <SettingsPage /> : null}
    </AppShell>
  )
}

async function getLatestGoal(): Promise<Goal | null> {
  const goals = await getGoals()
  return (
    [...goals].sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt).getTime() -
        new Date(left.updatedAt || left.createdAt).getTime(),
    )[0] ?? null
  )
}

export default App
