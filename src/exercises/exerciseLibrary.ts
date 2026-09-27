import raw from './exercises.json'
import type { ConditionTag, Exercise, ObservationArea } from '@/types'

export const EXERCISE_LIBRARY: Exercise[] = raw.exercises as Exercise[]

/** 문진에서 선택된 증상 태그와 매칭되는 운동을 찾는다. 'general'은 항상 포함한다. */
export function findExercisesByCondition(tags: ConditionTag[]): Exercise[] {
  const wanted = new Set<ConditionTag>(['general', ...tags])
  return EXERCISE_LIBRARY.filter((ex) => ex.conditionTags.some((t) => wanted.has(t)))
}

/** 자세평가에서 관찰된 영역과 매칭되는 운동을 찾는다. */
export function findExercisesByArea(area: ObservationArea): Exercise[] {
  return EXERCISE_LIBRARY.filter((ex) => ex.targetAreas.includes(area))
}
