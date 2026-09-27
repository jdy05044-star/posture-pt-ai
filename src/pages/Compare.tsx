import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { runAssessment } from '@/assessment/assessmentEngine'
import { useAppState } from '@/state/AppState'
import type { AngleMeasurement, ObservationArea } from '@/types'

const AREAS: ObservationArea[] = ['어깨', '골반', '허리/몸통', '머리/목', '무릎', '발']

export default function Compare() {
  const { results, beforeSummary, clearBefore } = useAppState()
  const navigate = useNavigate()

  const afterSummary = useMemo(() => runAssessment(results), [results])
  const afterHasData = Object.values(results).some((r) => r && r.landmarks.length > 0)

  if (!beforeSummary) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="text-sm text-clinical-600">
          저장된 Before 결과가 없습니다. 자세 평가 결과 화면에서 먼저 "이 결과를 Before로 저장"을 눌러주세요.
        </p>
        <button onClick={() => navigate('/result')} className="btn-primary mt-4 w-full py-3">
          평가 결과로 이동
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-1 text-lg font-semibold text-clinical-900">Before / After 비교</h2>
      <p className="mb-2 text-sm text-clinical-600">
        Before: {new Date(beforeSummary.generatedAt).toLocaleDateString('ko-KR')} · After:{' '}
        {afterHasData ? new Date(afterSummary.generatedAt).toLocaleDateString('ko-KR') : '아직 새 사진이 분석되지 않음'}
      </p>
      <p className="mb-6 text-xs text-clinical-400">
        촬영 각도·자세 차이에 따른 측정 오차가 있을 수 있어, 참고용 변화 추이로만 활용해주세요.
      </p>

      {!afterHasData && (
        <div className="mb-6 rounded-lg bg-clinical-100 p-3 text-xs text-clinical-600">
          After로 비교하려면 새로 촬영 후 분석을 진행해주세요.{' '}
          <button onClick={() => navigate('/capture')} className="underline">
            다시 촬영하기
          </button>
        </div>
      )}

      <div className="space-y-4">
        {AREAS.map((area) => {
          const beforeM = beforeSummary.areaResults.find((r) => r.area === area)?.measurements ?? []
          const afterM = afterHasData
            ? afterSummary.areaResults.find((r) => r.area === area)?.measurements ?? []
            : []
          const ids = Array.from(new Set([...beforeM.map((m) => m.id), ...afterM.map((m) => m.id)]))
          const rows = ids
            .map((id) => ({
              before: beforeM.find((m) => m.id === id),
              after: afterM.find((m) => m.id === id)
            }))
            .filter((r) => r.before || r.after)

          if (rows.length === 0) return null

          return (
            <div key={area} className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-clinical-900">{area}</h3>
              <div className="space-y-2 text-sm">
                {rows.map((r, i) => (
                  <ComparisonRow key={i} before={r.before} after={r.after} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={clearBefore} className="btn-secondary mt-6 w-full py-2 text-sm text-alert-red">
        Before 기록 삭제하고 새로 시작
      </button>
    </div>
  )
}

function ComparisonRow({ before, after }: { before?: AngleMeasurement; after?: AngleMeasurement }) {
  const label = before?.label ?? after?.label ?? ''
  const b = before?.valueDeg
  const a = after?.valueDeg
  const delta = b !== undefined && b !== null && a !== undefined && a !== null ? Math.round((a - b) * 10) / 10 : null

  return (
    <div className="flex items-center justify-between border-b border-clinical-100 pb-2 last:border-0 last:pb-0">
      <span className="text-clinical-700">{label}</span>
      <span className="text-right text-clinical-600">
        {b !== undefined && b !== null ? `${b}°` : '—'} → {a !== undefined && a !== null ? `${a}°` : '측정 전'}
        {delta !== null && (
          <span className={`ml-1 font-medium ${delta < 0 ? 'text-clinical-600' : 'text-alert-amber'}`}>
            ({delta > 0 ? '+' : ''}
            {delta}°)
          </span>
        )}
      </span>
    </div>
  )
}
