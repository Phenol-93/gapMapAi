import { nanoid } from 'nanoid'

import { createAIClient } from '../../lib/ai/client'
import { generateConceptCardPrompt } from '../../lib/prompts/generateConceptCardPrompt'
import {
  getAISettings,
  getKnowledgeTreeByGoalId,
  saveConceptCard,
} from '../../lib/storage/repository'
import type { ConceptCard, Goal } from '../../lib/types'
import { extractJsonFromText, safeJsonParse } from '../../lib/utils/json'

export async function generateAndSaveConceptCard({
  conceptName,
  goal,
}: {
  conceptName: string
  goal: Goal
}): Promise<ConceptCard> {
  const aiSettings = await getAISettings()

  if (!aiSettings) {
    throw new Error('请先到“设置”页面填写并保存 AI Provider 信息。')
  }

  const knowledgeTree = await getKnowledgeTreeByGoalId(goal.id)

  if (!knowledgeTree) {
    throw new Error('当前目标还没有知识树。请先生成知识树。')
  }

  const client = createAIClient(aiSettings)
  const content = await client.chat(
    generateConceptCardPrompt({
      conceptName,
      goal,
      knowledgeTree,
    }),
    {
      temperature: 0.2,
      maxTokens: 2500,
      responseFormat: { type: 'json_object' },
      stream: false,
    },
  )
  const parseResult = safeJsonParse<Partial<ConceptCard>>(
    extractJsonFromText(content),
  )

  if (!parseResult.ok) {
    throw new Error('AI 返回格式错误，可以重试。')
  }

  const conceptCard = normalizeConceptCard(parseResult.data, goal, conceptName)
  await saveConceptCard(conceptCard)
  return conceptCard
}

function normalizeConceptCard(
  value: Partial<ConceptCard>,
  goal: Goal,
  conceptName: string,
): ConceptCard {
  if (!value || typeof value !== 'object') {
    throw new Error('AI 返回 JSON 格式异常，缺少概念卡片对象。')
  }

  return {
    id: typeof value.id === 'string' ? value.id : nanoid(),
    goalId: goal.id,
    conceptName:
      typeof value.conceptName === 'string' && value.conceptName.trim()
        ? value.conceptName
        : conceptName,
    oneSentence:
      typeof value.oneSentence === 'string' ? value.oneSentence : '',
    explanation:
      typeof value.explanation === 'string' ? value.explanation : '',
    whyItMatters:
      typeof value.whyItMatters === 'string' ? value.whyItMatters : '',
    learnDepth: typeof value.learnDepth === 'string' ? value.learnDepth : '',
    commonMisunderstandings: normalizeStringList(
      value.commonMisunderstandings,
    ),
    analogy: typeof value.analogy === 'string' ? value.analogy : '',
    relatedConcepts: normalizeStringList(value.relatedConcepts),
    example: typeof value.example === 'string' ? value.example : '',
    notNecessaryYet: normalizeStringList(value.notNecessaryYet),
    createdAt: new Date().toISOString(),
  }
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}
