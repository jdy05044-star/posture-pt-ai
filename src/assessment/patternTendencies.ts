import type { AngleMeasurement } from '@/types'

/**
 * 여러 부위의 측정 방향을 종합해 "전신 패턴 경향"을 참고 수준으로 요약하기 위한 로직.
 * 특정 저작물의 분류 체계(상부/하부교차증후군, 켄달 자세 유형 등)를 그대로 옮긴 것이 아니라,
 * 이 앱이 실제로 측정하는 값만을 근거로 자체적으로 구성한 참고용 조합이다.
 *
 * 중요:
 * - 이 앱이 측정하지 않는 값(예: 골반 전후경사, 흉추 후만 정도)이 필요한 정통적인 분류는 시도하지 않는다.
 *   대신 실제로 측정 가능한 지표만 조합해서 "~경향과 유사한 조합" 수준으로만 참고 제공한다.
 * - 근거가 되는 측정값이 없거나 부족하면 정직하게 status를 'insufficient' 또는 'partial'로 표시하고,
 *   단정적인 진단·분류 표현은 사용하지 않는다.
 */

export interface PatternTendency {
  id: string
  label: string
  /** observed: 근거 측정값이 모두 있고 경향이 뚜렷함 / partial: 일부만 해당하거나 측정값이 부족함 / insufficient: 특별한 경향 없음 */
  status: 'observed' | 'partial' | 'insufficient'
  description: string
  /** 이 패턴 경향을 계산할 때 근거로 사용한 측정값 id들 */
  basedOn: string[]
}

function getMeasurement(measurements: AngleMeasurement[], id: string) {
  return measurements.find((m) => m.id === id)
}

function lowSide(direction: string | null): 'left' | 'right' | null {
  if (!direction) return null
  if (direction.includes('좌측')) return 'left'
  if (direction.includes('우측')) return 'right'
  return null
}

/**
 * 측면(sagittal) 측정값 기준: 머리 전방 이동·무릎 과신전·골반 후방 경사·등 굽음 증가가
 * 함께 관찰되는지를 참고로 묶어본다. 앞의 두 개는 자동으로 측정되고, 뒤의 두 개(골반 전후경사·
 * 등 굽음)는 PT가 사진 위에 직접 표시한 기준점이 있을 때만 계산된다 — 표시하지 않았다면
 * 이 조합은 근거 신호가 그만큼 줄어든 채로 참고 수준으로만 제시된다.
 */
function computeForwardLeanPattern(sagittal: AngleMeasurement[]): PatternTendency | null {
  const fh = getMeasurement(sagittal, 'forward-head')
  const kf = getMeasurement(sagittal, 'knee-flex-angle')
  const pelvic = getMeasurement(sagittal, 'pelvic-tilt-sagittal')
  const kyphosis = getMeasurement(sagittal, 'thoracic-kyphosis')

  const fhMeasured = !!fh && fh.valueDeg !== null
  const kfMeasured = !!kf && kf.valueDeg !== null
  const pelvicMeasured = !!pelvic && pelvic.valueDeg !== null
  const kyphosisMeasured = !!kyphosis && kyphosis.valueDeg !== null

  if (!fhMeasured && !kfMeasured && !pelvicMeasured && !kyphosisMeasured) return null

  const fhActive = fhMeasured && fh!.valueDeg! >= 5
  const kfActive = kfMeasured && kf!.valueDeg! > 182
  const pelvicPosteriorActive = pelvicMeasured && !!pelvic!.direction?.includes('뒤로 기운')
  const kyphosisActive = kyphosisMeasured && kyphosis!.valueDeg! >= 8

  const activeLabels: string[] = []
  if (fhActive) activeLabels.push('머리 전방 이동')
  if (kfActive) activeLabels.push('무릎 과신전')
  if (pelvicPosteriorActive) activeLabels.push('골반 후방 경사')
  if (kyphosisActive) activeLabels.push('등(흉추) 굽음 증가')

  const measuredCount = [fhMeasured, kfMeasured, pelvicMeasured, kyphosisMeasured].filter(Boolean).length
  const activeCount = activeLabels.length

  let status: PatternTendency['status']
  let description: string

  if (activeCount >= 3) {
    status = 'observed'
    description = `측면 사진에서 ${activeLabels.join(', ')} 경향이 함께 관찰됩니다. 운동과학에서는 이런 조합을 참고 삼아 "스웨이백(sway-back) 경향"이라는 표현이 쓰이기도 하지만, 이는 하나의 참고 명칭일 뿐 의학적 진단이 아닙니다.`
  } else if (activeCount >= 1) {
    status = 'partial'
    description = `측면 사진에서 ${activeLabels.join(', ')} 경향이 관찰되지만, ${
      measuredCount < 4
        ? '골반·등 기준점을 아직 표시하지 않았거나 다른 지표에서 뚜렷한 편차가 없어'
        : '다른 지표는 뚜렷한 편차가 없어'
    } 전신 패턴으로 단정하기에는 근거가 부족합니다. 참고 정보로만 확인해주세요.`
  } else {
    status = 'insufficient'
    description = '측면 사진 기준으로는 뚜렷한 편차가 관찰되지 않았습니다.'
  }

  return {
    id: 'forward-lean-pattern',
    label: '앞으로 쏠린 자세 경향 (참고)',
    status,
    description,
    basedOn: ['forward-head', 'knee-flex-angle', 'pelvic-tilt-sagittal', 'thoracic-kyphosis']
  }
}

/**
 * 정면(frontal) 측정값 기준: 어깨-골반의 좌우 낮은 쪽이 같은 편인지 반대 편인지를 참고로 묶어본다.
 */
function computeLateralChainPattern(frontal: AngleMeasurement[]): PatternTendency | null {
  const shoulder = getMeasurement(frontal, 'shoulder-tilt')
  const pelvis = getMeasurement(frontal, 'pelvis-tilt')

  const shoulderMeasured = !!shoulder && shoulder.valueDeg !== null
  const pelvisMeasured = !!pelvis && pelvis.valueDeg !== null
  if (!shoulderMeasured || !pelvisMeasured) return null

  const shoulderSide = lowSide(shoulder!.direction)
  const pelvisSide = lowSide(pelvis!.direction)

  if (!shoulderSide && !pelvisSide) {
    return {
      id: 'lateral-chain-pattern',
      label: '좌우 비대칭 경향 (어깨-골반, 참고)',
      status: 'insufficient',
      description: '어깨·골반 모두 좌우 높이 차이가 뚜렷하지 않아 특별한 비대칭 경향은 관찰되지 않았습니다.',
      basedOn: ['shoulder-tilt', 'pelvis-tilt']
    }
  }

  if (shoulderSide && pelvisSide) {
    const sameSide = shoulderSide === pelvisSide
    const sideLabel = (s: 'left' | 'right') => (s === 'left' ? '좌측' : '우측')
    return {
      id: 'lateral-chain-pattern',
      label: '좌우 비대칭 경향 (어깨-골반, 참고)',
      status: 'observed',
      description: sameSide
        ? `어깨와 골반이 같은 쪽(${sideLabel(shoulderSide)})에서 낮게 관찰되는 동측 경향입니다. 몸통 옆쪽 근육(요방형근 등)의 좌우 긴장도 차이와 함께 나타나는 경우가 많다고 알려져 있으며, 주로 사용하는 팔·다리 방향이나 자세 습관과 관련될 수 있다고 설명됩니다.`
        : `어깨는 ${sideLabel(shoulderSide)}, 골반은 ${sideLabel(pelvisSide)}이 낮게 관찰되어 서로 엇갈리는(반대측) 경향입니다. 몸통이 완만한 곡선을 그리듯 좌우로 번갈아 치우치는 패턴과 함께 나타나는 경우가 있다고 알려져 있습니다.`,
      basedOn: ['shoulder-tilt', 'pelvis-tilt']
    }
  }

  return {
    id: 'lateral-chain-pattern',
    label: '좌우 비대칭 경향 (어깨-골반, 참고)',
    status: 'partial',
    description: `${shoulderSide ? '어깨' : '골반'}에서만 좌우 높이 차이가 관찰되어, 어깨-골반을 함께 묶은 경향으로 단정하기에는 근거가 부족합니다.`,
    basedOn: ['shoulder-tilt', 'pelvis-tilt']
  }
}

/**
 * 여러 부위 측정값을 종합한 "전신 패턴 경향" 목록을 계산한다.
 * 측면(sagittal)·정면(frontal) 사진 각각에서 계산 가능한 것만 반환하며,
 * 근거가 부족한 항목은 status: 'insufficient'로 정직하게 표시한다.
 */
export function computePatternTendencies(
  sagittal: AngleMeasurement[],
  frontal: AngleMeasurement[]
): PatternTendency[] {
  const out: PatternTendency[] = []
  const forwardLean = computeForwardLeanPattern(sagittal)
  if (forwardLean) out.push(forwardLean)
  const lateralChain = computeLateralChainPattern(frontal)
  if (lateralChain) out.push(lateralChain)
  return out
}
