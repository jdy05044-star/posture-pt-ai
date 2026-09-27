import type { AngleMeasurement, ManualPoint, ManualSideLandmarks } from '@/types'

const RAD2DEG = 180 / Math.PI

/**
 * PT가 측면 사진 위에 직접 표시한 기준점(ASIS/PSIS, C7·흉추정점·T12)을 바탕으로
 * 골반 전후경사·등 굽음(흉추 후만) 정도를 계산한다.
 *
 * 자동 pose 인식이 아니라 PT가 직접 지정한 좌표만 사용하며, 점을 찍지 않은 항목은
 * 다른 자동 측정값과 동일한 원칙으로 정직하게 "측정 불확실"로 남긴다 — 임의로 값을 채우지 않는다.
 */

function angleFromHorizontal(a: ManualPoint, b: ManualPoint): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * RAD2DEG
}

/** vertex를 꼭짓점으로 하는 p1-vertex-p2 각도 (도). 세 점이 일직선이면 180도에 가깝다. */
function angleAt(vertex: ManualPoint, p1: ManualPoint, p2: ManualPoint): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y }
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1
  return Math.acos(Math.min(1, Math.max(-1, dot / mag))) * RAD2DEG
}

/** 골반 전후경사 (ASIS-PSIS 라인 기준). ASIS·PSIS 둘 다 찍혀야 계산된다. */
export function computePelvicTiltFromManualPoints(manual: ManualSideLandmarks | null | undefined): AngleMeasurement {
  const base = { id: 'pelvic-tilt-sagittal', label: '골반 전후 경사 (PT 지정)', area: '골반' as const }
  const asis = manual?.asis
  const psis = manual?.psis

  if (!asis || !psis) {
    return {
      ...base,
      valueDeg: null,
      direction: null,
      confidence: null,
      unavailableReason:
        '골반 전후경사는 ASIS(전상장골극)·PSIS(후상장골극) 위치를 PT가 사진 위에 직접 표시해야 계산됩니다 (미표시 — 측정 불확실)'
    }
  }

  const deg = angleFromHorizontal(asis, psis)
  const absDeg = Math.round(Math.abs(deg) * 10) / 10
  // 이미지 좌표는 y가 아래로 증가한다. 측면 사진에서 ASIS가 PSIS보다 더 아래(낮음)일수록 골반이
  // 앞으로 기운 경향으로, 반대로 PSIS가 더 아래일수록 골반이 뒤로 기운 경향으로 해석하는 것이
  // 일반적으로 통용되는 관례다. "정상 범위"를 단정하지 않고, 관찰된 방향만 서술한다.
  const direction =
    absDeg < 3
      ? 'ASIS-PSIS 라인이 수평에 가까움'
      : asis.y > psis.y
        ? '골반이 앞으로 기운 경향 (ASIS가 PSIS보다 낮게 위치)'
        : '골반이 뒤로 기운 경향 (PSIS가 ASIS보다 낮게 위치)'

  return {
    ...base,
    valueDeg: absDeg,
    direction,
    // PT가 직접 지정한 좌표라 AI 인식 신뢰도 개념이 적용되지 않는다 — null로 정직하게 표시한다.
    confidence: null
  }
}

/** 등 굽음(흉추 후만) 정도. C7·흉추 정점·T12 세 점이 모두 찍혀야 계산된다. */
export function computeThoracicKyphosisFromManualPoints(
  manual: ManualSideLandmarks | null | undefined
): AngleMeasurement {
  const base = { id: 'thoracic-kyphosis', label: '흉추 굽음(등 굽음) 정도 (PT 지정)', area: '허리/몸통' as const }
  const c7 = manual?.c7
  const apex = manual?.kyphosisApex
  const t12 = manual?.t12

  if (!c7 || !apex || !t12) {
    return {
      ...base,
      valueDeg: null,
      direction: null,
      confidence: null,
      unavailableReason:
        '등 굽음 정도는 C7(목뼈 7번)·흉추 정점·T12(흉요추 경계) 위치를 PT가 사진 위에 직접 표시해야 계산됩니다 (미표시 — 측정 불확실)'
    }
  }

  // C7-흉추정점-T12 세 점이 일직선에 가까울수록(180도에 가까울수록) 등이 평평하고,
  // 180도에서 벗어날수록 정점이 뒤로 더 튀어나온(굽은 정도가 큰) 것으로 해석한다.
  const angle = angleAt(apex, c7, t12)
  const deviationFromStraight = Math.round((180 - angle) * 10) / 10
  const direction =
    deviationFromStraight < 8
      ? 'C7-흉추 정점-T12 라인이 비교적 일직선에 가까움'
      : `흉추 정점이 C7-T12 연결선보다 뒤로 튀어나온 정도가 관찰됨 (직선 대비 약 ${deviationFromStraight}도 벗어남)`

  return {
    ...base,
    valueDeg: deviationFromStraight,
    direction,
    confidence: null
  }
}

/** 수동 기준점 기반 측정값 2개(골반 전후경사, 등 굽음)를 한번에 계산한다. */
export function computeManualSagittalMeasurements(manual: ManualSideLandmarks | null | undefined): AngleMeasurement[] {
  return [computePelvicTiltFromManualPoints(manual), computeThoracicKyphosisFromManualPoints(manual)]
}
