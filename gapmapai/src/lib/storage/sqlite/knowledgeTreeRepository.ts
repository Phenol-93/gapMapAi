import type { KnowledgeModule, KnowledgeTree } from '../../types'
import { decodeJson, encodeJson, getDatabase } from './database'

type KnowledgeTreeRow = {
  id: string
  goal_id: string
  title: string
  summary: string
  modules_json: string
  created_at: string
}

export async function saveKnowledgeTree(
  knowledgeTree: KnowledgeTree,
): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO knowledge_trees (
      id, goal_id, title, summary, modules_json, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT(goal_id) DO UPDATE SET
      id = excluded.id,
      title = excluded.title,
      summary = excluded.summary,
      modules_json = excluded.modules_json,
      created_at = excluded.created_at`,
    [
      knowledgeTree.id,
      knowledgeTree.goalId,
      knowledgeTree.title,
      knowledgeTree.summary,
      encodeJson(knowledgeTree.modules),
      knowledgeTree.createdAt,
    ],
  )
}

export async function getKnowledgeTreeByGoalId(
  goalId: string,
): Promise<KnowledgeTree | null> {
  const db = await getDatabase()
  const rows = await db.select<KnowledgeTreeRow[]>(
    'SELECT * FROM knowledge_trees WHERE goal_id = $1 LIMIT 1',
    [goalId],
  )
  return rows[0] ? mapKnowledgeTreeRow(rows[0]) : null
}

function mapKnowledgeTreeRow(row: KnowledgeTreeRow): KnowledgeTree {
  return {
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    summary: row.summary,
    modules: decodeJson<KnowledgeModule[]>(row.modules_json, []),
    createdAt: row.created_at,
  }
}
