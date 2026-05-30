export const SQLITE_DATABASE_URL = 'sqlite:gapmap-ai.db'

export type SqlDatabase = {
  execute(query: string, bindValues?: unknown[]): Promise<unknown>
  select<T>(query: string, bindValues?: unknown[]): Promise<T>
}

let databasePromise: Promise<SqlDatabase> | null = null

export function isTauriRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  )
}

export async function getDatabase(): Promise<SqlDatabase> {
  if (!databasePromise) {
    databasePromise = import('@tauri-apps/plugin-sql').then((module) =>
      module.default.load(SQLITE_DATABASE_URL),
    )
  }

  return databasePromise
}

export function encodeJson(value: unknown): string {
  return JSON.stringify(value ?? null)
}

export function decodeJson<TValue>(value: unknown, fallback: TValue): TValue {
  if (typeof value !== 'string' || !value) {
    return fallback
  }

  try {
    return JSON.parse(value) as TValue
  } catch {
    return fallback
  }
}
