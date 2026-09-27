import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  AssessmentSummary,
  CaptureImage,
  ConditionTag,
  GeneratedProgram,
  PoseAnalysisResult,
  ProgramExercise,
  ViewType
} from '@/types'
import { loadSession, saveSession } from '@/lib/storage'

interface AppState {
  captures: Record<ViewType, CaptureImage | null>
  setCapture: (view: ViewType, image: CaptureImage | null) => void
  results: Record<ViewType, PoseAnalysisResult | null>
  setResult: (view: ViewType, result: PoseAnalysisResult | null) => void
  program: GeneratedProgram | null
  setProgram: (program: GeneratedProgram | null) => void
  updateProgramCategory: (category: 'warmup' | 'main' | 'cooldown', exercises: ProgramExercise[]) => void
  ptNote: string
  setPtNote: (note: string) => void
  symptomTags: ConditionTag[]
  setSymptomTags: (tags: ConditionTag[]) => void
  patientName: string
  setPatientName: (name: string) => void
  assessedDate: string
  setAssessedDate: (date: string) => void
  /** STEP10: Before/After 비교용 스냅샷 */
  beforeSummary: AssessmentSummary | null
  latestSummary: AssessmentSummary | null
  saveAsBefore: (summary: AssessmentSummary) => void
  setLatestSummary: (summary: AssessmentSummary) => void
  clearBefore: () => void
  resetAll: () => void
}

const emptyCaptures: Record<ViewType, CaptureImage | null> = { front: null, side: null, back: null }
const emptyResults: Record<ViewType, PoseAnalysisResult | null> = { front: null, side: null, back: null }

const AppStateContext = createContext<AppState | null>(null)

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [captures, setCaptures] = useState(emptyCaptures)
  const [results, setResults] = useState(emptyResults)
  const [program, setProgram] = useState<GeneratedProgram | null>(null)
  const [ptNote, setPtNote] = useState('')
  const [symptomTags, setSymptomTags] = useState<ConditionTag[]>([])
  const [patientName, setPatientName] = useState('')
  const [assessedDate, setAssessedDate] = useState(todayStr())
  const [beforeSummary, setBeforeSummary] = useState<AssessmentSummary | null>(null)
  const [latestSummary, setLatestSummaryState] = useState<AssessmentSummary | null>(null)

  const hydrated = useRef(false)

  // 최초 마운트 시 localStorage에서 세션 데이터(사진 제외)를 불러온다.
  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setProgram(saved.program)
      setPtNote(saved.ptNote)
      setSymptomTags(saved.symptomTags as ConditionTag[])
      setPatientName(saved.patientName)
      setAssessedDate(saved.assessedDate || todayStr())
      setBeforeSummary(saved.beforeSummary)
      setLatestSummaryState(saved.latestSummary)
    }
    hydrated.current = true
  }, [])

  // 가벼운 데이터(사진 제외)는 바뀔 때마다 자동 저장한다.
  useEffect(() => {
    if (!hydrated.current) return
    saveSession({ patientName, assessedDate, beforeSummary, latestSummary, program, ptNote, symptomTags })
  }, [patientName, assessedDate, beforeSummary, latestSummary, program, ptNote, symptomTags])

  const value = useMemo<AppState>(
    () => ({
      captures,
      setCapture: (view, image) => setCaptures((c) => ({ ...c, [view]: image })),
      results,
      setResult: (view, result) => setResults((r) => ({ ...r, [view]: result })),
      program,
      setProgram,
      updateProgramCategory: (category, exercises) =>
        setProgram((p) => (p ? { ...p, [category]: exercises } : p)),
      ptNote,
      setPtNote,
      symptomTags,
      setSymptomTags,
      patientName,
      setPatientName,
      assessedDate,
      setAssessedDate,
      beforeSummary,
      latestSummary,
      saveAsBefore: (summary) => setBeforeSummary(summary),
      setLatestSummary: (summary) => setLatestSummaryState(summary),
      clearBefore: () => setBeforeSummary(null),
      resetAll: () => {
        setCaptures(emptyCaptures)
        setResults(emptyResults)
        setProgram(null)
        setPtNote('')
        setSymptomTags([])
        setBeforeSummary(null)
        setLatestSummaryState(null)
      }
    }),
    [captures, results, program, ptNote, symptomTags, patientName, assessedDate, beforeSummary, latestSummary]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState는 AppStateProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
