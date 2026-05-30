import type { Goal } from './core'

export const goalTypeLabels: Record<Goal['goalType'], string> = {
  'learning-domain': '学习领域',
  project: '完成项目',
  question: '理解问题',
  concept: '搞懂概念',
}

export const goalTypeOptions: Array<{
  label: string
  value: Goal['goalType']
}> = [
  { label: '学习领域', value: 'learning-domain' },
  { label: '完成项目', value: 'project' },
  { label: '理解问题', value: 'question' },
  { label: '搞懂概念', value: 'concept' },
]
