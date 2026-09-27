import { useState, type MouseEvent } from 'react'
import type { ManualSideLandmarks } from '@/types'

interface Props {
  imageDataUrl: string
  value: ManualSideLandmarks
  onChange: (next: ManualSideLandmarks) => void
}

type PointKey = keyof ManualSideLandmarks

const POINT_ORDER: { key: PointKey; label: string; shortLabel: string; hint: string }[] = [
  { key: 'asis', label: 'ASIS (골반 앞쪽)', shortLabel: 'ASIS', hint: '전상장골극 — 골반 앞쪽에서 만져지는 뼈 돌출 지점' },
  { key: 'psis', label: 'PSIS (골반 뒤쪽)', shortLabel: 'PSIS', hint: '후상장골극 — 골반 뒤쪽(엉덩이 보조개 부위) 뼈 돌출 지점' },
  { key: 'c7', label: 'C7 (목뼈 7번)', shortLabel: 'C7', hint: '고개를 숙였을 때 목 뒤에서 가장 튀어나오는 뼈' },
  { key: 'kyphosisApex', label: '흉추 정점', shortLabel: '흉추정점', hint: '등이 가장 뒤로 굽어 보이는 지점' },
  { key: 't12', label: 'T12 (흉요추 경계)', shortLabel: 'T12', hint: '등뼈에서 허리뼈로 넘어가는 부근' }
]

/**
 * 측면 사진 위에 PT가 직접 탭해서 골반(ASIS/PSIS)·등뼈(C7/흉추정점/T12) 기준점을 표시하는 컴포넌트.
 *
 * MediaPipe Pose 같은 자동 landmark 인식은 관절 중심점만 제공하고, 옷 위로 만져서 확인하는
 * 골반뼈·등뼈 지점은 제공하지 않는다. 그래서 골반 전후경사·등 굽음(흉추 후만)은 PT가 직접
 * 짚어주는 방식을 쓴다 — 점을 찍지 않으면 다른 자동 측정값과 마찬가지로 "측정 불확실"로 남는다.
 */
export default function ManualSideLandmarkEditor({ imageDataUrl, value, onChange }: Props) {
  const [activeKey, setActiveKey] = useState<PointKey | null>(null)

  const handleTap = (e: MouseEvent<HTMLDivElement>) => {
    if (!activeKey) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    const next = { ...value, [activeKey]: { x, y } }
    onChange(next)
    // 아직 찍지 않은 다음 지점으로 자동 이동 (순서대로 안내)
    const nextUnset = POINT_ORDER.find((p) => !next[p.key])
    setActiveKey(nextUnset ? nextUnset.key : null)
  }

  const handleReset = () => {
    onChange({})
    setActiveKey(POINT_ORDER[0].key)
  }

  const placedCount = POINT_ORDER.filter((p) => !!value[p.key]).length

  return (
    <div>
      <p className="mb-2 text-xs text-clinical-500">
        골반·등 기준점은 자동으로 인식하기 어려운 지점이라, 아래 버튼에서 지점을 선택한 뒤 사진 위 해당 위치를
        탭해서 직접 표시해주세요. 표시한 지점만큼만 골반 전후경사·등 굽음 정도가 계산됩니다.
      </p>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {POINT_ORDER.map((p) => {
          const isSet = !!value[p.key]
          const isActive = activeKey === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActiveKey(p.key)}
              title={p.hint}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-clinical-700 bg-clinical-700 text-white'
                  : isSet
                    ? 'border-clinical-300 bg-clinical-100 text-clinical-700'
                    : 'border-clinical-200 bg-white text-clinical-500'
              }`}
            >
              {isSet ? '✓ ' : ''}
              {p.label}
            </button>
          )
        })}
      </div>

      {activeKey && (
        <p className="mb-2 text-xs font-medium text-alert-amber">
          "{POINT_ORDER.find((p) => p.key === activeKey)?.label}" 위치를 사진에서 탭해주세요 —{' '}
          {POINT_ORDER.find((p) => p.key === activeKey)?.hint}
        </p>
      )}

      <div
        className={`relative overflow-hidden rounded-lg border border-clinical-200 bg-clinical-50 ${
          activeKey ? 'cursor-crosshair' : ''
        }`}
        onClick={handleTap}
      >
        <img src={imageDataUrl} alt="측면 사진 — 골반/등 기준점 표시" className="block w-full select-none" />
        {POINT_ORDER.map((p) => {
          const pt = value[p.key]
          if (!pt) return null
          return (
            <div
              key={p.key}
              className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
            >
              <span className="h-3 w-3 rounded-full border-2 border-white bg-alert-amber shadow" />
              <span className="mt-0.5 whitespace-nowrap rounded bg-clinical-900/80 px-1 py-0.5 text-[9px] font-medium text-white">
                {p.shortLabel}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-clinical-500">
          {placedCount} / {POINT_ORDER.length}개 지점 표시됨
        </p>
        <button type="button" onClick={handleReset} className="text-xs font-medium text-clinical-500 underline">
          초기화
        </button>
      </div>
    </div>
  )
}
