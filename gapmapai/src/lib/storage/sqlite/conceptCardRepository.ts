import type { ConceptCard } from '../../types'
import { decodeJson, encodeJson, getDatabase } from './database'

type ConceptCardRow = {
  id: string
  goal_id: string
  concept_name: string
  one_sentence: string
  explanation: string
  why_it_matters: string
  learn_depth: string
  common_misunderstandings_json: string
  analogy: string
  related_concepts_json: string
  example: string
  not_necessary_yet_json: string
  created_at: string
}

export async function saveConceptCard(
  conceptCard: ConceptCard,
): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO concept_cards (
      id, goal_id, concept_name, one_sentence, explanation, why_it_matters,
      learn_depth, common_misunderstandings_json, analogy, related_concepts_json,
      example, not_necessary_yet_json, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT(id) DO UPDATE SET
      goal_id = excluded.goal_id,
      concept_name = excluded.concept_name,
      one_sentence = excluded.one_sentence,
      explanation = excluded.explanation,
      why_it_matters = excluded.why_it_matters,
      learn_depth = excluded.learn_depth,
      common_misunderstandings_json = excluded.common_misunderstandings_json,
      analogy = excluded.analogy,
      related_concepts_json = excluded.related_concepts_json,
      example = excluded.example,
      not_necessary_yet_json = excluded.not_necessary_yet_json,
      created_at = excluded.created_at`,
    [
      conceptCard.id,
      conceptCard.goalId,
      conceptCard.conceptName,
      conceptCard.oneSentence,
      conceptCard.explanation,
      conceptCard.whyItMatters,
      conceptCard.learnDepth,
      encodeJson(conceptCard.commonMisunderstandings),
      conceptCard.analogy,
      encodeJson(conceptCard.relatedConcepts),
      conceptCard.example,
      encodeJson(conceptCard.notNecessaryYet),
      conceptCard.createdAt,
    ],
  )
}

export async function getConceptCardsByGoalId(
  goalId: string,
): Promise<ConceptCard[]> {
  const db = await getDatabase()
  const rows = await db.select<ConceptCardRow[]>(
    'SELECT * FROM concept_cards WHERE goal_id = $1 ORDER BY created_at DESC',
    [goalId],
  )
  return rows.map(mapConceptCardRow)
}

function mapConceptCardRow(row: ConceptCardRow): ConceptCard {
  return {
    id: row.id,
    goalId: row.goal_id,
    conceptName: row.concept_name,
    oneSentence: row.one_sentence,
    explanation: row.explanation,
    whyItMatters: row.why_it_matters,
    learnDepth: row.learn_depth,
    commonMisunderstandings: decodeJson<string[]>(
      row.common_misunderstandings_json,
      [],
    ),
    analogy: row.analogy,
    relatedConcepts: decodeJson<string[]>(row.related_concepts_json, []),
    example: row.example,
    notNecessaryYet: decodeJson<string[]>(row.not_necessary_yet_json, []),
    createdAt: row.created_at,
  }
}
