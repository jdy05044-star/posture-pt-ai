import type { AngleMeasurement, AssessmentSummary, Landmark, LandmarkName, PoseAnalysisResult } from '@/types'

const RAD2DEG = 180 / Math.PI

/** 두 landmark의 visibility 평균. 둘 다 없으면 null. */
function avgConfidence(...lms: (Landmark | undefined)[]): number | null {
  const vals = lms.filter((l): l is Landmark => !!l && typeof l.visibility === 'number').map((l) => l.visibility!)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function get(named: PoseAnalysisResult['named'], name: LandmarkName): Landmark | undefined {
  return named[name]
}

/**
 * 수평선 대비 두 점의 기울기(도). 이미지 좌표는 y가 아래로 증가한다.
 * 양수 = b가 a보다 더 아래(낮음), 음수 = b가 a보다 더 위(높음)
 */
function tiltFromHorizontal(a: Landmark, b: Landmark): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * RAD2DEG
}

/** 수직선(중력선) 대비 두 점을 잇는 선의 기울기 크기(도). 방향은 별도로 해석해야 한다. */
function leanFromVertical(top: Landmark, bottom: Landmark): number {
  const dx = top.x - bottom.x
  const dy = top.y - bottom.y
  // 수직 기준(0,-1)과의 각도
  return Math.atan2(Math.abs(dx), Math.abs(dy)) * RAD2DEG
}

interface BuildArgs {
  id: string
  label: string
  area: AngleMeasurement['area']
}

function unavailable(args: BuildArgs, reason: string): AngleMeasurement {
  return { ...args, valueDeg: null, direction: null, confidence: null, unavailableReason: reason }
}

/** 정면/후면 사진에서 계산 가능한 좌우 비대칭 측정값들 */
export function computeFrontalMeasurements(result: PoseAnalysisResult): AngleMeasurement[] {
  const n = result.named
  const out: AngleMeasurement[] = []

  // 어깨 높이 차이
  {
    const args: BuildArgs = { id: 'shoulder-tilt', label: '좌우 어깨 높이 차이', area: '어깨' }
    const l = get(n, 'leftShoulder')
    const r = get(n, 'rightShoulder')
    if (l && r) {
      const deg = tiltFromHorizontal(l, r)
      out.push({
        ...args,
        valueDeg: Math.round(Math.abs(deg) * 10) / 10,
        direction: deg > 0 ? '우측 어깨가 더 낮음' : deg < 0 ? '좌측 어깨가 더 낮음' : '좌우 차이 거의 없음',
        confidence: avgConfidence(l, r)
      })
    } else {
      out.push(unavailable(args, '양쪽 어깨 landmark가 인식되지 않았습니다'))
    }
  }

  // 골반 높이 차이
  {
    const args: BuildArgs = { id: 'pelvis-tilt', label: '좌우 골반 높이 차이', area: '골반' }
    const l = get(n, 'leftHip')
    const r = get(n, 'rightHip')
    if (l && r) {
      const deg = tiltFromHorizontal(l, r)
      out.push({
        ...args,
        valueDeg: Math.round(Math.abs(deg) * 10) / 10,
        direction: deg > 0 ? '우측 골반이 더 낮음' : deg < 0 ? '좌측 골반이 더 낮음' : '좌우 차이 거의 없음',
        confidence: avgConfidence(l, r)
      })
    } else {
      out.push(unavailable(args, '양쪽 골반 landmark가 인식되지 않았습니다'))
    }
  }

  // 머리 중심선 편차 (어깨 중점 대비 코의 좌우 치우침)
  {
    const args: BuildArgs = { id: 'head-shift', label: '머리 중심선 편차', area: '머리/목' }
    const nose = get(n, 'nose')
    const ls = get(n, 'leftShoulder')
    const rs = get(n, 'rightShoulder')
    if (nose && ls && rs) {
      const shoulderWidth = Math.abs(rs.x - ls.x) || 1
      const midX = (ls.x + rs.x) / 2
      const offsetRatio = (nose.x - midX) / shoulderWidth // 어깨너비 대비 비율
      const offsetPct = Math.round(offsetRatio * 1000) / 10 // %
      out.push({
        ...args,
        valueDeg: null, // 각도가 아니라 비율 지표이므로 valueDeg는 사용하지 않음(정직하게 null)
        direction:
          Math.abs(offsetPct) < 3
            ? '중심선 근처'
            : offsetPct > 0
              ? `중심선 기준 우측으로 약 ${Math.abs(offsetPct)}% 치우침 (어깨너비 대비)`
              : `중심선 기준 좌측으로 약 ${Math.abs(offsetPct)}% 치우침 (어깨너비 대비)`,
        confidence: avgConfidence(nose, ls, rs)
      })
    } else {
      out.push(unavailable(args, '코 또는 어깨 landmark가 인식되지 않았습니다'))
    }
  }

  // 무릎 정렬 (고관절-발목을 잇는 선 대비 무릎의 좌우 편차)
  for (const side of ['left', 'right'] as const) {
    const label = side === 'left' ? '좌측 무릎 정렬' : '우측 무릎 정렬'
    const args: BuildArgs = { id: `knee-alignment-${side}`, label, area: '무릎' }
    const hip = get(n, side === 'left' ? 'leftHip' : 'rightHip')
    const knee = get(n, side === 'left' ? 'leftKnee' : 'rightKnee')
    const ankle = get(n, side === 'left' ? 'leftAnkle' : 'rightAnkle')
    if (hip && knee && ankle) {
      // 고관절-발목 직선에서 무릎이 안쪽(-)/바깥쪽(+)으로 얼마나 벗어났는지, 다리 길이 대비 비율로 계산
      const legLength = Math.hypot(ankle.x - hip.x, ankle.y - hip.y) || 1
      // 점과 직선 사이 거리 (2D 외적 이용)
      const cross = (ankle.x - hip.x) * (knee.y - hip.y) - (ankle.y - hip.y) * (knee.x - hip.x)
      const distRatio = cross / legLength
      const pct = Math.round((distRatio / legLength) * 1000) / 10
      out.push({
        ...args,
        valueDeg: null,
        direction:
          Math.abs(pct) < 2
            ? '고관절-발목 연결선 근처 (정렬 양호 범위)'
            : `고관절-발목 연결선 기준 ${pct > 0 ? '바깥쪽' : '안쪽'}으로 편차 관찰 (다리 길이 대비 약 ${Math.abs(pct)}%)`,
        confidence: avgConfidence(hip, knee, ankle)
      })
    } else {
      out.push(unavailable(args, '고관절/무릎/발목 landmark가 인식되지 않았습니다'))
    }
  }

  // 발 방향 (발목-발끝 라인이 좌우로 벌어진 정도. 실제 좌우 회전(내/외회전) 방향까지는
  // 2D 정면 사진만으로 신뢰도 있게 판단하기 어려워, 벌어진 정도(각도)만 참고용으로 제공한다.)
  for (const side of ['left', 'right'] as const) {
    const label = side === 'left' ? '좌측 발 방향' : '우측 발 방향'
    const args: BuildArgs = { id: `foot-angle-${side}`, label, area: '발' }
    const ankle = get(n, side === 'left' ? 'leftAnkle' : 'rightAnkle')
    const footIndex = get(n, side === 'left' ? 'leftFootIndex' : 'rightFootIndex')
    if (ankle && footIndex) {
      const dx = footIndex.x - ankle.x
      const dy = footIndex.y - ankle.y
      const angle = Math.atan2(Math.abs(dx), Math.abs(dy) || 0.0001) * RAD2DEG
      out.push({
        ...args,
        valueDeg: Math.round(angle * 10) / 10,
        direction:
          angle < 15
            ? '발끝이 발목 기준 정면 방향에 가깝게 관찰됨'
            : '발끝이 발목 기준 좌우로 벌어져 있음 (정확한 방향은 2D 정면 사진만으로 단정하기 어려워 벌어진 정도만 참고용으로 제공)',
        confidence: avgConfidence(ankle, footIndex)
      })
    } else {
      out.push(unavailable(args, '발목 또는 발끝 landmark가 인식되지 않았습니다'))
    }
  }

  return out
}

/** 측면 사진에서 계산 가능한 정렬 측정값들 */
export function computeSagittalMeasurements(result: PoseAnalysisResult): AngleMeasurement[] {
  const n = result.named
  const out: AngleMeasurement[] = []

  // forward head: 귀-어깨 라인이 수직선에서 벗어난 정도
  {
    const args: BuildArgs = { id: 'forward-head', label: '귀-어깨 정렬 (forward head 관련)', area: '머리/목' }
    // 측면 사진은 좌/우 중 카메라에 보이는 쪽만 인식되므로 둘 중 존재하는 쪽을 사용
    const ear = get(n, 'leftEar') ?? get(n, 'rightEar')
    const shoulder = get(n, 'leftShoulder') ?? get(n, 'rightShoulder')
    if (ear && shoulder) {
      const deg = leanFromVertical(ear, shoulder)
      out.push({
        ...args,
        valueDeg: Math.round(deg * 10) / 10,
        direction:
          deg < 5
            ? '귀가 어깨 위 수직선에 가까움'
            : '귀가 어깨보다 수평 방향으로 벗어나 있음 (forward head 경향 관찰)',
        confidence: avgConfidence(ear, shoulder)
      })
    } else {
      out.push(unavailable(args, '귀 또는 어깨 landmark가 인식되지 않았습니다'))
    }
  }

  // 몸통 기울기: 어깨-고관절 라인이 수직선에서 벗어난 정도
  {
    const args: BuildArgs = { id: 'trunk-inclination', label: '몸통 기울기', area: '허리/몸통' }
    const shoulder = get(n, 'leftShoulder') ?? get(n, 'rightShoulder')
    const hip = get(n, 'leftHip') ?? get(n, 'rightHip')
    if (shoulder && hip) {
      const deg = leanFromVertical(shoulder, hip)
      out.push({
        ...args,
        valueDeg: Math.round(deg * 10) / 10,
        direction: deg < 5 ? '수직선에 가까움' : '몸통이 수직선에서 벗어나 있음 (전후 기울기 관찰)',
        confidence: avgConfidence(shoulder, hip)
      })
    } else {
      out.push(unavailable(args, '어깨 또는 고관절 landmark가 인식되지 않았습니다'))
    }
  }

  // 무릎 굴곡/과신전: 고관절-무릎-발목 각도 (180도에 가까울수록 편 상태)
  {
    const args: BuildArgs = { id: 'knee-flex-angle', label: '무릎 굽힘/폄 각도', area: '무릎' }
    const hip = get(n, 'leftHip') ?? get(n, 'rightHip')
    const knee = get(n, 'leftKnee') ?? get(n, 'rightKnee')
    const ankle = get(n, 'leftAnkle') ?? get(n, 'rightAnkle')
    if (hip && knee && ankle) {
      const v1 = { x: hip.x - knee.x, y: hip.y - knee.y }
      const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y }
      const dot = v1.x * v2.x + v1.y * v2.y
      const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1
      const angle = Math.acos(Math.min(1, Math.max(-1, dot / mag))) * RAD2DEG
      out.push({
        ...args,
        valueDeg: Math.round(angle * 10) / 10,
        direction:
          angle > 182
            ? '무릎이 일반적인 범위보다 더 펴져 보임 (과신전 경향 관찰)'
            : angle < 170
              ? '무릎이 굽혀진 상태로 관찰됨'
              : '무릎이 편 자세에 가깝게 관찰됨',
        confidence: avgConfidence(hip, knee, ankle)
      })
    } else {
      out.push(unavailable(args, '고관절/무릎/발목 landmark가 인식되지 않았습니다'))
    }
  }

  // 골반 전후경사·등 굽음(흉추 후만)은 MediaPipe Pose의 자동 landmark만으로는 계산할 수 없어
  // (ASIS/PSIS·등뼈 위 지점이 제공되지 않음) 여기서는 다루지 않는다.
  // 대신 PT가 사진 위에 직접 표시한 기준점을 사용하는 computeManualSagittalMeasurements
  // (src/assessment/manualMeasurements.ts)에서 계산하며, assessmentEngine이 이 결과와 합쳐준다.

  return out
}

/**
 * 측면 사진 위에 라벨을 겹쳐 보여줄 때 기준이 되는 측정값 id 목록.
 * pelvic-tilt-sagittal · thoracic-kyphosis는 자동 landmark가 아니라 PT가 직접 표시한 기준점으로
 * 계산되는 값이라, computeSagittalMeasurements가 아닌 computeManualSagittalMeasurements가 만들어낸다
 * (assessmentEngine에서 합쳐짐). id 목록에는 함께 포함해 다른 측정값과 동일하게 취급한다.
 */
export const SAGITTAL_MEASUREMENT_IDS = [
  'forward-head',
  'trunk-inclination',
  'knee-flex-angle',
  'pelvic-tilt-sagittal',
  'thoracic-kyphosis'
]

/** 정면 사진 위에 라벨을 겹쳐 보여줄 때 기준이 되는 측정값 id 목록 */
export const FRONTAL_MEASUREMENT_IDS = [
  'head-shift',
  'shoulder-tilt',
  'pelvis-tilt',
  'knee-alignment-left',
  'knee-alignment-right',
  'foot-angle-left',
  'foot-angle-right'
]

/**
 * 후면 사진 위에 라벨을 겹쳐 보여줄 때 기준이 되는 측정값 id 목록.
 * assessmentEngine이 후면 결과의 id 끝에 '-back'을 붙여서 저장하기 때문에 별도 목록으로 관리한다.
 */
export const BACK_MEASUREMENT_IDS = FRONTAL_MEASUREMENT_IDS.map((id) => `${id}-back`)

/**
 * AssessmentSummary(영역별로 묶인 결과)에서 특정 id 목록에 해당하는 측정값만 순서대로 뽑아낸다.
 * 사진 위 오버레이(MeasurementOverlay)에 넘길 때 사용한다.
 */
export function extractMeasurements(summary: AssessmentSummary, ids: string[]): AngleMeasurement[] {
  const all = summary.areaResults.flatMap((r) => r.measurements)
  return ids
    .map((id) => all.find((m) => m.id === id))
    .filter((m): m is AngleMeasurement => !!m)
}
