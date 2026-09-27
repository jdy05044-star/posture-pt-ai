import { useEffect, useRef } from 'react'
import type { PoseAnalysisResult } from '@/types'
import { POSE_CONNECTIONS } from '@/lib/poseLandmarker'

interface Props {
  imageDataUrl: string
  result: PoseAnalysisResult | null
}

/**
 * 사진 위에 landmark 점과 연결선을 그린다 (요청 스펙 2번 항목).
 * 각도/좌우 차이 수치 표시는 STEP5(각도 계산 엔진)에서 확장한다.
 */
export default function PoseOverlay({ imageDataUrl, result }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      if (!result || result.landmarks.length === 0) return

      const named = result.named
      const toPx = (n: { x: number; y: number }) => ({ x: n.x * canvas.width, y: n.y * canvas.height })

      // 연결선
      ctx.strokeStyle = 'rgba(79, 126, 131, 0.85)' // clinical-500
      ctx.lineWidth = Math.max(2, canvas.width * 0.004)
      for (const [a, b] of POSE_CONNECTIONS) {
        const pa = named[a]
        const pb = named[b]
        if (!pa || !pb) continue
        const p1 = toPx(pa)
        const p2 = toPx(pb)
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }

      // 점
      ctx.fillStyle = '#b7791f' // alert-amber
      for (const lm of Object.values(named)) {
        if (!lm) continue
        const p = toPx(lm)
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(4, canvas.width * 0.006), 0, Math.PI * 2)
        ctx.fill()
      }
    }
    img.src = imageDataUrl
  }, [imageDataUrl, result])

  return (
    <div className="overflow-hidden rounded-lg border border-clinical-200">
      <canvas ref={canvasRef} className="w-full" />
      {result && result.landmarks.length === 0 && (
        <p className="bg-alert-red/10 p-2 text-center text-sm text-alert-red">
          분석 신뢰도가 낮습니다. 다시 촬영해주세요. (인물이 인식되지 않았습니다)
        </p>
      )}
      {result && result.overallConfidence !== null && (
        <p className="label-caption p-2 text-center">
          분석 신뢰도 {Math.round(result.overallConfidence * 100)}%
        </p>
      )}
    </div>
  )
}
