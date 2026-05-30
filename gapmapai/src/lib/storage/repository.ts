import type { AISettings } from '../ai/types'
import {
  clearStoredAISettingsApiKey,
  getLegacyAISettingsWithApiKey,
} from './localStorageRepository'
import { migrateLocalStorageToSqlite } from './migration'
import { getSecureApiKey, saveSecureApiKey } from './secureApiKeyStore'
import { isTauriRuntime } from './sqlite/database'
import { sqliteRepository } from './sqliteRepository'
import type { AppRepository } from './types'

let repositoryPromise: Promise<AppRepository> | null = null

export async function initializeRepository(): Promise<AppRepository> {
  return getRepository()
}

async function getRepository(): Promise<AppRepository> {
  if (!repositoryPromise) {
    repositoryPromise = createRepository()
  }

  return repositoryPromise
}

async function createRepository(): Promise<AppRepository> {
  if (!isTauriRuntime()) {
    throw new Error('GapmapAI 现在仅支持 Tauri 桌面版，请使用 npm run dev 启动桌面应用。')
  }

  await migrateLegacyApiKeyToSecureStorage()
  await migrateLocalStorageToSqlite()
  return sqliteRepository
}

export async function saveAISettings(
  ...args: Parameters<AppRepository['saveAISettings']>
) {
  const [settings] = args
  await saveSecureApiKey(settings.apiKey)
  return (await getRepository()).saveAISettings(stripApiKey(settings))
}

export async function getAISettings() {
  const settings = await (await getRepository()).getAISettings()

  if (!settings) {
    return null
  }

  return {
    ...settings,
    apiKey: await getSecureApiKey(),
  }
}

export async function saveGoal(...args: Parameters<AppRepository['saveGoal']>) {
  return (await getRepository()).saveGoal(...args)
}

export async function getGoals() {
  return (await getRepository()).getGoals()
}

export async function getGoalById(
  ...args: Parameters<AppRepository['getGoalById']>
) {
  return (await getRepository()).getGoalById(...args)
}

export async function deleteGoal(
  ...args: Parameters<AppRepository['deleteGoal']>
) {
  return (await getRepository()).deleteGoal(...args)
}

export async function saveKnowledgeTree(
  ...args: Parameters<AppRepository['saveKnowledgeTree']>
) {
  return (await getRepository()).saveKnowledgeTree(...args)
}

export async function getKnowledgeTreeByGoalId(
  ...args: Parameters<AppRepository['getKnowledgeTreeByGoalId']>
) {
  return (await getRepository()).getKnowledgeTreeByGoalId(...args)
}

export async function saveInterviewSession(
  ...args: Parameters<AppRepository['saveInterviewSession']>
) {
  return (await getRepository()).saveInterviewSession(...args)
}

export async function getInterviewSessionByGoalId(
  ...args: Parameters<AppRepository['getInterviewSessionByGoalId']>
) {
  return (await getRepository()).getInterviewSessionByGoalId(...args)
}

export async function saveBlindspotReport(
  ...args: Parameters<AppRepository['saveBlindspotReport']>
) {
  return (await getRepository()).saveBlindspotReport(...args)
}

export async function getBlindspotReportByGoalId(
  ...args: Parameters<AppRepository['getBlindspotReportByGoalId']>
) {
  return (await getRepository()).getBlindspotReportByGoalId(...args)
}

export async function saveLearningPath(
  ...args: Parameters<AppRepository['saveLearningPath']>
) {
  return (await getRepository()).saveLearningPath(...args)
}

export async function getLearningPathByGoalId(
  ...args: Parameters<AppRepository['getLearningPathByGoalId']>
) {
  return (await getRepository()).getLearningPathByGoalId(...args)
}

export async function saveConceptCard(
  ...args: Parameters<AppRepository['saveConceptCard']>
) {
  return (await getRepository()).saveConceptCard(...args)
}

export async function getConceptCardsByGoalId(
  ...args: Parameters<AppRepository['getConceptCardsByGoalId']>
) {
  return (await getRepository()).getConceptCardsByGoalId(...args)
}

async function migrateLegacyApiKeyToSecureStorage(): Promise<void> {
  const legacySettings = getLegacyAISettingsWithApiKey()

  if (!legacySettings?.apiKey.trim()) {
    return
  }

  const secureApiKey = await getSecureApiKey()

  if (!secureApiKey) {
    await saveSecureApiKey(legacySettings.apiKey)
  }

  clearStoredAISettingsApiKey()
}

function stripApiKey(settings: AISettings): AISettings {
  return {
    ...settings,
    apiKey: '',
  }
}
