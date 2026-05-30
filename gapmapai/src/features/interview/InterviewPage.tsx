import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Brain,
  CircleAlert,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  User,
} from 'lucide-react'
import { nanoid } from 'nanoid'

import { createAIClient } from '../../lib/ai/client'
import { getErrorMessage } from '../../lib/ai/errors'
import { generateBlindspotReportPrompt } from '../../lib/prompts/generateBlindspotReportPrompt'
import { createInterviewPrompt } from '../../lib/prompts/interviewPrompt'
import {
  getAISettings,
  getInterviewSessionByGoalId,
  getKnowledgeTreeByGoalId,
  saveBlindspotReport,
  saveInterviewSession,
} from '../../lib/storage/repository'
import type {
  BlindspotReport,
  Goal,
  InterviewMessage,
  InterviewSession,
} from '../../lib/types'
import { extractJsonFromText, safeJsonParse } from '../../lib/utils/json'

type InterviewPageProps = {
  currentGoal: Goal | null
  onReportGenerated: () => void
}

type InterviewAIResponse = {
  assistantMessage: string
  nextQuestion: string
  diagnosisUpdate: string
  shouldContinue: boolean
  coveredConcepts: string[]
  possibleBlindspots: string[]
  possibleMisconceptions: string[]
}

type DiagnosisSnapshot = {
  coveredConcepts: string[]
  possibleBlindspots: string[]
  possibleMisconceptions: string[]
}

const DEFAULT_MAX_QUESTIONS = 6

export function InterviewPage({
  currentGoal,
  onReportGenerated,
}: InterviewPageProps) {
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [draftAnswer, setDraftAnswer] = useState('')
  const [error, setError] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      if (!currentGoal) {
        setSession(null)
        return
      }

      const nextSession = await getInterviewSessionByGoalId(currentGoal.id)
      if (isMounted) {
        setSession(nextSession)
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [currentGoal])

  const diagnosisSnapshot = useMemo(
    () => buildDiagnosisSnapshot(session?.messages ?? []),
    [session],
  )
  const answeredCount = useMemo(
    () =>
      session?.messages.filter((message) => message.role === 'user').length ??
      0,
    [session],
  )

  async function handleStartInterview() {
    if (!currentGoal) {
      setError('请先新建或选择一个目标。')
      return
    }

    const baseSession = createEmptySession(currentGoal.id)
    await saveInterviewSession(baseSession)
    setSession(baseSession)
    setDraftAnswer('')
    setError('')
    await requestInterviewTurn(baseSession)
  }

  async function handleSubmitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentGoal || !session) {
      setError('请先开始诊断。')
      return
    }

    const answer = draftAnswer.trim()

    if (!answer) {
      setError('请先输入你的回答。')
      return
    }

    const now = new Date().toISOString()
    const nextSession: InterviewSession = {
      ...session,
      status: 'running',
      messages: [
        ...session.messages,
        {
          id: nanoid(),
          role: 'user',
          content: answer,
          diagnosticTags: [],
          createdAt: now,
        },
      ],
      updatedAt: now,
    }

    await saveInterviewSession(nextSession)
    setSession(nextSession)
    setDraftAnswer('')
    setError('')
    await requestInterviewTurn(nextSession)
  }

  async function requestInterviewTurn(baseSession: InterviewSession) {
    if (!currentGoal) {
      setError('请先新建或选择一个目标。')
      return
    }

    const knowledgeTree = await getKnowledgeTreeByGoalId(currentGoal.id)

    if (!knowledgeTree) {
      setError('当前目标还没有知识树。请先生成知识树。')
      return
    }

    const aiSettings = await getAISettings()

    if (!aiSettings) {
      setError('请先到“设置”页面填写并保存 AI Provider 信息。')
      return
    }

    setIsThinking(true)

    try {
      const client = createAIClient(aiSettings)
      const content = await client.chat(
        createInterviewPrompt({
          goal: currentGoal,
          knowledgeTree,
          session: baseSession,
        }),
        {
          temperature: 0.25,
          maxTokens: 1800,
          responseFormat: { type: 'json_object' },
          stream: false,
        },
      )
      const parseResult = safeJsonParse<Partial<InterviewAIResponse>>(
        extractJsonFromText(content),
      )

      if (!parseResult.ok) {
        setError('AI 返回格式错误，可以重试。')
        return
      }

      const response = normalizeInterviewResponse(parseResult.data)
      const userAnswers = baseSession.messages.filter(
        (message) => message.role === 'user',
      ).length
      const canContinue =
        response.shouldContinue && userAnswers < baseSession.maxQuestions
      const aiContent = [
        response.assistantMessage,
        canContinue ? response.nextQuestion : '',
      ]
        .filter(Boolean)
        .join('\n\n')
      const now = new Date().toISOString()
      const nextSession: InterviewSession = {
        ...baseSession,
        status: canContinue ? 'running' : 'completed',
        messages: [
          ...baseSession.messages,
          {
            id: nanoid(),
            role: 'ai',
            content: aiContent,
            diagnosticTags: buildDiagnosticTags(response),
            createdAt: now,
          },
        ],
        currentQuestionIndex: canContinue
          ? Math.min(userAnswers + 1, baseSession.maxQuestions)
          : userAnswers,
        updatedAt: now,
      }

      await saveInterviewSession(nextSession)
      setSession(nextSession)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsThinking(false)
    }
  }

  async function handleGenerateReport() {
    if (!currentGoal || !session) {
      setError('请先完成至少一轮诊断。')
      return
    }

    if (draftAnswer.trim()) {
      setError('你还有未发送的回答，请先发送回答再生成报告。')
      return
    }

    const knowledgeTree = await getKnowledgeTreeByGoalId(currentGoal.id)

    if (!knowledgeTree) {
      setError('当前目标还没有知识树。请先生成知识树。')
      return
    }

    const aiSettings = await getAISettings()

    if (!aiSettings) {
      setError('请先到“设置”页面填写并保存 AI Provider 信息。')
      return
    }

    const completedSession: InterviewSession = {
      ...session,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    }

    await saveInterviewSession(completedSession)
    setSession(completedSession)
    setIsGeneratingReport(true)
    setError('')

    try {
      const client = createAIClient(aiSettings)
      const content = await client.chat(
        generateBlindspotReportPrompt({
          goal: currentGoal,
          interviewSession: completedSession,
          knowledgeTree,
        }),
        {
          temperature: 0.2,
          maxTokens: 3000,
          responseFormat: { type: 'json_object' },
          stream: false,
        },
      )
      const parseResult = safeJsonParse<Partial<BlindspotReport>>(
        extractJsonFromText(content),
      )

      if (!parseResult.ok) {
        setError('AI 返回格式错误，可以重试。')
        return
      }

      const report = normalizeBlindspotReport(parseResult.data, currentGoal)
      await saveBlindspotReport(report)
      onReportGenerated()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (!currentGoal) {
    return (
      <EmptyInterview
        title="还没有选择目标"
        description="请先新建目标或从历史记录中选择目标。"
      />
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">AI 诊断</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          AI 追问诊断
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          AI 会像知识面试官一样每次只问一个问题，根据你的回答继续追问，判断你真正理解、模糊或误解的地方。
        </p>
        <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">当前目标：</span>
          {currentGoal.title}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">对话</h2>
              <p className="mt-1 text-xs text-slate-500">
                默认最多 {DEFAULT_MAX_QUESTIONS} 个问题，已回答 {answeredCount}{' '}
                个。
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
              disabled={isThinking || isGeneratingReport}
              type="button"
              onClick={() => void handleStartInterview()}
            >
              <Sparkles className="h-4 w-4" />
              {session ? '重新开始诊断' : '开始诊断'}
            </button>
          </div>

          <div className="max-h-[560px] min-h-80 space-y-4 overflow-y-auto px-5 py-5">
            {!session || session.messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                点击“开始诊断”，AI 会先问第一个问题。你可以用自己的话回答，不需要背定义。
              </div>
            ) : (
              session.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}

            {isThinking ? (
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
                AI 正在根据你的回答继续追问...
              </div>
            ) : null}
          </div>

          {session?.status === 'running' ? (
            <form
              className="border-t border-slate-200 p-5"
              onSubmit={handleSubmitAnswer}
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  你的回答
                </span>
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  placeholder="用自己的话回答即可，AI 会根据回答继续追问。"
                  value={draftAnswer}
                  onChange={(event) => setDraftAnswer(event.target.value)}
                />
              </label>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
                  disabled={isThinking}
                  type="submit"
                >
                  <Send className="h-4 w-4" />
                  发送回答
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-wait disabled:text-slate-400"
                  disabled={isThinking || isGeneratingReport}
                  type="button"
                  onClick={() => void handleGenerateReport()}
                >
                  <FileText className="h-4 w-4" />
                  {isGeneratingReport
                    ? '正在生成...'
                    : '结束诊断并生成报告'}
                </button>
              </div>
            </form>
          ) : session ? (
            <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
                disabled={isGeneratingReport}
                type="button"
                onClick={() => void handleGenerateReport()}
              >
                <FileText className="h-4 w-4" />
                {isGeneratingReport ? '正在生成...' : '生成盲区报告'}
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="border-t border-slate-200 px-5 py-4">
              <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <DiagnosisCard
            icon={Brain}
            items={diagnosisSnapshot.coveredConcepts}
            title="已覆盖概念"
          />
          <DiagnosisCard
            icon={CircleAlert}
            items={diagnosisSnapshot.possibleBlindspots}
            title="可能盲区"
          />
          <DiagnosisCard
            icon={MessageSquare}
            items={diagnosisSnapshot.possibleMisconceptions}
            title="可能误解"
          />
        </aside>
      </div>
    </section>
  )
}

function MessageBubble({ message }: { message: InterviewMessage }) {
  const isUser = message.role === 'user'
  const Icon = isUser ? User : Bot

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-lg bg-slate-950 px-4 py-3 text-sm leading-6 text-white'
            : 'max-w-[80%] rounded-lg bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-800'
        }
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-medium opacity-75">
          <Icon className="h-3.5 w-3.5" />
          {isUser ? '你' : 'AI 面试官'}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  )
}

function DiagnosisCard({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof Brain
  items: string[]
  title: string
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      </div>
      <ul className="mt-4 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li
              key={item}
              className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700"
            >
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
            暂无
          </li>
        )}
      </ul>
    </section>
  )
}

function createEmptySession(goalId: string): InterviewSession {
  const now = new Date().toISOString()

  return {
    id: nanoid(),
    goalId,
    status: 'running',
    messages: [],
    currentQuestionIndex: 0,
    maxQuestions: DEFAULT_MAX_QUESTIONS,
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeInterviewResponse(
  value: Partial<InterviewAIResponse>,
): InterviewAIResponse {
  return {
    assistantMessage:
      typeof value.assistantMessage === 'string'
        ? value.assistantMessage
        : '我先记录一下你的回答。',
    nextQuestion:
      typeof value.nextQuestion === 'string' ? value.nextQuestion : '',
    diagnosisUpdate:
      typeof value.diagnosisUpdate === 'string'
        ? value.diagnosisUpdate
        : '',
    shouldContinue:
      typeof value.shouldContinue === 'boolean'
        ? value.shouldContinue
        : true,
    coveredConcepts: normalizeStringList(value.coveredConcepts),
    possibleBlindspots: normalizeStringList(value.possibleBlindspots),
    possibleMisconceptions: normalizeStringList(value.possibleMisconceptions),
  }
}

function buildDiagnosticTags(response: InterviewAIResponse): string[] {
  return [
    ...response.coveredConcepts.map((item) => `covered:${item}`),
    ...response.possibleBlindspots.map((item) => `blindspot:${item}`),
    ...response.possibleMisconceptions.map((item) => `misconception:${item}`),
    response.diagnosisUpdate ? `diagnosis:${response.diagnosisUpdate}` : '',
  ].filter(Boolean)
}

function buildDiagnosisSnapshot(messages: InterviewMessage[]): DiagnosisSnapshot {
  return {
    coveredConcepts: collectTagValues(messages, 'covered:'),
    possibleBlindspots: collectTagValues(messages, 'blindspot:'),
    possibleMisconceptions: collectTagValues(messages, 'misconception:'),
  }
}

function collectTagValues(
  messages: InterviewMessage[],
  prefix: string,
): string[] {
  const values = messages.flatMap((message) =>
    message.diagnosticTags
      .filter((tag) => tag.startsWith(prefix))
      .map((tag) => tag.slice(prefix.length).trim())
      .filter(Boolean),
  )

  return Array.from(new Set(values))
}

function normalizeBlindspotReport(
  value: Partial<BlindspotReport>,
  goal: Goal,
): BlindspotReport {
  if (!value || typeof value !== 'object') {
    throw new Error('AI 返回 JSON 格式异常，缺少盲区报告对象。')
  }

  return {
    id: typeof value.id === 'string' ? value.id : nanoid(),
    goalId: goal.id,
    mastered: normalizeStringList(value.mastered),
    fuzzy: normalizeStringList(value.fuzzy),
    missing: normalizeStringList(value.missing),
    misconceptions: normalizeStringList(value.misconceptions),
    canSkipForNow: normalizeStringList(value.canSkipForNow),
    nextFocus: normalizeStringList(value.nextFocus).slice(0, 5),
    createdAt: new Date().toISOString(),
  }
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function EmptyInterview({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        <FileText className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
    </section>
  )
}
