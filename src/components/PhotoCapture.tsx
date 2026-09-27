import { useRef, useState } from 'react'
import type { CaptureImage, ViewType } from '@/types'
import { CAPTURE_GUIDES, VIEW_LABELS } from '@/types'
import { fileToDataUrl, useCameraStream } from './useCameraStream'

interface Props {
  view: ViewType
  value: CaptureImage | null
  onChange: (image: CaptureImage | null) => void
}

export default function PhotoCapture({ view, value, onChange }: Props) {
  const [mode, setMode] = useState<'idle' | 'camera'>('idle')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { videoRef, isActive, error, start, stop, capture } = useCameraStream()

  const [selfCheck, setSelfCheck] = useState({
    fullBodyInFrame: false,
    cameraLevel: false,
    leftRightClear: false
  })

  const allChecked = selfCheck.fullBodyInFrame && selfCheck.cameraLevel && selfCheck.leftRightClear

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    commitImage(dataUrl)
    e.target.value = ''
  }

  async function handleOpenCamera() {
    setMode('camera')
    await start()
  }

  function handleCaptureShot() {
    const dataUrl = capture()
    if (dataUrl) {
      commitImage(dataUrl)
      stop()
      setMode('idle')
    }
  }

  function commitImage(dataUrl: string) {
    onChange({
      view,
      dataUrl,
      capturedAt: new Date().toISOString(),
      selfCheck
    })
  }

  function handleRetake() {
    onChange(null)
    setSelfCheck({ fullBodyInFrame: false, cameraLevel: false, leftRightClear: false })
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-clinical-900">{VIEW_LABELS[view]} 촬영</h3>
        {value && (
          <button onClick={handleRetake} className="text-sm font-medium text-clinical-500 hover:text-clinical-700">
            삭제 · 다시 촬영
          </button>
        )}
      </div>

      {!value && (
        <ul className="mb-4 space-y-1 text-sm text-clinical-600">
          {CAPTURE_GUIDES[view].map((g) => (
            <li key={g} className="flex gap-2">
              <span className="text-clinical-400">·</span>
              {g}
            </li>
          ))}
        </ul>
      )}

      {value ? (
        <img
          src={value.dataUrl}
          alt={`${VIEW_LABELS[view]} 촬영 사진`}
          className="mx-auto max-h-96 w-full rounded-lg border border-clinical-200 object-contain"
        />
      ) : mode === 'camera' ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-clinical-200 bg-clinical-950">
            <video ref={videoRef} playsInline muted className="mx-auto max-h-96 w-full object-contain" />
            {/* 수평/좌우 가이드 라인 오버레이 */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/30" />
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/20" />
            </div>
          </div>
          {error && <p className="text-sm text-alert-red">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCaptureShot}
              disabled={!isActive}
              className="btn-primary flex-1"
            >
              촬영하기
            </button>
            <button
              onClick={() => {
                stop()
                setMode('idle')
              }}
              className="btn-secondary"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={handleOpenCamera} className="btn-primary flex-1">
            카메라로 촬영
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary flex-1">
            사진 업로드
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {value && !allChecked && (
        <div className="mt-4 space-y-2 rounded-lg bg-clinical-50 p-3">
          <p className="label-caption">촬영 확인 (자가 체크)</p>
          <CheckRow
            checked={selfCheck.fullBodyInFrame}
            onToggle={() =>
              setSelfCheck((s) => ({ ...s, fullBodyInFrame: !s.fullBodyInFrame }))
            }
            label="전신이 사진 안에 들어왔나요?"
          />
          <CheckRow
            checked={selfCheck.cameraLevel}
            onToggle={() => setSelfCheck((s) => ({ ...s, cameraLevel: !s.cameraLevel }))}
            label="카메라가 수평으로 촬영되었나요?"
          />
          <CheckRow
            checked={selfCheck.leftRightClear}
            onToggle={() =>
              setSelfCheck((s) => ({ ...s, leftRightClear: !s.leftRightClear }))
            }
            label="좌우가 명확하게 구분되나요?"
          />
        </div>
      )}
    </div>
  )
}

function CheckRow({
  checked,
  onToggle,
  label
}: {
  checked: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-clinical-700">
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 rounded border-clinical-300" />
      {label}
    </label>
  )
}
