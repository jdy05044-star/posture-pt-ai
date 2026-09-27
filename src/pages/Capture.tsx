import { useNavigate } from 'react-router-dom'
import PhotoCapture from '@/components/PhotoCapture'
import { useAppState } from '@/state/AppState'
import type { ViewType } from '@/types'

const VIEWS: ViewType[] = ['front', 'side', 'back']

export default function Capture() {
  const { captures, setCapture } = useAppState()
  const navigate = useNavigate()

  const allCaptured = VIEWS.every((v) => captures[v] !== null)

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-1 text-lg font-semibold text-clinical-900">사진 촬영</h2>
      <p className="mb-6 text-sm text-clinical-600">정면 · 측면 · 후면 순서로 촬영하거나 업로드해주세요.</p>

      <div className="space-y-4">
        {VIEWS.map((view) => (
          <PhotoCapture
            key={view}
            view={view}
            value={captures[view]}
            onChange={(img) => setCapture(view, img)}
          />
        ))}
      </div>

      <button
        onClick={() => navigate('/analyze')}
        disabled={!allCaptured}
        className="btn-primary mt-8 w-full py-4 text-base"
      >
        {allCaptured ? '자세 분석 시작' : `사진 ${VIEWS.filter((v) => !captures[v]).length}장 더 필요합니다`}
      </button>
    </div>
  )
}
