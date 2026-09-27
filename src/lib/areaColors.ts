import type { ObservationArea } from '@/types'

/**
 * 관찰 영역(6개)별 참고 색상. 사진 위 landmark 점, 결과 요약 목록의 색상 점 등에서
 * 동일한 영역은 항상 같은 색으로 표시해 사용자가 사진-목록을 직관적으로 매칭할 수 있게 한다.
 * 진단적 의미는 없는 순수한 시각적 구분용 색상이다.
 */
export const AREA_COLORS: Record<ObservationArea, string> = {
  '머리/목': '#ef4444', // red
  어깨: '#f59e0b', // amber
  '허리/몸통': '#8b5cf6', // violet
  골반: '#22c55e', // green
  무릎: '#fb923c', // orange
  발: '#3b82f6' // blue
}
