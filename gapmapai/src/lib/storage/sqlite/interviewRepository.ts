import type { InterviewMessage, InterviewSession } from '../../types'
import { decodeJson, encodeJson, getDatabase } from './database'

type InterviewSessionRow = {
  id: string
  goal_id: string
  status: InterviewSession['status']
  current_question_index: number
  max_questions: number
  created_at: string
  updated_at: string
}

type InterviewMessageRow = {
  id: string
  role: InterviewMessage['role']
  content: string
  diagnostic_tags_json: string
  created_at: string
}

export async function saveInterviewSession(
  session: InterviewSession,
): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO interview_sessions (
      id, goal_id, status, current_question_index, max_questions, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT(goal_id) DO UPDATE SET
      id = excluded.id,
      status = excluded.status,
      current_question_index = excluded.current_question_index,
      max_questions = excluded.max_questions,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at`,
    [
      session.id,
      session.goalId,
      session.status,
      session.currentQuestionIndex,
      session.maxQuestions,
      session.createdAt,
      session.updatedAt,
    ],
  )

  await db.execute('DELETE FROM interview_messages WHERE session_id = $1', [
    session.id,
  ])

  for (const [index, message] of session.messages.entries()) {
    await db.execute(
      `INSERT INTO interview_messages (
        id, session_id, goal_id, role, content, diagnostic_tags_json, created_at, message_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        message.id,
        session.id,
        session.goalId,
        message.role,
        message.content,
        encodeJson(message.diagnosticTags),
        message.createdAt,
        index,
      ],
    )
  }
}

export async function getInterviewSessionByGoalId(
  goalId: string,
): Promise<InterviewSession | null> {
  const db = await getDatabase()
  const sessions = await db.select<InterviewSessionRow[]>(
    'SELECT * FROM interview_sessions WHERE goal_id = $1 LIMIT 1',
    [goalId],
  )
  const session = sessions[0]

  if (!session) {
    return null
  }

  const messages = await db.select<InterviewMessageRow[]>(
    `SELECT id, role, content, diagnostic_tags_json, created_at
     FROM interview_messages
     WHERE session_id = $1
     ORDER BY message_order ASC, created_at ASC`,
    [session.id],
  )

  return {
    id: session.id,
    goalId: session.goal_id,
    status: session.status,
    currentQuestionIndex: Number(session.current_question_index),
    maxQuestions: Number(session.max_questions),
    messages: messages.map(mapMessageRow),
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  }
}

function mapMessageRow(row: InterviewMessageRow): InterviewMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    diagnosticTags: decodeJson<string[]>(row.diagnostic_tags_json, []),
    createdAt: row.created_at,
  }
}
