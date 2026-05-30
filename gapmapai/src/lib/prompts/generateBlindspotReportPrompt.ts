import type { ChatMessage } from '../ai/types'
import type { Goal, InterviewSession, KnowledgeTree } from '../types'

export function generateBlindspotReportPrompt({
  goal,
  interviewSession,
  knowledgeTree,
}: {
  goal: Goal
  interviewSession: InterviewSession
  knowledgeTree: KnowledgeTree
}): ChatMessage[] {
  const userAnswers = interviewSession.messages.filter(
    (message) => message.role === 'user',
  )
  const diagnosticUpdates = interviewSession.messages.flatMap((message) =>
    message.diagnosticTags.map((tag) => ({
      messageId: message.id,
      role: message.role,
      tag,
      content: message.content,
    })),
  )

  return [
    {
      role: 'system',
      content:
        '你是 GapmapAI 的知识盲区诊断专家。你只输出严格 JSON，不输出 markdown，不输出解释，不输出代码块。',
    },
    {
      role: 'user',
      content: [
        '请基于 Goal、KnowledgeTree、InterviewSession、所有用户回答和 AI 每轮诊断更新，生成一个具体的盲区报告。',
        '',
        '报告要求：',
        '- 必须具体，不要空泛。',
        '- 不要写“你需要加强基础知识”这种泛泛建议。',
        '- 要写成类似：“你知道 chunk 是把文档切成小段，但还不清楚 chunk size 会影响召回质量和上下文噪声。”',
        '- mastered 表示用户理解较好的知识点。',
        '- fuzzy 表示听过但讲不清，或只理解表面的知识点。',
        '- missing 表示为了完成目标必须补的知识点。',
        '- misconceptions 表示用户可能理解错的地方。',
        '- canSkipForNow 表示为了当前目标暂时不需要学的内容。',
        '- nextFocus 最多 5 个，必须是最应该优先补的知识点。',
        '- 如果信息不足，也要根据用户回答和知识树给出谨慎、具体的判断，不要留空。',
        '',
        '必须返回严格 JSON，字段名必须完全一致，不要添加额外顶层字段：',
        `{
  "id": "string",
  "goalId": "string",
  "mastered": ["string"],
  "fuzzy": ["string"],
  "missing": ["string"],
  "misconceptions": ["string"],
  "canSkipForNow": ["string"],
  "nextFocus": ["string"],
  "createdAt": "string"
}`,
        '',
        `goalId 必须是：${goal.id}`,
        'nextFocus 最多 5 项。',
        '',
        'Goal:',
        JSON.stringify(goal, null, 2),
        '',
        'KnowledgeTree:',
        JSON.stringify(knowledgeTree, null, 2),
        '',
        'InterviewSession:',
        JSON.stringify(interviewSession, null, 2),
        '',
        '所有用户回答:',
        JSON.stringify(userAnswers, null, 2),
        '',
        'AI 每轮诊断更新:',
        JSON.stringify(diagnosticUpdates, null, 2),
      ].join('\n'),
    },
  ]
}
