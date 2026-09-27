import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractMeasurements, FRONTAL_MEASUREMENT_IDS, SAGITTAL_MEASUREMENT_IDS } from '@/assessment/angleCalculations'
import { computePatternTendencies } from '@/assessment/patternTendencies'
import { findExercisesByArea } from '@/exercises/exerciseLibrary'
import { AREA_COLORS } from '@/lib/areaColors'
import type { AssessmentSummary } from '@/types'

interface Props {
  summary: AssessmentSummary
}

/** 측정값이 하나도 없는(전부 '측정 불확실') 영역은 요약 목록에서 제외한다 */
function hasAnyMeasurement(summary: AssessmentSummary, areaName: string) {
  const area = summary.areaResults.find((r) => r.area === areaName)
  return !!area && area.measurements.some((m) => m.direction !== null)
}

/**
 * 자세평가 결과를 색상 점 + 짧은 관찰 문구로 요약해서 보여주는 패널.
 * "전체적인 평가"는 우선 확인 영역 개수/이름만 언급하는 수준으로만 작성하고,
 * 질환명이나 통증 원인을 단정하지 않는다 (요청 스펙의 절대 금지 원칙 준수).
 */
export default function AssessmentSummaryPanel({ summary }: Props) {
  const navigate = useNavigate()

  const rows = summary.areaResults.filter((r) => hasAnyMeasurement(summary, r.area))

  const overallText = useMemo(() => {
    if (summary.priorityAreas.length === 0) {
      return '측정된 편차가 크게 두드러지는 영역은 없었습니다. 다만 이는 사진 한 장을 기반으로 한 참고용 결과이며, 실제 기능적인 불편함 여부는 별도로 확인이 필요합니다.'
    }
    const areaNames = Array.from(new Set(summary.priorityAreas.map((p) => p.area)))
    return `${areaNames.join(', ')} 영역에서 다른 부위 대비 상대적으로 큰 편차가 관찰됩니다. 이는 특정 질환이나 통증의 원인을 의미하는 것이 아니라, 자세 습관을 점검해볼 수 있는 참고 정보입니다.`
  }, [summary.priorityAreas])

  const previewExercises = useMemo(() => {
    const areaNames = Array.from(new Set(summary.priorityAreas.map((p) => p.area)))
    const pool = areaNames.flatMap((a) => findExercisesByArea(a))
    const unique = Array.from(new Map(pool.map((e) => [e.id, e])).values())
    return unique.slice(0, 4)
  }, [summary.priorityAreas])

  // 여러 부위의 측정 경향을 종합한 "전신 패턴 경향" — 실제 측정값만 근거로 계산하며,
  // 근거가 부족한 항목(status: 'insufficient')은 화면에 표시하지 않는다.
  const patternTendencies = useMemo(() => {
    const sagittal = extractMeasurements(summary, SAGITTAL_MEASUREMENT_IDS)
    const frontal = extractMeasurements(summary, FRONTAL_MEASUREMENT_IDS)
    return computePatternTendencies(sagittal, frontal).filter((t) => t.status !== 'insufficient')
  }, [summary])

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-clinical-900">자세 분석 요약</h3>

      {rows.length > 0 ? (
        <ul className="space-y-2.5">
          {rows.map((r) => {
            const rep = r.measurements.find((m) => m.direction !== null)
            return (
              <li key={r.area} className="flex items-start gap-2 text-sm">
                <span
                  className="mt-1.5 h-2 w-2 flex-none rounded-full"
                  style={{ backgroundColor: AREA_COLORS[r.area] }}
                />
                <div>
                  <span className="font-medium text-clinical-800">{r.area}</span>{' '}
                  <span className="text-clinical-600">{rep?.direction ?? '측정 불확실'}</span>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-clinical-500">아직 표시할 측정 결과가 없습니다.</p>
      )}

      <div className="mt-4 border-t border-clinical-100 pt-3">
        <p className="label-caption mb-1">전체적인 평가</p>
        <p className="text-sm text-clinical-600">{overallText}</p>
      </div>

      {patternTendencies.length > 0 && (
        <div className="mt-4 border-t border-clinical-100 pt-3">
          <p className="label-caption mb-1">전신 패턴 경향 (참고)</p>
          <ul className="space-y-2.5">
            {patternTendencies.map((t) => (
              <li key={t.id} className="text-sm">
                <p className="font-medium text-clinical-800">
                  {t.label}
                  {t.status === 'partial' && <span className="ml-1 text-xs font-normal text-clinical-400">· 일부만 해당</span>}
                </p>
                <p className="text-clinical-600">{t.description}</p>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-clinical-400">
            여러 부위의 측정 경향을 참고로 묶어본 것이며, 의학적 분류나 진단이 아닙니다.
          </p>
        </div>
      )}

      {previewExercises.length > 0 && (
        <div className="mt-4 border-t border-clinical-100 pt-3">
          <p className="label-caption mb-1">추천 운동 미리보기</p>
          <ul className="mb-2 space-y-1 text-sm text-clinical-600">
            {previewExercises.map((ex) => (
              <li key={ex.id}>· {ex.name}</li>
            ))}
          </ul>
          <button onClick={() => navigate('/program')} className="text-xs font-medium text-clinical-700 underline">
            전체 운동 프로그램 생성하러 가기
          </button>
        </div>
      )}

      <p className="mt-4 border-t border-clinical-100 pt-3 text-xs text-clinical-400">
        이 분석은 사진을 기반으로 한 참고용 결과입니다. 정확한 평가와 맞춤 운동을 위해서는 담당 PT와의 상담이
        필요합니다.
      </p>
    </div>
  )
}
