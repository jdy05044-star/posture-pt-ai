import type { AssessmentSummary, GeneratedProgram } from '@/types'

const STORAGE_KEY = 'posture-pt-ai:session:v1'

/**
 * localStorage에 저장하는 가벼운 세션 데이터.
 * 사진(dataUrl)은 용량이 크고 민감정보라 의도적으로 저장하지 않는다 — 새로고침하면 사진은 사라지고
 * 다시 촬영해야 하지만, 평가결과·프로그램·메모는 유지된다.
 * 추후 Supabase/Firebase로 확장할 때는 이 모듈의 인터페이스만 교체하면 되도록 분리해두었다.
 */
export interface PersistedSession {
  patientName: string
  assessedDate: string // YYYY-MM-DD
  beforeSummary: AssessmentSummary | null
  latestSummary: AssessmentSummary | null
  program: GeneratedProgram | null
  ptNote: string
  symptomTags: string[]
  savedAt: string
}

export function saveSession(data: Omit<PersistedSession, 'savedAt'>): boolean {
  try {
    const payload: PersistedSession = { ...data, savedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch (e) {
    // 용량 초과 등으로 저장에 실패해도 앱 사용에는 지장이 없도록 조용히 실패 처리
    console.warn('세션 저장에 실패했습니다:', e)
    return false
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedSession
  } catch (e) {
    console.warn('세션 불러오기에 실패했습니다:', e)
    return null
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 무시 — 저장 공간 접근이 아예 막힌 환경(프라이빗 모드 등)일 수 있음
  }
}
