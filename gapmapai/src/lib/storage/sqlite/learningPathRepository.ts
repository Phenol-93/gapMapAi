import type { LearningPath, LearningStep } from '../../types'
import { decodeJson, encodeJson, getDatabase } from './database'

type LearningPathRow = {
  id: string
  goal_id: string
  title: string
  summary: string
  steps_json: string
  created_at: string
}

export async function saveLearningPath(
  learningPath: LearningPath,
): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO learning_paths (
      id, goal_id, title, summary, steps_json, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT(goal_id) DO UPDATE SET
      id = excluded.id,
      title = excluded.title,
      summary = excluded.summary,
      steps_json = excluded.steps_json,
      created_at = excluded.created_at`,
    [
      learningPath.id,
      learningPath.goalId,
      learningPath.title,
      learningPath.summary,
      encodeJson(learningPath.steps),
      learningPath.createdAt,
    ],
  )
}

export async function getLearningPathByGoalId(
  goalId: string,
): Promise<LearningPath | null> {
  const db = await getDatabase()
  const rows = await db.select<LearningPathRow[]>(
    'SELECT * FROM learning_paths WHERE goal_id = $1 LIMIT 1',
    [goalId],
  )
  return rows[0] ? mapLearningPathRow(rows[0]) : null
}

function mapLearningPathRow(row: LearningPathRow): LearningPath {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    summary: row.summary,
    steps: decodeJson<LearningStep[]>(row.steps_json, []),
    createdAt: row.created_at,
  }
}
