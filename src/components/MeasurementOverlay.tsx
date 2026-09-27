import { AREA_COLORS } from '@/lib/areaColors'
import type { AngleMeasurement, Landmark, PoseAnalysisResult } from '@/types'

interface Props {
  imageDataUrl: string
  result: PoseAnalysisResult | null
  measurements: AngleMeasurement[]
  /** 체형 측정용 격자보드처럼 사진 위에 가로·세로 기준선을 깔아 보여줄지 여부 (기본 true) */
  showGrid?: boolean
}

function pct(n: number) {
  return `${Math.max(0, Math.min(100, n * 100))}%`
}

/** 10% 간격의 격자선 위치 (가장자리 제외 9개 선) */
const GRID_LINES = Array.from({ length: 9 }, (_, i) => (i + 1) * 10)

/**
 * 측정값을 해당 landmark 위치에 라벨로 겹쳐 보여줄 때, 어떤 landmark를 기준점으로 삼을지 매핑한다.
 * (측면 사진 기준 측정값 id들과 짝지어져 있음 — angleCalculations.ts의 computeSagittalMeasurements 참고)
 */
function anchorFor(named: PoseAnalysisResult['named'], measurementId: string): Landmark | undefined {
  // 후면 측정값은 assessmentEngine에서 id 끝에 '-back'을 붙여서 만들어지므로, 매핑 시 원래 id로 되돌려서 비교한다.
  const baseId = measurementId.replace(/-back$/, '')
  switch (baseId) {
    // 측면(sagittal) 측정값
    case 'forward-head':
      return named.leftEar ?? named.rightEar
    case 'trunk-inclination':
      return named.leftShoulder ?? named.rightShoulder
    case 'knee-flex-angle':
      return named.leftKnee ?? named.rightKnee
    case 'pelvic-tilt-sagittal':
      return named.leftHip ?? named.rightHip
    // 정면/후면(frontal) 측정값
    case 'head-shift':
      return named.nose
    case 'shoulder-tilt':
      return named.leftShoulder
    case 'pelvis-tilt':
      return named.leftHip
    case 'knee-alignment-left':
      return named.leftKnee
    case 'knee-alignment-right':
      return named.rightKnee
    case 'foot-angle-left':
      return named.leftFootIndex
    case 'foot-angle-right':
      return named.rightFootIndex
    default:
      return undefined
  }
}

/**
 * 사진 위에 수직 기준선(추선)과 측정값 라벨을 겹쳐서 보여주는 컴포넌트.
 * PT가 한눈에 "어느 지점에서 얼마나 벗어났는지"를 볼 수 있게 하기 위한 것이며,
 * 실제 landmark 좌표를 기반으로만 라벨을 배치한다 — 위치나 수치를 임의로 만들어내지 않는다.
 * landmark가 인식되지 않은 측정값(valueDeg === null)은 사진 위에는 표시하지 않고,
 * 별도 텍스트 목록(측정 불확실)으로만 안내한다.
 */
export default function MeasurementOverlay({ imageDataUrl, result, measurements, showGrid = true }: Props) {
  const named = result?.named
  const hasLandmarks = !!result && result.landmarks.length > 0

  const plumbAnchor = named ? named.leftEar ?? named.rightEar ?? named.nose : undefined
  const shownMeasurements = hasLandmarks && named ? measurements.filter((m) => anchorFor(named, m.id)) : []
  const uncertainMeasurements = measurements.filter((m) => m.valueDeg === null && m.unavailableReason)

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-clinical-200 bg-clinical-50">
        <img src={imageDataUrl} alt="측면 사진 측정 오버레이" className="block w-full select-none" />

        {showGrid && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {GRID_LINES.map((p) => (
              <g key={p}>
                <line x1={p} y1={0} x2={p} y2={100} stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
                <line x1={0} y1={p} x2={100} y2={p} stroke="rgba(255,255,255,0.4)" strokeWidth={0.3} />
              </g>
            ))}
          </svg>
        )}

        {hasLandmarks && plumbAnchor && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 border-l border-dashed border-alert-amber/90"
            style={{ left: pct(plumbAnchor.x) }}
            aria-hidden
          />
        )}

        {hasLandmarks &&
          named &&
          shownMeasurements.map((m) => {
            const anchor = anchorFor(named, m.id)
            if (!anchor) return null
            const description = m.direction ?? m.label
            const dotColor = AREA_COLORS[m.area]
            // landmark가 사진 왼쪽 절반에 있으면 라벨을 왼쪽으로, 오른쪽 절반이면 오른쪽으로 붙여서
            // 라벨끼리 겹치는 것을 줄인다 (정면 사진처럼 라벨이 여러 개인 경우 대비)
            const onLeftHalf = anchor.x < 0.5
            return (
              <div
                key={m.id}
                className={`pointer-events-none absolute flex max-w-[58%] -translate-y-1/2 items-center gap-1.5 ${
                  onLeftHalf ? 'flex-row-reverse text-right' : ''
                }`}
                style={{
                  left: onLeftHalf ? undefined : pct(Math.min(0.95, anchor.x + 0.035)),
                  right: onLeftHalf ? `${100 - Math.max(5, anchor.x * 100 - 3.5)}%` : undefined,
                  top: pct(anchor.y)
                }}
              >
                <span
                  className="h-1.5 w-1.5 flex-none rounded-full ring-2 ring-white"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="h-px w-3 flex-none bg-white/80" />
                <span
                  className="rounded px-1.5 py-1 text-[10px] font-medium leading-snug text-white shadow"
                  style={{ backgroundColor: `${dotColor}d9` }}
                >
                  {m.label}
                  {m.valueDeg !== null ? ` (${m.valueDeg}°)` : ''}
                  <br />
                  <span className="font-normal text-white/90">{description}</span>
                </span>
              </div>
            )
          })}

        {!hasLandmarks && (
          <p className="bg-alert-red/10 p-2 text-center text-sm text-alert-red">
            분석 신뢰도가 낮습니다. 다시 촬영해주세요. (인물이 인식되지 않았습니다)
          </p>
        )}
      </div>

      {hasLandmarks && uncertainMeasurements.length > 0 && (
        <p className="label-caption mt-2">
          측정 불확실: {uncertainMeasurements.map((m) => m.label).join(', ')} — 필요한 관절 지점이 인식되지 않았습니다.
        </p>
      )}
    </div>
  )
}
