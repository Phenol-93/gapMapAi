/** 用户想要达成的学习、项目、问题或概念目标。 */
export type Goal = {
  id: string
  title: string
  description: string
  goalType: 'learning-domain' | 'project' | 'question' | 'concept'
  knownBackground: string
  analogyDomain: string
  createdAt: string
  updatedAt: string
}

/** 围绕目标生成的知识结构总览。 */
export type KnowledgeTree = {
  id: string
  goalId: string
  title: string
  summary: string
  modules: KnowledgeModule[]
  createdAt: string
}

/** 知识树中的模块节点，可递归包含子模块。 */
export type KnowledgeModule = {
  id: string
  title: string
  description: string
  importance: 'required' | 'useful' | 'optional'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  concepts: Concept[]
  children: KnowledgeModule[]
}

/** 一个需要理解的核心概念。 */
export type Concept = {
  id: string
  name: string
  shortExplanation: string
  whyLearn: string
  requiredDepth: string
  misconceptions: string[]
  relatedConcepts: string[]
}

/** AI 追问诊断会话，用来判断用户已知、模糊和缺失的部分。 */
export type InterviewSession = {
  id: string
  goalId: string
  status: 'idle' | 'running' | 'completed'
  messages: InterviewMessage[]
  currentQuestionIndex: number
  maxQuestions: number
  createdAt: string
  updatedAt: string
}

/** 追问诊断中的一条消息。 */
export type InterviewMessage = {
  id: string
  role: 'ai' | 'user'
  content: string
  diagnosticTags: string[]
  createdAt: string
}

/** 根据目标、知识树和追问结果生成的盲区报告。 */
export type BlindspotReport = {
  id: string
  goalId: string
  mastered: string[]
  fuzzy: string[]
  missing: string[]
  misconceptions: string[]
  canSkipForNow: string[]
  nextFocus: string[]
  createdAt: string
}

/** 最小学习路径，强调下一步最应该学什么。 */
export type LearningPath = {
  id: string
  goalId: string
  title: string
  summary: string
  steps: LearningStep[]
  createdAt: string
}

/** 学习路径中的一个可执行步骤。 */
export type LearningStep = {
  id: string
  title: string
  explanation: string
  output: string
  estimatedTime: string
  relatedConcepts: string[]
  whyThisStepNow: string
  skipTheseForNow: string[]
}

/** 单个概念的学习卡片，用于快速建立正确理解。 */
export type ConceptCard = {
  id: string
  goalId: string
  conceptName: string
  oneSentence: string
  explanation: string
  whyItMatters: string
  learnDepth: string
  commonMisunderstandings: string[]
  analogy: string
  relatedConcepts: string[]
  example: string
  notNecessaryYet: string[]
  createdAt: string
}
