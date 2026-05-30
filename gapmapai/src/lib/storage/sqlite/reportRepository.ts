import type { BlindspotReport } from '../../types'
import { decodeJson, encodeJson, getDatabase } from './database'

type BlindspotReportRow = {
  id: string
  goal_id: string
  mastered_json: string
  fuzzy_json: string
  missing_json: string
  misconceptions_json: string
  can_skip_for_now_json: string
  next_focus_json: string
  created_at: string
}

export async function saveBlindspotReport(
  report: BlindspotReport,
): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO blindspot_reports (
      id, goal_id, mastered_json, fuzzy_json, missing_json, misconceptions_json,
      can_skip_for_now_json, next_focus_json, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT(goal_id) DO UPDATE SET
      id = excluded.id,
      mastered_json = excluded.mastered_json,
      fuzzy_json = excluded.fuzzy_json,
      missing_json = excluded.missing_json,
      misconceptions_json = excluded.misconceptions_json,
      can_skip_for_now_json = excluded.can_skip_for_now_json,
      next_focus_json = excluded.next_focus_json,
      created_at = excluded.created_at`,
    [
      report.id,
      report.goalId,
      encodeJson(report.mastered),
      encodeJson(report.fuzzy),
      encodeJson(report.missing),
      encodeJson(report.misconceptions),
      encodeJson(report.canSkipForNow),
      encodeJson(report.nextFocus),
      report.createdAt,
    ],
  )
}

export async function getBlindspotReportByGoalId(
  goalId: string,
): Promise<BlindspotReport | null> {
  const db = await getDatabase()
  const rows = await db.select<BlindspotReportRow[]>(
    'SELECT * FROM blindspot_reports WHERE goal_id = $1 LIMIT 1',
    [goalId],
  )
  return rows[0] ? mapReportRow(rows[0]) : null
}

function mapReportRow(row: BlindspotReportRow): BlindspotReport {
  return {
    id: row.id,
    goalId: row.goal_id,
    mastered: decodeJson<string[]>(row.mastered_json, []),
    fuzzy: decodeJson<string[]>(row.fuzzy_json, []),
    missing: decodeJson<string[]>(row.missing_json, []),
    misconceptions: decodeJson<string[]>(row.misconceptions_json, []),
    canSkipForNow: decodeJson<string[]>(row.can_skip_for_now_json, []),
    nextFocus: decodeJson<string[]>(row.next_focus_json, []),
    createdAt: row.created_at,
  }
}
