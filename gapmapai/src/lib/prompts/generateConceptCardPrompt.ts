import type { ChatMessage } from '../ai/types'
import type { Goal, KnowledgeTree } from '../types'

export function generateConceptCardPrompt({
  conceptName,
  goal,
  knowledgeTree,
}: {
  conceptName: string
  goal: Goal
  knowledgeTree: KnowledgeTree
}): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是 GapmapAI 的概念解释助手。你只输出严格 JSON，不输出 markdown，不输出解释，不输出代码块。',
    },
    {
      role: 'user',
      content: [
        `请为概念“${conceptName}”生成一张目标导向的概念卡片。`,
        '',
        '要求：',
        '- 不要生成百科式解释。',
        '- 要结合用户当前目标解释这个概念为什么有用。',
        '- 要考虑用户已有背景，不要重复讲过浅的内容。',
        '- 如果用户填写 analogyDomain，比如“编程”，就尽量用该领域做类比。',
        '- learnDepth 要说明为了当前目标学到什么程度就够了。',
        '- notNecessaryYet 要明确当前阶段暂时不用深究什么。',
        '- example 要具体，最好贴近当前目标。',
        '',
        '必须返回严格 JSON，字段名必须完全一致，不要添加额外顶层字段：',
        `{
  "id": "string",
  "goalId": "string",
  "conceptName": "string",
  "oneSentence": "string",
  "explanation": "string",
  "whyItMatters": "string",
  "learnDepth": "string",
  "commonMisunderstandings": ["string"],
  "analogy": "string",
  "relatedConcepts": ["string"],
  "example": "string",
  "notNecessaryYet": ["string"],
  "createdAt": "string"
}`,
        '',
        `goalId 必须是：${goal.id}`,
        '',
        'Goal:',
        JSON.stringify(goal, null, 2),
        '',
        '当前知识树上下文:',
        JSON.stringify(knowledgeTree, null, 2),
      ].join('\n'),
    },
  ]
}
