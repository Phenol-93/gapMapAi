import {
  getAISettings,
  saveAISettings,
} from './localStorageRepository'
import * as conceptCards from './sqlite/conceptCardRepository'
import * as goals from './sqlite/goalRepository'
import * as interview from './sqlite/interviewRepository'
import * as knowledgeTrees from './sqlite/knowledgeTreeRepository'
import * as learningPaths from './sqlite/learningPathRepository'
import * as reports from './sqlite/reportRepository'
import type { AppRepository } from './types'

export const sqliteRepository: AppRepository = {
  async saveAISettings(settings) {
    saveAISettings(settings)
  },
  async getAISettings() {
    return getAISettings()
  },
  saveGoal: goals.saveGoal,
  getGoals: goals.getGoals,
  getGoalById: goals.getGoalById,
  deleteGoal: goals.deleteGoal,
  saveKnowledgeTree: knowledgeTrees.saveKnowledgeTree,
  getKnowledgeTreeByGoalId: knowledgeTrees.getKnowledgeTreeByGoalId,
  saveInterviewSession: interview.saveInterviewSession,
  getInterviewSessionByGoalId: interview.getInterviewSessionByGoalId,
  saveBlindspotReport: reports.saveBlindspotReport,
  getBlindspotReportByGoalId: reports.getBlindspotReportByGoalId,
  saveLearningPath: learningPaths.saveLearningPath,
  getLearningPathByGoalId: learningPaths.getLearningPathByGoalId,
  saveConceptCard: conceptCards.saveConceptCard,
  getConceptCardsByGoalId: conceptCards.getConceptCardsByGoalId,
}
