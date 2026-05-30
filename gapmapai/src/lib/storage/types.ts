import type { AISettings } from '../ai/types'
import type {
  BlindspotReport,
  ConceptCard,
  Goal,
  InterviewSession,
  KnowledgeTree,
  LearningPath,
} from '../types'

export type StorageSnapshot = {
  goals: Goal[]
  knowledgeTrees: KnowledgeTree[]
  interviewSessions: InterviewSession[]
  blindspotReports: BlindspotReport[]
  learningPaths: LearningPath[]
  conceptCards: ConceptCard[]
}

export type AppRepository = {
  saveAISettings(settings: AISettings): Promise<void>
  getAISettings(): Promise<AISettings | null>
  saveGoal(goal: Goal): Promise<void>
  getGoals(): Promise<Goal[]>
  getGoalById(goalId: string): Promise<Goal | null>
  deleteGoal(goalId: string): Promise<void>
  saveKnowledgeTree(knowledgeTree: KnowledgeTree): Promise<void>
  getKnowledgeTreeByGoalId(goalId: string): Promise<KnowledgeTree | null>
  saveInterviewSession(session: InterviewSession): Promise<void>
  getInterviewSessionByGoalId(goalId: string): Promise<InterviewSession | null>
  saveBlindspotReport(report: BlindspotReport): Promise<void>
  getBlindspotReportByGoalId(goalId: string): Promise<BlindspotReport | null>
  saveLearningPath(learningPath: LearningPath): Promise<void>
  getLearningPathByGoalId(goalId: string): Promise<LearningPath | null>
  saveConceptCard(conceptCard: ConceptCard): Promise<void>
  getConceptCardsByGoalId(goalId: string): Promise<ConceptCard[]>
}
