import type { ChatMessage } from '../ai/types'
import type { Goal } from '../types'

const goalTypeLabels: Record<Goal['goalType'], string> = {
  'learning-domain': '学习领域',
  project: '完成项目',
  question: '理解问题',
  concept: '搞懂概念',
}

export function generateKnowledgeTreePrompt(goal: Goal): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是 GapmapAI 的知识路径架构助手。你只输出严格 JSON，不输出 markdown，不输出解释，不输出代码块。',
    },
    {
      role: 'user',
      content: [
        '请根据用户目标生成一个目标导向的知识树。',
        '',
        '重要原则：',
        '- 不要生成完整课程，也不要堆砌百科式大纲。',
        '- 只生成达成当前目标所需的知识结构。',
        '- 标记哪些模块是 required、useful、optional。',
        '- 标记难度 beginner、intermediate、advanced。',
        '- 尽量减少无效学习，明确把暂时不必深入的内容降为 optional。',
        '- 考虑用户已有背景，避免重复讲用户可能已经会的基础。',
        '- 如果用户填写了类比领域，后续概念解释要适合用该领域类比。',
        '',
        '用户目标信息：',
        `目标：${goal.title}`,
        `目标类型：${goalTypeLabels[goal.goalType]}`,
        `用户已有背景：${goal.knownBackground || '未填写'}`,
        `希望使用的类比领域：${goal.analogyDomain || '未填写'}`,
        '',
        '必须返回严格 JSON，结构必须符合以下 TypeScript 类型。字段名必须一致，不要添加额外顶层字段：',
        `{
  "id": "string",
  "goalId": "string",
  "title": "string",
  "summary": "string",
  "modules": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "importance": "required | useful | optional",
      "difficulty": "beginner | intermediate | advanced",
      "concepts": [
        {
          "id": "string",
          "name": "string",
          "shortExplanation": "string",
          "whyLearn": "string",
          "requiredDepth": "string",
          "misconceptions": ["string"],
          "relatedConcepts": ["string"]
        }
      ],
      "children": []
    }
  ],
  "createdAt": "string"
}`,
        '',
        '生成要求：',
        '- modules 数量建议 4 到 7 个。',
        '- 每个模块 concepts 建议 3 到 6 个。',
        '- children 可以为空数组；如果确实需要拆分，可放 1 到 3 个子模块。',
        '- id 可以使用短英文 kebab-case。',
        `- goalId 必须填写为 "${goal.id}"。`,
        '- createdAt 使用 ISO 日期字符串。',
      ].join('\n'),
    },
  ]
}
