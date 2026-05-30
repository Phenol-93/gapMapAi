import type { ChatMessage } from '../ai/types'
import type { BlindspotReport, Goal, KnowledgeTree } from '../types'

export function generateLearningPathPrompt({
  blindspotReport,
  goal,
  knowledgeTree,
}: {
  blindspotReport: BlindspotReport
  goal: Goal
  knowledgeTree: KnowledgeTree
}): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是 GapmapAI 的最小学习路径规划师。你只输出严格 JSON，不输出 markdown，不输出解释，不输出代码块。',
    },
    {
      role: 'user',
      content: [
        '请根据 Goal、KnowledgeTree、BlindspotReport 和用户已有背景，生成为了达成当前目标所需的最短知识路径。',
        '',
        '规划原则：',
        '- 不要生成完整课程。',
        '- 不要推荐大而全课程。',
        '- 少学无关内容，主动跳过当前目标暂时不需要的知识。',
        '- 优先补严重盲区和 nextFocus 中的内容。',
        '- 每一步都必须能服务用户目标。',
        '- 每一步最好有可验证产出，例如一段说明、一个小实验、一个可运行 demo、一个决策清单。',
        '- 结合用户已有背景，不要重复安排已经掌握的内容。',
        '- 每一步的 explanation 要说明学到什么程度即可，不要无限深入。',
        '',
        '必须返回严格 JSON，字段名必须完全一致，不要添加额外顶层字段：',
        `{
  "id": "string",
  "goalId": "string",
  "title": "string",
  "summary": "string",
  "steps": [
    {
      "id": "string",
      "title": "string",
      "explanation": "string",
      "output": "string",
      "estimatedTime": "string",
      "relatedConcepts": ["string"],
      "whyThisStepNow": "string",
      "skipTheseForNow": ["string"]
    }
  ],
  "createdAt": "string"
}`,
        '',
        `goalId 必须是：${goal.id}`,
        'steps 建议 4 到 7 步。每一步必须具体、可执行、能验证。',
        '',
        'Goal:',
        JSON.stringify(goal, null, 2),
        '',
        'KnowledgeTree:',
        JSON.stringify(knowledgeTree, null, 2),
        '',
        'BlindspotReport:',
        JSON.stringify(blindspotReport, null, 2),
      ].join('\n'),
    },
  ]
}
