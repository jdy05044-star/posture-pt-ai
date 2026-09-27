import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { runAssessment } from '@/assessment/assessmentEngine'
import { useAppState } from '@/state/AppState'
import { VIEW_LABELS, type ViewType } from '@/types'

const VIEWS: ViewType[] = ['front', 'side', 'back']

export default function Report() {
  const {
    captures,
    results,
    program,
    ptNote,
    patientName,
    setPatientName,
    assessedDate,
    setAssessedDate,
    latestSummary
  } = useAppState()
  const navigate = useNavigate()

  const hasLiveResults = Object.values(results).some((r) => r && r.landmarks.length > 0)
  const summary = useMemo(
    () => (hasLiveResults ? runAssessment(results) : latestSummary),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasLiveResults, results]
  )

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="no-print mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/result')} className="text-sm text-clinical-500">
          ← 결과로 돌아가기
        </button>
        <button onClick={() => window.print()} className="btn-primary px-4 py-2 text-sm">
          PDF로 저장 (인쇄)
        </button>
      </div>

      <div id="report-content" className="space-y-6">
        <header className="text-center">
          <p className="label-caption">POSTURE ASSESSMENT REPORT</p>
          <h1 className="text-xl font-semibold text-clinical-900">자세 평가 리포트</h1>
        </header>

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-clinical-900">환자 기본정보</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="label-caption">이름</span>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="rounded border border-clinical-200 px-2 py-1"
                placeholder="환자명"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="label-caption">평가일</span>
              <input
                type="date"
                value={assessedDate}
                onChange={(e) => setAssessedDate(e.target.value)}
                className="rounded border border-clinical-200 px-2 py-1"
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-clinical-900">촬영 사진</h2>
          <div className="grid grid-cols-3 gap-2">
            {VIEWS.map((v) => (
              <div key={v} className="text-center">
                {captures[v] ? (
                  <img src={captures[v]!.dataUrl} alt={VIEW_LABELS[v]} className="w-full rounded border border-clinical-200 object-contain" />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center rounded border border-dashed border-clinical-200 text-xs text-clinical-400">
                    사진 없음
                  </div>
                )}
                <p className="label-caption mt-1">{VIEW_LABELS[v]}</p>
              </div>
            ))}
          </div>
          {!hasLiveResults && (
            <p className="mt-2 text-xs text-clinical-400">
              * 새로고침 후에는 사진이 저장되지 않아 표시되지 않을 수 있습니다. 최근 평가 수치는 아래에 유지됩니다.
            </p>
          )}
        </section>

        {summary && (
          <>
            {summary.priorityAreas.length > 0 && (
              <section className="card p-4">
                <h2 className="mb-2 text-sm font-semibold text-clinical-900">우선 확인 영역</h2>
                <ul className="space-y-1 text-sm text-clinical-700">
                  {summary.priorityAreas.map((p) => (
                    <li key={`${p.area}-${p.basedOnMeasurement}`}>
                      {p.area} · {p.basedOnMeasurement}: {p.valueDeg !== null ? `${p.valueDeg}° · ` : ''}
                      {p.reason}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-semibold text-clinical-900">자세 평가 결과</h2>
              <div className="space-y-3">
                {summary.areaResults.map((r) => (
                  <div key={r.area} className="card p-3">
                    <p className="mb-1 text-sm font-medium text-clinical-800">
                      {r.area}{' '}
                      <span className="font-normal text-clinical-400">
                        (신뢰도 {r.confidence !== null ? `${Math.round(r.confidence * 100)}%` : '—'})
                      </span>
                    </p>
                    <p className="text-xs text-clinical-600">{r.observation}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {program && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-clinical-900">운동 프로그램</h2>
            {(['warmup', 'main', 'cooldown'] as const).map((cat) => (
              <div key={cat} className="mb-3">
                <p className="label-caption mb-1">
                  {cat === 'warmup' ? 'Warm-up' : cat === 'main' ? 'Main Exercise' : 'Cool-down'}
                </p>
                <ul className="space-y-1 text-sm text-clinical-700">
                  {program[cat].map((ex, i) => (
                    <li key={i}>
                      {ex.name}
                      {ex.overrides.sets ?? ex.sets ? ` · ${ex.overrides.sets ?? ex.sets}세트` : ''}
                      {ex.overrides.repetitions ?? ex.repetitions ? ` × ${ex.overrides.repetitions ?? ex.repetitions}회` : ''}
                      {ex.overrides.duration ?? ex.duration ? ` · ${ex.overrides.duration ?? ex.duration}` : ''}
                      {ex.precautions ? ` (주의: ${ex.precautions})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {ptNote && (
          <section className="card p-4">
            <h2 className="mb-2 text-sm font-semibold text-clinical-900">PT 평가 메모</h2>
            <p className="whitespace-pre-wrap text-sm text-clinical-700">{ptNote}</p>
          </section>
        )}

        <footer className="border-t border-clinical-200 pt-3 text-center text-xs text-clinical-400">
          본 리포트는 자세 스크리닝 참고 자료이며, 의학적 진단을 대체하지 않습니다.
        </footer>
      </div>
    </div>
  )
}
