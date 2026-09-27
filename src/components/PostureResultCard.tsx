import type { AreaAssessmentResult } from '@/types'
import AreaEducationCard from './AreaEducationCard'

function confidenceColor(conf: number | null) {
  if (conf === null) return 'text-clinical-400'
  if (conf >= 0.7) return 'text-clinical-600'
  if (conf >= 0.4) return 'text-alert-amber'
  return 'text-alert-red'
}

export default function PostureResultCard({ result }: { result: AreaAssessmentResult }) {
  const hasData = result.measurements.some((m) => m.valueDeg !== null || m.direction !== null)

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-clinical-900">{result.area}</h3>
        <span className={`text-xs font-medium ${confidenceColor(result.confidence)}`}>
          {result.confidence !== null ? `신뢰도 ${Math.round(result.confidence * 100)}%` : '신뢰도 —'}
        </span>
      </div>

      {hasData ? (
        <ul className="mb-3 space-y-1 text-sm text-clinical-700">
          {result.measurements.map((m) => (
            <li key={m.id} className="flex flex-col">
              <span className="font-medium">{m.label}</span>
              {m.valueDeg !== null ? (
                <span className="text-clinical-600">
                  측정값 {m.valueDeg}° — {m.direction}
                </span>
              ) : m.direction ? (
                <span className="text-clinical-600">{m.direction}</span>
              ) : (
                <span className="text-clinical-400">측정 불확실{m.unavailableReason ? ` (${m.unavailableReason})` : ''}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-clinical-400">측정 불확실 — 관련 사진 또는 landmark 인식이 필요합니다.</p>
      )}

      <AreaEducationCard area={result.area} />
    </div>
  )
}
