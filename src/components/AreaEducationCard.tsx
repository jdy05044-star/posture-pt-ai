import type { ObservationArea } from '@/types'
import { AREA_EDUCATION } from '@/data/postureEducation'

interface Props {
  area: ObservationArea
  defaultOpen?: boolean
}

/**
 * 자세평가 결과 화면에서 관찰 영역별 설명을 보여주는 접이식 카드.
 * STEP6(자세 평가 엔진 결과 화면)에서 각 영역 결과 옆에 배치해서 사용한다.
 */
export default function AreaEducationCard({ area, defaultOpen = false }: Props) {
  const info = AREA_EDUCATION[area]

  return (
    <details className="card group p-4" open={defaultOpen}>
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-clinical-800">{area} 관찰 설명</span>
          <span className="text-xs text-clinical-400 group-open:rotate-180">▾</span>
        </div>
      </summary>

      <div className="mt-3 space-y-3 text-sm text-clinical-600">
        <div>
          <p className="label-caption mb-1">무엇을 관찰하나요</p>
          <p>{info.whatWeObserve}</p>
        </div>
        <div>
          <p className="label-caption mb-1">왜 관찰하나요</p>
          <p>{info.whyItMatters}</p>
        </div>
        <div>
          <p className="label-caption mb-1">자주 관찰되는 패턴</p>
          <ul className="space-y-2">
            {info.commonPatterns.map((p) => (
              <li key={p.name}>
                <p>
                  <span className="font-medium text-clinical-700">{p.name}</span> — {p.description}
                </p>
                {p.muscleNote && (
                  <p className="mt-0.5 text-xs text-clinical-500">
                    <span className="font-medium text-clinical-600">관련 근육 참고</span> · {p.muscleNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
        {info.backgroundConcepts && info.backgroundConcepts.length > 0 && (
          <div>
            <p className="label-caption mb-1">참고 개념</p>
            <ul className="space-y-2">
              {info.backgroundConcepts.map((c) => (
                <li key={c.title}>
                  <span className="font-medium text-clinical-700">{c.title}</span>
                  <p className="text-clinical-600">{c.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {info.relatedAreas.length > 0 && (
          <p className="label-caption">
            함께 살펴보면 좋은 영역: {info.relatedAreas.join(', ')}
          </p>
        )}
        <p className="border-t border-clinical-100 pt-2 text-xs text-clinical-400">
          위 내용은 일반적인 자세 스크리닝 참고 정보이며, 통증의 원인을 확정하거나 질환을 진단하지 않습니다.
        </p>
      </div>
    </details>
  )
}
