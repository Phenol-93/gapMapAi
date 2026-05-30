import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'

import {
  getBlindspotReportByGoalId,
  getConceptCardsByGoalId,
  getGoalById,
  getInterviewSessionByGoalId,
  getKnowledgeTreeByGoalId,
  getLearningPathByGoalId,
} from '../storage/repository'
import type {
  BlindspotReport,
  ConceptCard,
  Goal,
  InterviewSession,
  KnowledgeModule,
  KnowledgeTree,
  LearningPath,
} from '../types'

export type MarkdownExportResult = {
  content: string
  fileName: string
}

export type MarkdownSaveResult = {
  canceled: boolean
  fileName: string
  message: string
  path?: string
}

const goalTypeLabels: Record<Goal['goalType'], string> = {
  'learning-domain': '学习领域',
  project: '完成项目',
  question: '理解问题',
  concept: '搞懂概念',
}

export async function generateGoalMarkdown(
  goalId: string,
): Promise<MarkdownExportResult> {
  const goal = await getGoalById(goalId)

  if (!goal) {
    throw new Error('没有找到要导出的目标。')
  }

  const [
    knowledgeTree,
    interviewSession,
    blindspotReport,
    learningPath,
    conceptCards,
  ] = await Promise.all([
    getKnowledgeTreeByGoalId(goalId),
    getInterviewSessionByGoalId(goalId),
    getBlindspotReportByGoalId(goalId),
    getLearningPathByGoalId(goalId),
    getConceptCardsByGoalId(goalId),
  ])

  const content = [
    `# GapmapAI：${goal.title}`,
    '',
    buildGoalSection(goal),
    buildKnowledgeTreeSection(knowledgeTree),
    buildInterviewSection(interviewSession),
    buildBlindspotReportSection(blindspotReport),
    buildLearningPathSection(learningPath),
    buildConceptCardsSection(conceptCards),
  ].join('\n')

  return {
    content,
    fileName: `GapmapAI-${sanitizeFileName(goal.title)}-${formatDateForFileName(new Date())}.md`,
  }
}

export async function downloadGoalMarkdown(
  goalId: string,
): Promise<MarkdownSaveResult> {
  const { content, fileName } = await generateGoalMarkdown(goalId)

  const path = await save({
    title: '导出 GapmapAI Markdown',
    defaultPath: fileName,
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  })

  if (!path) {
    return {
      canceled: true,
      fileName,
      message: '已取消导出。',
    }
  }

  await invoke('save_markdown_file', { path, content })

  return {
    canceled: false,
    fileName,
    path,
    message: `已保存到：${path}`,
  }
}

function buildGoalSection(goal: Goal): string {
  return [
    '## 1. 目标信息',
    '',
    `- 标题：${goal.title}`,
    `- 类型：${goalTypeLabels[goal.goalType]}`,
    `- 已有背景：${goal.knownBackground || '未填写'}`,
    `- 类比领域：${goal.analogyDomain || '未填写'}`,
    `- 创建时间：${formatDateTime(goal.createdAt)}`,
    `- 更新时间：${formatDateTime(goal.updatedAt)}`,
    '',
  ].join('\n')
}

function buildKnowledgeTreeSection(knowledgeTree: KnowledgeTree | null): string {
  if (!knowledgeTree) {
    return ['## 2. 知识树', '', '暂无知识树。', ''].join('\n')
  }

  return [
    '## 2. 知识树',
    '',
    `### ${knowledgeTree.title}`,
    '',
    knowledgeTree.summary,
    '',
    ...knowledgeTree.modules.flatMap((module, index) =>
      renderKnowledgeModule(module, `${index + 1}`, 0),
    ),
  ].join('\n')
}

function renderKnowledgeModule(
  module: KnowledgeModule,
  order: string,
  depth: number,
): string[] {
  const headingLevel = '#'.repeat(Math.min(3 + depth, 6))
  const lines = [
    `${headingLevel} ${order}. ${module.title}`,
    '',
    `- 重要性：${formatImportance(module.importance)}`,
    `- 难度：${formatDifficulty(module.difficulty)}`,
    `- 说明：${module.description}`,
    '',
    '关键概念：',
    ...module.concepts.map(
      (concept) =>
        `- **${concept.name}**：${concept.shortExplanation}${
          concept.whyLearn ? `。${concept.whyLearn}` : ''
        }`,
    ),
    '',
  ]

  return [
    ...lines,
    ...module.children.flatMap((child, index) =>
      renderKnowledgeModule(child, `${order}.${index + 1}`, depth + 1),
    ),
  ]
}

function buildInterviewSection(
  interviewSession: InterviewSession | null,
): string {
  if (!interviewSession) {
    return ['## 3. AI 诊断摘要', '', '暂无 AI 诊断记录。', ''].join('\n')
  }

  const covered = collectTagValues(interviewSession, 'covered:')
  const blindspots = collectTagValues(interviewSession, 'blindspot:')
  const misconceptions = collectTagValues(interviewSession, 'misconception:')

  return [
    '## 3. AI 诊断摘要',
    '',
    `- 状态：${formatInterviewStatus(interviewSession.status)}`,
    `- 已回答问题数：${
      interviewSession.messages.filter((message) => message.role === 'user')
        .length
    } / ${interviewSession.maxQuestions}`,
    '',
    '### 已覆盖概念',
    '',
    renderList(covered),
    '',
    '### 可能盲区',
    '',
    renderList(blindspots),
    '',
    '### 可能误解',
    '',
    renderList(misconceptions),
    '',
    '### 对话记录',
    '',
    ...interviewSession.messages.map(
      (message) =>
        `- **${message.role === 'ai' ? 'AI' : '用户'}**：${message.content.replace(/\n+/g, ' ')}`,
    ),
    '',
  ].join('\n')
}

function buildBlindspotReportSection(
  report: BlindspotReport | null,
): string {
  if (!report) {
    return ['## 4. 盲区报告', '', '暂无盲区报告。', ''].join('\n')
  }

  return [
    '## 4. 盲区报告',
    '',
    '### 已掌握',
    '',
    renderList(report.mastered),
    '',
    '### 模糊理解',
    '',
    renderList(report.fuzzy),
    '',
    '### 严重缺口',
    '',
    renderList(report.missing),
    '',
    '### 错误理解',
    '',
    renderList(report.misconceptions),
    '',
    '### 暂时不用学',
    '',
    renderList(report.canSkipForNow),
    '',
    '### 下一步重点',
    '',
    renderList(report.nextFocus),
    '',
  ].join('\n')
}

function buildLearningPathSection(learningPath: LearningPath | null): string {
  if (!learningPath) {
    return ['## 5. 最小学习路径', '', '暂无学习路径。', ''].join('\n')
  }

  return [
    '## 5. 最小学习路径',
    '',
    `### ${learningPath.title}`,
    '',
    learningPath.summary,
    '',
    ...learningPath.steps.flatMap((step, index) => [
      `### Step ${index + 1}. ${step.title}`,
      '',
      `- 学到什么程度：${step.explanation}`,
      `- 可验证产出：${step.output}`,
      `- 预计时间：${step.estimatedTime}`,
      `- 为什么现在学：${step.whyThisStepNow}`,
      '',
      '相关概念：',
      renderList(step.relatedConcepts),
      '',
      '当前阶段先不要学：',
      renderList(step.skipTheseForNow),
      '',
    ]),
  ].join('\n')
}

function buildConceptCardsSection(conceptCards: ConceptCard[]): string {
  if (conceptCards.length === 0) {
    return ['## 6. 概念卡片', '', '暂无概念卡片。', ''].join('\n')
  }

  return [
    '## 6. 概念卡片',
    '',
    ...conceptCards.flatMap((card) => [
      `### ${card.conceptName}`,
      '',
      `> ${card.oneSentence}`,
      '',
      `- 详细解释：${card.explanation}`,
      `- 为什么要学：${card.whyItMatters}`,
      `- 需要学到什么程度：${card.learnDepth}`,
      `- 类比：${card.analogy}`,
      `- 例子：${card.example}`,
      '',
      '常见误解：',
      renderList(card.commonMisunderstandings),
      '',
      '相关概念：',
      renderList(card.relatedConcepts),
      '',
      '暂时不用深究：',
      renderList(card.notNecessaryYet),
      '',
    ]),
  ].join('\n')
}

function collectTagValues(
  interviewSession: InterviewSession,
  prefix: string,
): string[] {
  return Array.from(
    new Set(
      interviewSession.messages.flatMap((message) =>
        message.diagnosticTags
          .filter((tag) => tag.startsWith(prefix))
          .map((tag) => tag.slice(prefix.length).trim())
          .filter(Boolean),
      ),
    ),
  )
}

function renderList(values: string[]): string {
  if (values.length === 0) {
    return '- 暂无'
  }

  return values.map((value) => `- ${value}`).join('\n')
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)

  return sanitized || '未命名目标'
}

function formatDateForFileName(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '未知'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatImportance(importance: KnowledgeModule['importance']): string {
  const labels: Record<KnowledgeModule['importance'], string> = {
    required: '必须学',
    useful: '有帮助',
    optional: '可选',
  }

  return labels[importance]
}

function formatDifficulty(difficulty: KnowledgeModule['difficulty']): string {
  const labels: Record<KnowledgeModule['difficulty'], string> = {
    beginner: '入门',
    intermediate: '中级',
    advanced: '进阶',
  }

  return labels[difficulty]
}

function formatInterviewStatus(status: InterviewSession['status']): string {
  const labels: Record<InterviewSession['status'], string> = {
    idle: '未开始',
    running: '进行中',
    completed: '已完成',
  }

  return labels[status]
}
