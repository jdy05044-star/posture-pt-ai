import type { ObservationArea } from '@/types'

/**
 * 질환별 금기/주의 동작 데이터.
 * 출처: 업로드된 모던필라테스 평가자료 (체크리스트/표 형태 항목을 구조화한 것)
 * source: 'PDF' — 이 파일의 항목들은 실제로 해당 자료에서 확인된 내용만 담는다.
 * 자료에 없는 질환·동작은 추가하지 않으며, 필요 시 'source: 일반 운동 라이브러리'로 별도 관리한다.
 */
export interface ContraindicationEntry {
  id: string
  condition: string
  relatedArea: ObservationArea
  /** 피해야 하거나 주의해야 할 동작/자세 */
  cautionMovements: string[]
  source: 'PDF'
}

export const CONTRAINDICATIONS: ContraindicationEntry[] = [
  {
    id: 'acute-lbp-disc',
    condition: '급성 요통 / 요추 추간판탈출증 (Herniation of Lumbar Intervertebral Disk)',
    relatedArea: '허리/몸통',
    cautionMovements: ['척추 굴곡·회전', '무릎을 편 상태의 90도 이상 고관절 굴곡', 'prone 자세에서의 과한 호흡'],
    source: 'PDF'
  },
  {
    id: 'spondylolisthesis',
    condition: '척추전방전위증 (Spondylolisthesis)',
    relatedArea: '허리/몸통',
    cautionMovements: ['척추 신전', 'prone 자세', '4점 무릎기기 자세'],
    source: 'PDF'
  },
  {
    id: 'spinal-stenosis',
    condition: '척추관협착증 / 후관절증후군 (Spinal Stenosis / Facet Joint Syndrome)',
    relatedArea: '허리/몸통',
    cautionMovements: ['척추 신전', '척추 회전'],
    source: 'PDF'
  },
  {
    id: 'ankylosing-spondylitis',
    condition: '강직성 척추염 (Ankylosing Spondylitis)',
    relatedArea: '허리/몸통',
    cautionMovements: ['척추 회전 (관절 위치 주의)'],
    source: 'PDF'
  },
  {
    id: 'rotator-cuff',
    condition: '회전근개 병변 / 견봉하충돌증후군 / 흉곽출구증후군',
    relatedArea: '어깨',
    cautionMovements: ['어깨 굴곡', '어깨 외전'],
    source: 'PDF'
  },
  {
    id: 'frozen-shoulder',
    condition: '유착성관절낭염(동결견, 오십견)',
    relatedArea: '어깨',
    cautionMovements: ['어깨 굴곡', '어깨 외전', '90도 이상 외회전'],
    source: 'PDF'
  },
  {
    id: 'shoulder-instability',
    condition: '어깨 탈구 / 아탈구 (Dislocation / Subluxation)',
    relatedArea: '어깨',
    cautionMovements: ['어깨 외전', '90도 이상 외회전', '모든 급격한 동작 주의'],
    source: 'PDF'
  },
  {
    id: 'carpal-tunnel',
    condition: '손목터널증후군 (Carpal Tunnel Syndrome)',
    relatedArea: '어깨', // 별도 손목 카테고리가 없어 상지로 분류, 상세는 condition/cautionMovements 참고
    cautionMovements: ['손목의 반복적인 굴곡·신전', '4점 무릎기기 자세에서의 손목 부하'],
    source: 'PDF'
  },
  {
    id: 'hip-replacement',
    condition: '엉덩관절 전치환술 (Total Hip Replacement)',
    relatedArea: '골반',
    cautionMovements: ['고관절 내전', '고관절 내회전', '90도 이상 고관절 굴곡'],
    source: 'PDF'
  },
  {
    id: 'si-joint-dysfunction',
    condition: '천장관절 기능부전 (Sacroiliac Joint Dysfunction)',
    relatedArea: '골반',
    cautionMovements: ['강한 압박이나 통증을 유발하는 동작', '한발 서기(One Leg Standing)', 'Double Knee Circle'],
    source: 'PDF'
  },
  {
    id: 'knee-arthritis',
    condition: '관절염 / 무릎연골연화증 (Arthritis / Chondromalacia of the Patella)',
    relatedArea: '무릎',
    cautionMovements: ['과도한 무릎 굴곡', '무릎 꿇는 자세(Kneeling Position)'],
    source: 'PDF'
  }
]

export function getContraindicationsForArea(area: ObservationArea): ContraindicationEntry[] {
  return CONTRAINDICATIONS.filter((c) => c.relatedArea === area)
}
