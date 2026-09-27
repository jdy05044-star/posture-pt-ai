import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { Landmark, LandmarkName, PoseAnalysisResult, ViewType } from '@/types'

// MediaPipe Pose 33개 랜드마크 중, 이 앱에서 실제로 사용하는 인덱스만 매핑한다.
// 참고: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
const LANDMARK_INDEX: Record<LandmarkName, number> = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftFootIndex: 31,
  rightFootIndex: 32
}

// 오버레이에 그릴 뼈대 연결선 (랜드마크 이름 쌍)
export const POSE_CONNECTIONS: [LandmarkName, LandmarkName][] = [
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['leftAnkle', 'leftFootIndex'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
  ['rightAnkle', 'rightFootIndex']
]

let landmarkerPromise: Promise<PoseLandmarker> | null = null

/**
 * PoseLandmarker 모델을 최초 1회만 로드하고 재사용한다.
 * wasm 런타임과 모델 파일은 Google이 호스팅하는 CDN에서 가져온다.
 * (네트워크 환경이 막혀 있으면 이 단계에서 실패하므로, 사용처에서 에러 메시지를 사용자에게 안내해야 한다.)
 */
async function getLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'IMAGE',
        numPoses: 1
      })
    })()
  }
  return landmarkerPromise
}

function toNamedLandmarks(landmarks: Landmark[]): Partial<Record<LandmarkName, Landmark>> {
  const named: Partial<Record<LandmarkName, Landmark>> = {}
  for (const [name, idx] of Object.entries(LANDMARK_INDEX) as [LandmarkName, number][]) {
    if (landmarks[idx]) named[name] = landmarks[idx]
  }
  return named
}

/**
 * dataUrl 이미지 한 장을 분석해서 랜드마크를 반환한다.
 * 사람이 인식되지 않으면 landmarks가 빈 배열로 반환되므로, 호출부에서
 * "측정 불확실" 처리를 해야 한다 (임의의 값을 만들어내지 않는다).
 */
export async function analyzePose(view: ViewType, dataUrl: string): Promise<PoseAnalysisResult> {
  const landmarker = await getLandmarker()
  const image = await loadImage(dataUrl)
  const result = landmarker.detect(image)

  const first = result.landmarks[0]
  const worldFirst = result.worldLandmarks?.[0]

  if (!first) {
    return {
      view,
      landmarks: [],
      named: {},
      overallConfidence: null,
      analyzedAt: new Date().toISOString()
    }
  }

  // MediaPipe Tasks Vision의 PoseLandmarkerResult는 랜드마크별 신뢰도(visibility)를 제공한다.
  // 전체 신뢰도는 사용된 주요 랜드마크의 visibility 평균으로 계산하며, 값이 없으면 null로 둔다.
  const visibilities = first
    .map((lm) => lm.visibility)
    .filter((v): v is number => typeof v === 'number')
  const overallConfidence = visibilities.length
    ? visibilities.reduce((a, b) => a + b, 0) / visibilities.length
    : null

  void worldFirst // 향후 3D 각도 계산(STEP5)에서 world landmark를 사용할 수 있어 참조만 유지

  return {
    view,
    landmarks: first,
    named: toNamedLandmarks(first),
    overallConfidence,
    analyzedAt: new Date().toISOString()
  }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}
