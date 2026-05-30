export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim()

  if (!trimmed) {
    return '未填写'
  }

  if (trimmed.length <= 8) {
    return '****'
  }

  return `${trimmed.slice(0, 3)}-****${trimmed.slice(-4)}`
}
