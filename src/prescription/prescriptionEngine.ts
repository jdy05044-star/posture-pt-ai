import type {
  ConditionTag,
  Exercise,
  ExerciseCategory,
  GenerateProgramArgs,
  GeneratedProgram,
  ObservationArea,
  ProgramExercise
} from '@/types'
import { EXERCISE_LIBRARY } from '@/exercises/exerciseLibrary'

const COUNT_RANGE: Record<ExerciseCategory, { min: number; max: number }> = {
  warmup: { min: 1, max: 3 },
  main: { min: 3, max: 6 },
  cooldown: { min: 1, max: 3 }
}

/** 운동 경험 수준에 따라 main 카테고리에서 가져갈 개수를 조정한다 (요청 스펙 13번 항목) */
function targetCountForLevel(category: ExerciseCategory, level: GenerateProgramArgs['exerciseLevel']): number {
  const { min, max } = COUNT_RANGE[category]
  if (category !== 'main') return max // warmup/cooldown은 항상 최대 범위로 구성
  switch (level) {
    case 'none':
    case 'beginner':
      return min + 1 // 4개
    case 'advanced':
      return max // 6개
    default:
      return min + 2 // intermediate 등: 5개
  }
}

interface ScoredExercise {
  exercise: Exercise
  score: number
  reason: string
  requiresCaution: boolean
}

function scoreExercise(
  ex: Exercise,
  priorityAreas: ObservationArea[],
  symptomTags: ConditionTag[],
  cautionConditions: ConditionTag[]
): ScoredExercise {
  let score = 0
  const reasons: string[] = []

  const symptomMatch = ex.conditionTags.filter((t) => t !== 'general' && symptomTags.includes(t))
  if (symptomMatch.length > 0) {
    score += 2 * symptomMatch.length
    reasons.push(`선택하신 증상(${symptomMatch.join(', ')})과 매칭됨`)
  }

  const areaMatch = ex.targetAreas.filter((a) => priorityAreas.includes(a))
  if (areaMatch.length > 0) {
    score += 1 * areaMatch.length
    reasons.push(`우선 확인 영역(${areaMatch.join(', ')})의 운동 프로그램 구성에 적합`)
  }

  if (reasons.length === 0) {
    reasons.push('일반적인 자세 개선 목적으로 포함')
  }

  const requiresCaution = ex.conditionTags.some((t) => t !== 'general' && cautionConditions.includes(t))
  if (requiresCaution) {
    reasons.push('⚠ 문진에서 확인된 질환과 관련된 주의사항이 있어 강도 조정이 필요할 수 있음')
  }

  return { exercise: ex, score, reason: reasons.join(' / '), requiresCaution }
}

function toProgramExercise(s: ScoredExercise): ProgramExercise {
  return {
    ...s.exercise,
    reason: s.reason,
    requiresCaution: s.requiresCaution,
    overrides: {}
  }
}

function pickForCategory(
  category: ExerciseCategory,
  args: GenerateProgramArgs
): ProgramExercise[] {
  const pool = EXERCISE_LIBRARY.filter((e) => e.category === category)
  const scored = pool
    .map((ex) => scoreExercise(ex, args.priorityAreas, args.symptomTags, args.cautionConditions))
    .sort((a, b) => b.score - a.score)

  const count = Math.min(targetCountForLevel(category, args.exerciseLevel), scored.length)
  return scored.slice(0, count).map(toProgramExercise)
}

/**
 * 자세평가 결과 + 증상 + 금기사항 + 운동 경험을 바탕으로 Warm-up/Main/Cool-down 프로그램을 생성한다.
 * 요청 스펙 10번(선택 로직), 13번(개수 제한), 21번(선택 이유 추적) 항목을 구현한다.
 */
export function generateProgram(args: GenerateProgramArgs): GeneratedProgram {
  return {
    warmup: pickForCategory('warmup', args),
    main: pickForCategory('main', args),
    cooldown: pickForCategory('cooldown', args),
    generatedAt: new Date().toISOString()
  }
}
