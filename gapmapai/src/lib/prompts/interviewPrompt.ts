import type { ChatMessage } from '../ai/types'
import type { Goal, InterviewSession, KnowledgeTree } from '../types'

export function createInterviewPrompt({
  goal,
  knowledgeTree,
  session,
}: {
  goal: Goal
  knowledgeTree: KnowledgeTree
  session: InterviewSession
}): ChatMessage[] {
  const answeredCount = session.messages.filter(
    (message) => message.role === 'user',
  ).length

  return [
    {
      role: 'system',
      content:
        '你是 GapmapAI 的知识面试官。你温和、具体、善于追问。你只输出严格 JSON，不输出 markdown，不输出解释，不输出代码块。',
    },
    {
      role: 'user',
      content: [
        '请根据用户目标、知识树、已有背景和当前对话历史，进行一轮追问式知识诊断。',
        '',
        '诊断风格：',
        '- 不要羞辱用户。',
        '- 不要像考试，不要一次给一堆选择题。',
        '- 鼓励用户用自己的话回答。',
        '- 每轮只问一个问题。',
        '- 用户答得浅时，追问基础理解。',
        '- 用户答得好时，追问应用场景、边界条件或取舍。',
        '- 重点判断用户是否真的理解，而不是是否会背定义。',
        '- 这一步只做诊断，不要生成最终学习路径。',
        '',
        '必须返回严格 JSON，字段名必须完全一致，不要添加额外顶层字段：',
        `{
  "assistantMessage": "string",
  "nextQuestion": "string",
  "diagnosisUpdate": "string",
  "shouldContinue": true,
  "coveredConcepts": ["string"],
  "possibleBlindspots": ["string"],
  "possibleMisconceptions": ["string"]
}`,
        '',
        '字段要求：',
        '- assistantMessage：对用户上一轮回答的简短反馈；第一轮可以简短说明诊断方式。',
        '- nextQuestion：下一个问题。必须只有一个问题。',
        '- diagnosisUpdate：当前初步判断，要具体。',
        '- shouldContinue：如果已经问满、信息足够或继续追问收益不大，则为 false。',
        '- coveredConcepts：本轮已经覆盖或验证过的概念。',
        '- possibleBlindspots：本轮暴露的可能盲区。',
        '- possibleMisconceptions：本轮暴露的可能误解。',
        '',
        `默认最多问 ${session.maxQuestions} 个问题，当前用户已回答 ${answeredCount} 个问题。`,
        answeredCount >= session.maxQuestions
          ? '已经达到问题上限，请给出简短反馈，将 shouldContinue 设为 false，nextQuestion 可以为空字符串。'
          : '如果还需要继续诊断，请提出下一题。',
        '',
        'Goal:',
        JSON.stringify(goal, null, 2),
        '',
        'KnowledgeTree:',
        JSON.stringify(knowledgeTree, null, 2),
        '',
        'InterviewSession:',
        JSON.stringify(session, null, 2),
      ].join('\n'),
    },
  ]
}
