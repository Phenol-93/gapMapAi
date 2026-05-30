import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  FileText,
  GitBranch,
  History,
  Home,
  Map,
  MessageSquare,
  PlusCircle,
  Settings,
} from 'lucide-react'

export type AppPage =
  | 'dashboard'
  | 'new-goal'
  | 'knowledge-tree'
  | 'interview'
  | 'report'
  | 'learning-path'
  | 'concept-card'
  | 'history'
  | 'settings'

export type NavigationItem = {
  id: AppPage
  label: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: '首页', icon: Home },
  { id: 'new-goal', label: '新建目标', icon: PlusCircle },
  { id: 'knowledge-tree', label: '知识树', icon: GitBranch },
  { id: 'interview', label: 'AI 诊断', icon: MessageSquare },
  { id: 'report', label: '盲区报告', icon: FileText },
  { id: 'learning-path', label: '学习路径', icon: Map },
  { id: 'concept-card', label: '概念卡片', icon: BookOpen },
  { id: 'history', label: '历史记录', icon: History },
  { id: 'settings', label: '设置', icon: Settings },
]
