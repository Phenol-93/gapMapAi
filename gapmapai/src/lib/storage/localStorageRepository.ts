import type { AISettings } from '../ai/types'
import type {
  BlindspotReport,
  ConceptCard,
  Goal,
  InterviewSession,
  KnowledgeTree,
  LearningPath,
} from '../types'
import type { AppRepository, StorageSnapshot } from './types'

export const storageKeys = {
  aiSettings: 'gapmap-ai:ai-settings',
  goals: 'gapmap-ai:goals',
  knowledgeTrees: 'gapmap-ai:knowledge-trees',
  interviewSessions: 'gapmap-ai:interview-sessions',
  blindspotReports: 'gapmap-ai:blindspot-reports',
  learningPaths: 'gapmap-ai:learning-paths',
  conceptCards: 'gapmap-ai:concept-cards',
  sqliteMigration: 'gapmap-ai:sqlite-migrated-v1',
}

export function saveAISettings(settings: AISettings): void {
  writeJson(storageKeys.aiSettings, stripApiKey(settings))
}

export function getAISettings(): AISettings | null {
  const settings = readJson<AISettings | null>(storageKeys.aiSettings, null)
  return settings ? stripApiKey(settings) : null
}

export function getLegacyAISettingsWithApiKey(): AISettings | null {
  return readJson<AISettings | null>(storageKeys.aiSettings, null)
}

export function clearStoredAISettingsApiKey(): void {
  const settings = readJson<AISettings | null>(storageKeys.aiSettings, null)

  if (settings) {
    saveAISettings(settings)
  }
}

export function saveGoal(goal: Goal): void {
  const goals = upsertById(getGoals(), goal)
  writeJson(storageKeys.goals, goals)
}

export function getGoals(): Goal[] {
  return readJson<Goal[]>(storageKeys.goals, [])
}

export function getGoalById(goalId: string): Goal | null {
  return getGoals().find((goal) => goal.id === goalId) ?? null
}

export function deleteGoal(goalId: string): void {
  writeJson(
    storageKeys.goals,
    getGoals().filter((goal) => goal.id !== goalId),
  )
  removeByGoalId<KnowledgeTree>(storageKeys.knowledgeTrees, goalId)
  removeByGoalId<InterviewSession>(storageKeys.interviewSessions, goalId)
  removeByGoalId<BlindspotReport>(storageKeys.blindspotReports, goalId)
  removeByGoalId<LearningPath>(storageKeys.learningPaths, goalId)
  removeByGoalId<ConceptCard>(storageKeys.conceptCards, goalId)
}

export function saveKnowledgeTree(knowledgeTree: KnowledgeTree): void {
  saveOnePerGoal(storageKeys.knowledgeTrees, knowledgeTree)
}

export function getKnowledgeTreeByGoalId(goalId: string): KnowledgeTree | null {
  return findByGoalId<KnowledgeTree>(storageKeys.knowledgeTrees, goalId)
}

export function saveInterviewSession(session: InterviewSession): void {
  saveOnePerGoal(storageKeys.interviewSessions, session)
}

export function getInterviewSessionByGoalId(
  goalId: string,
): InterviewSession | null {
  return findByGoalId<InterviewSession>(storageKeys.interviewSessions, goalId)
}

export function saveBlindspotReport(report: BlindspotReport): void {
  saveOnePerGoal(storageKeys.blindspotReports, report)
}

export function getBlindspotReportByGoalId(
  goalId: string,
): BlindspotReport | null {
  return findByGoalId<BlindspotReport>(storageKeys.blindspotReports, goalId)
}

export function saveLearningPath(learningPath: LearningPath): void {
  saveOnePerGoal(storageKeys.learningPaths, learningPath)
}

export function getLearningPathByGoalId(goalId: string): LearningPath | null {
  return findByGoalId<LearningPath>(storageKeys.learningPaths, goalId)
}

export function saveConceptCard(conceptCard: ConceptCard): void {
  const conceptCards = upsertById(
    readJson<ConceptCard[]>(storageKeys.conceptCards, []),
    conceptCard,
  )
  writeJson(storageKeys.conceptCards, conceptCards)
}

export function getConceptCardsByGoalId(goalId: string): ConceptCard[] {
  return readJson<ConceptCard[]>(storageKeys.conceptCards, []).filter(
    (conceptCard) => conceptCard.goalId === goalId,
  )
}

export function getLocalStorageSnapshot(): StorageSnapshot {
  return {
    goals: getGoals(),
    knowledgeTrees: readJson<KnowledgeTree[]>(storageKeys.knowledgeTrees, []),
    interviewSessions: readJson<InterviewSession[]>(
      storageKeys.interviewSessions,
      [],
    ),
    blindspotReports: readJson<BlindspotReport[]>(
      storageKeys.blindspotReports,
      [],
    ),
    learningPaths: readJson<LearningPath[]>(storageKeys.learningPaths, []),
    conceptCards: readJson<ConceptCard[]>(storageKeys.conceptCards, []),
  }
}

export function hasLocalStorageData(): boolean {
  const snapshot = getLocalStorageSnapshot()
  return Object.values(snapshot).some((items) => items.length > 0)
}

export function isSqliteMigrationMarked(): boolean {
  return localStorage.getItem(storageKeys.sqliteMigration) === 'true'
}

export function markSqliteMigrationDone(): void {
  localStorage.setItem(storageKeys.sqliteMigration, 'true')
}

export const localStorageRepository: AppRepository = {
  async saveAISettings(settings) {
    saveAISettings(settings)
  },
  async getAISettings() {
    return getAISettings()
  },
  async saveGoal(goal) {
    saveGoal(goal)
  },
  async getGoals() {
    return getGoals()
  },
  async getGoalById(goalId) {
    return getGoalById(goalId)
  },
  async deleteGoal(goalId) {
    deleteGoal(goalId)
  },
  async saveKnowledgeTree(knowledgeTree) {
    saveKnowledgeTree(knowledgeTree)
  },
  async getKnowledgeTreeByGoalId(goalId) {
    return getKnowledgeTreeByGoalId(goalId)
  },
  async saveInterviewSession(session) {
    saveInterviewSession(session)
  },
  async getInterviewSessionByGoalId(goalId) {
    return getInterviewSessionByGoalId(goalId)
  },
  async saveBlindspotReport(report) {
    saveBlindspotReport(report)
  },
  async getBlindspotReportByGoalId(goalId) {
    return getBlindspotReportByGoalId(goalId)
  },
  async saveLearningPath(learningPath) {
    saveLearningPath(learningPath)
  },
  async getLearningPathByGoalId(goalId) {
    return getLearningPathByGoalId(goalId)
  },
  async saveConceptCard(conceptCard) {
    saveConceptCard(conceptCard)
  },
  async getConceptCardsByGoalId(goalId) {
    return getConceptCardsByGoalId(goalId)
  },
}

function saveOnePerGoal<TItem extends { id: string; goalId: string }>(
  key: string,
  item: TItem,
): void {
  const items = readJson<TItem[]>(key, [])
  const nextItems = [
    ...items.filter((currentItem) => currentItem.goalId !== item.goalId),
    item,
  ]
  writeJson(key, nextItems)
}

function findByGoalId<TItem extends { goalId: string }>(
  key: string,
  goalId: string,
): TItem | null {
  return (
    readJson<TItem[]>(key, []).find((item) => item.goalId === goalId) ?? null
  )
}

function removeByGoalId<TItem extends { goalId: string }>(
  key: string,
  goalId: string,
): void {
  writeJson(
    key,
    readJson<TItem[]>(key, []).filter((item) => item.goalId !== goalId),
  )
}

function upsertById<TItem extends { id: string }>(
  items: TItem[],
  item: TItem,
): TItem[] {
  const exists = items.some((currentItem) => currentItem.id === item.id)

  if (!exists) {
    return [...items, item]
  }

  return items.map((currentItem) =>
    currentItem.id === item.id ? item : currentItem,
  )
}

function readJson<TValue>(key: string, fallback: TValue): TValue {
  try {
    const rawValue = localStorage.getItem(key)

    if (!rawValue) {
      return fallback
    }

    return JSON.parse(rawValue) as TValue
  } catch {
    return fallback
  }
}

function writeJson<TValue>(key: string, value: TValue): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function stripApiKey(settings: AISettings): AISettings {
  return {
    ...settings,
    apiKey: '',
  }
}
