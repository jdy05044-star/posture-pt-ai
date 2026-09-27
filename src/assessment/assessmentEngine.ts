import type {
  AngleMeasurement,
  AreaAssessmentResult,
  AssessmentSummary,
  ObservationArea,
  PoseAnalysisResult,
  PriorityAreaEntry,
  ViewType
} from '@/types'
import { computeFrontalMeasurements, computeSagittalMeasurements } from './angleCalculations'

const ALL_AREAS: ObservationArea[] = ['어깨', '골반', '허리/몸통', '머리/목', '무릎', '발']

/** 여러 측정값의 confidence 평균 (null인 값은 제외, 전부 null이면 null) */
function areaConfidence(measurements: AngleMeasurement[]): number | null {
  const vals = measurements.map((m) => m.confidence).filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/** 관찰 문구를 생성한다. 원인·진단을 단정하지 않고 "관찰이 필요한 영역" 수준으로 표현한다. */
function buildObservation(measurements: AngleMeasurement[]): string {
  const available = measurements.filter((m) => m.direction !== null)
  if (available.length === 0) {
    return '측정 불확실 — 사진에서 관련 관절점이 충분히 인식되지 않았습니다. 다시 촬영해주세요.'
  }
  const lines = available.map((m) => `${m.label}: ${m.direction}`)
  return `${lines.join(' / ')} — 자세상 관찰이 필요한 영역으로 참고해주세요.`
}

/**
 * 세 장의 사진(정면/측면/후면) 분석 결과를 받아 관찰 영역별 결과와 우선 확인 영역을 생성한다.
 * 사진이 없거나 landmark 인식이 안 된 항목은 값을 지어내지 않고 '측정 불확실'로 남긴다.
 */
export function runAssessment(results: Record<ViewType, PoseAnalysisResult | null>): AssessmentSummary {
  const allMeasurements: AngleMeasurement[] = []

  if (results.front && results.front.landmarks.length > 0) {
    allMeasurements.push(...computeFrontalMeasurements(results.front))
  }
  if (results.back && results.back.landmarks.length > 0) {
    const backMeasurements = computeFrontalMeasurements(results.back).map((m) => ({
      ...m,
      id: `${m.id}-back`,
      label: `${m.label} (후면)`
    }))
    allMeasurements.push(...backMeasurements)
  }
  if (results.side && results.side.landmarks.length > 0) {
    allMeasurements.push(...computeSagittalMeasurements(results.side))
  }

  const areaResults: AreaAssessmentResult[] = ALL_AREAS.map((area) => {
    const measurements = allMeasurements.filter((m) => m.area === area)
    return {
      area,
      measurements,
      observation: buildObservation(measurements),
      confidence: areaConfidence(measurements)
    }
  })

  // 우선 확인 영역: valueDeg가 있는(각도로 비교 가능한) 측정값 중 편차가 큰 순서로 정렬
  const scored: PriorityAreaEntry[] = allMeasurements
    .filter((m) => m.valueDeg !== null)
    .map((m) => {
      const severity = m.id.includes('knee-flex-angle') ? Math.abs((m.valueDeg as number) - 180) : Math.abs(m.valueDeg as number)
      return {
        entry: {
          area: m.area,
          reason: m.direction ?? '',
          basedOnMeasurement: m.label,
          valueDeg: m.valueDeg,
          confidence: m.confidence
        } as PriorityAreaEntry,
        severity
      }
    })
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .map((s) => s.entry)

  return {
    areaResults,
    priorityAreas: scored,
    generatedAt: new Date().toISOString()
  }
}
