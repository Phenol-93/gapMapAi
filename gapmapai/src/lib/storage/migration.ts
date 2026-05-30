import {
  getLocalStorageSnapshot,
  hasLocalStorageData,
  isSqliteMigrationMarked,
  markSqliteMigrationDone,
} from './localStorageRepository'
import { sqliteRepository } from './sqliteRepository'

export async function migrateLocalStorageToSqlite(): Promise<void> {
  if (isSqliteMigrationMarked()) {
    return
  }

  if (!hasLocalStorageData()) {
    markSqliteMigrationDone()
    return
  }

  const snapshot = getLocalStorageSnapshot()

  for (const goal of snapshot.goals) {
    await sqliteRepository.saveGoal(goal)
  }

  for (const knowledgeTree of snapshot.knowledgeTrees) {
    await sqliteRepository.saveKnowledgeTree(knowledgeTree)
  }

  for (const session of snapshot.interviewSessions) {
    await sqliteRepository.saveInterviewSession(session)
  }

  for (const report of snapshot.blindspotReports) {
    await sqliteRepository.saveBlindspotReport(report)
  }

  for (const learningPath of snapshot.learningPaths) {
    await sqliteRepository.saveLearningPath(learningPath)
  }

  for (const conceptCard of snapshot.conceptCards) {
    await sqliteRepository.saveConceptCard(conceptCard)
  }

  markSqliteMigrationDone()
}
