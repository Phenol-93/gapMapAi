import type { Goal } from '../../types'
import { getDatabase } from './database'

type GoalRow = {
  id: string
  title: string
  description: string
  goal_type: Goal['goalType']
  known_background: string
  analogy_domain: string
  created_at: string
  updated_at: string
}

export async function saveGoal(goal: Goal): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO goals (
      id, title, description, goal_type, known_background, analogy_domain, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      goal_type = excluded.goal_type,
      known_background = excluded.known_background,
      analogy_domain = excluded.analogy_domain,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at`,
    [
      goal.id,
      goal.title,
      goal.description,
      goal.goalType,
      goal.knownBackground,
      goal.analogyDomain,
      goal.createdAt,
      goal.updatedAt,
    ],
  )
}

export async function getGoals(): Promise<Goal[]> {
  const db = await getDatabase()
  const rows = await db.select<GoalRow[]>(
    'SELECT * FROM goals ORDER BY updated_at DESC, created_at DESC',
  )
  return rows.map(mapGoalRow)
}

export async function getGoalById(goalId: string): Promise<Goal | null> {
  const db = await getDatabase()
  const rows = await db.select<GoalRow[]>(
    'SELECT * FROM goals WHERE id = $1 LIMIT 1',
    [goalId],
  )
  return rows[0] ? mapGoalRow(rows[0]) : null
}

export async function deleteGoal(goalId: string): Promise<void> {
  const db = await getDatabase()
  await db.execute('DELETE FROM goals WHERE id = $1', [goalId])
}

function mapGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    goalType: row.goal_type,
    knownBackground: row.known_background,
    analogyDomain: row.analogy_domain,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
