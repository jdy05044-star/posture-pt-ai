import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PoseOverlay from '@/components/PoseOverlay'
import { analyzePose } from '@/lib/poseLandmarker'
import { useAppState } from '@/state/AppState'
import { VIEW_LABELS, type ViewType } from '@/types'

const VIEWS: ViewType[] = ['front', 'side', 'back']

export default function Analyze() {
  const { captures, results, setResult } = useAppState()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'loading-model' | 'analyzing' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // 세 장이 모두 없으면 촬영 화면으로 돌려보낸다
    if (VIEWS.some((v) => !captures[v])) {
      navigate('/capture')
      return
    }

    let cancelled = false

    async function run() {
      setStatus('loading-model')
      setErrorMessage(null)
      try {
        for (const view of VIEWS) {
          if (cancelled) return
          setStatus('analyzing')
          const image = captures[view]
          if (!image) continue
          const result = await analyzePose(view, image.dataUrl)
          if (cancelled) return
          setResult(view, result)
        }
        if (!cancelled) setStatus('done')
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setErrorMessage(
            'Pose 분석 모델을 불러오지 못했습니다. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.'
          )
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-1 text-lg font-semibold text-clinical-900">자세 분석</h2>
      <p className="mb-6 text-sm text-clinical-600">
        {status === 'loading-model' && '분석 모델을 불러오는 중입니다...'}
        {status === 'analyzing' && '사진에서 주요 관절 위치를 분석하는 중입니다...'}
        {status === 'done' && '분석이 완료되었습니다. landmark를 확인해주세요.'}
        {status === 'error' && errorMessage}
      </p>

      <div className="space-y-6">
        {VIEWS.map((view) => {
          const image = captures[view]
          if (!image) return null
          return (
            <div key={view}>
              <p className="label-caption mb-2">{VIEW_LABELS[view]}</p>
              <PoseOverlay imageDataUrl={image.dataUrl} result={results[view]} />
            </div>
          )
        })}
      </div>

      {status === 'error' && (
        <button onClick={() => window.location.reload()} className="btn-secondary mt-6 w-full py-3">
          다시 시도
        </button>
      )}

      {status === 'done' && (
        <button onClick={() => navigate('/result')} className="btn-primary mt-8 w-full py-4 text-base">
          자세 평가 결과 보기
        </button>
      )}
    </div>
  )
}
