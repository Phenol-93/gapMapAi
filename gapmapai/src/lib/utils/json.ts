export type SafeJsonParseResult<TValue> =
  | { ok: true; data: TValue }
  | { ok: false; error: string }

export function safeJsonParse<TValue>(value: string): SafeJsonParseResult<TValue> {
  try {
    return { ok: true, data: JSON.parse(value) as TValue }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'JSON 解析失败。',
    }
  }
}

export function extractJsonFromText(text: string): string {
  const trimmedText = text.trim()
  const withoutFence = trimmedText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  if (withoutFence.startsWith('{') && withoutFence.endsWith('}')) {
    return withoutFence
  }

  const startIndex = withoutFence.indexOf('{')

  if (startIndex === -1) {
    return withoutFence
  }

  let depth = 0
  let isInString = false
  let isEscaped = false

  for (let index = startIndex; index < withoutFence.length; index += 1) {
    const char = withoutFence[index]

    if (isEscaped) {
      isEscaped = false
      continue
    }

    if (char === '\\') {
      isEscaped = true
      continue
    }

    if (char === '"') {
      isInString = !isInString
      continue
    }

    if (isInString) {
      continue
    }

    if (char === '{') {
      depth += 1
    }

    if (char === '}') {
      depth -= 1

      if (depth === 0) {
        return withoutFence.slice(startIndex, index + 1)
      }
    }
  }

  return withoutFence
}
