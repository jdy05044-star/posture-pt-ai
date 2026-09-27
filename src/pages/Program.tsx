import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { runAssessment } from '@/assessment/assessmentEngine'
import { generateProgram } from '@/prescription/prescriptionEngine'
import ExercisePicker from '@/components/ExercisePicker'
import ProgramExerciseRow from '@/components/ProgramExerciseRow'
import { useAppState } from '@/state/AppState'
import { CONDITION_TAG_OPTIONS } from '@/types'
import type { ConditionTag, Exercise, ExerciseCategory, PatientIntake, ProgramExercise } from '@/types'

const CATEGORY_LABEL: Record<ExerciseCategory, string> = { warmup: 'Warm-up', main: 'Main Exercise', cooldown: 'Cool-down' }
const CATEGORIES: ExerciseCategory[] = ['warmup', 'main', 'cooldown']

function toProgramExercise(ex: Exercise, reason: string, cautionConditions: ConditionTag[]): ProgramExercise {
  return {
    ...ex,
    reason,
    requiresCaution: ex.conditionTags.some((t) => t !== 'general' && cautionConditions.includes(t)),
    overrides: {}
  }
}

export default function Program() {
  const { results, program, setProgram, updateProgramCategory, ptNote, setPtNote, symptomTags, setSymptomTags } =
    useAppState()
  const navigate = useNavigate()

  const summary = useMemo(() => runAssessment(results), [results])
  const priorityAreas = useMemo(
    () => Array.from(new Set(summary.priorityAreas.map((p) => p.area))),
    [summary]
  )

  const [cautionConditions, setCautionConditions] = useState<ConditionTag[]>([])
  const [exerciseLevel, setExerciseLevel] = useState<PatientIntake['exerciseExperience']>('beginner')
  const [replacing, setReplacing] = useState<{ category: ExerciseCategory; index: number } | null>(null)
  const [addingTo, setAddingTo] = useState<ExerciseCategory | null>(null)

  function toggleTag(list: ConditionTag[], set: (v: ConditionTag[]) => void, tag: ConditionTag) {
    set(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag])
  }

  function handleGenerate() {
    const generated = generateProgram({ priorityAreas, symptomTags, cautionConditions, exerciseLevel })
    setProgram(generated)
  }

  function updateExerciseAt(category: ExerciseCategory, index: number, updated: ProgramExercise) {
    if (!program) return
    const list = [...program[category]]
    list[index] = updated
    updateProgramCategory(category, list)
  }

  function deleteAt(category: ExerciseCategory, index: number) {
    if (!program) return
    const list = program[category].filter((_, i) => i !== index)
    updateProgramCategory(category, list)
  }

  function move(category: ExerciseCategory, index: number, dir: -1 | 1) {
    if (!program) return
    const list = [...program[category]]
    const target = index + dir
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    updateProgramCategory(category, list)
  }

  function applyReplace(exercise: Exercise) {
    if (!program || !replacing) return
    const list = [...program[replacing.category]]
    list[replacing.index] = toProgramExercise(exercise, 'PT가 직접 교체함', cautionConditions)
    updateProgramCategory(replacing.category, list)
    setReplacing(null)
  }

  function applyAdd(category: ExerciseCategory, exercise: Exercise) {
    if (!program) return
    const list = [...program[category], toProgramExercise(exercise, 'PT가 직접 추가함', cautionConditions)]
    updateProgramCategory(category, list)
    setAddingTo(null)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h2 className="mb-1 text-lg font-semibold text-clinical-900">운동 프로그램</h2>
      <p className="mb-6 text-sm text-clinical-600">
        증상을 선택하고 프로그램을 생성한 뒤, 각 운동을 직접 수정·교체·추가할 수 있습니다.
      </p>

      {!program && (
        <div className="card mb-6 space-y-4 p-4">
          <div>
            <p className="label-caption mb-2">주요 증상 (해당하는 항목 선택)</p>
            <div className="flex flex-wrap gap-2">
              {CONDITION_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(symptomTags, setSymptomTags, tag)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    symptomTags.includes(tag)
                      ? 'border-clinical-700 bg-clinical-700 text-white'
                      : 'border-clinical-200 text-clinical-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-caption mb-2">주의가 필요한 기존 질환 (해당 시 선택 — 운동에 주의 표시가 붙습니다)</p>
            <div className="flex flex-wrap gap-2">
              {CONDITION_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(cautionConditions, setCautionConditions, tag)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    cautionConditions.includes(tag)
                      ? 'border-alert-amber bg-alert-amber text-white'
                      : 'border-clinical-200 text-clinical-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="label-caption">운동 경험</span>
            <select
              value={exerciseLevel}
              onChange={(e) => setExerciseLevel(e.target.value as PatientIntake['exerciseExperience'])}
              className="rounded border border-clinical-200 px-2 py-2"
            >
              <option value="none">없음</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </label>

          {priorityAreas.length > 0 && (
            <p className="text-xs text-clinical-500">
              자세평가 우선 확인 영역({priorityAreas.join(', ')})을 반영해서 구성합니다.
            </p>
          )}

          <button onClick={handleGenerate} className="btn-primary w-full py-3">
            운동 프로그램 생성
          </button>
        </div>
      )}

      {program && (
        <>
          <button
            onClick={() => setProgram(null)}
            className="mb-4 text-xs font-medium text-clinical-500 hover:text-clinical-700"
          >
            ← 증상 다시 선택하고 새로 생성
          </button>

          {CATEGORIES.map((category) => (
            <section key={category} className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-clinical-900">{CATEGORY_LABEL[category]}</h3>
              <div className="space-y-3">
                {program[category].map((ex, i) => (
                  <ProgramExerciseRow
                    key={`${ex.id}-${i}`}
                    exercise={ex}
                    index={i}
                    total={program[category].length}
                    onChange={(updated) => updateExerciseAt(category, i, updated)}
                    onDelete={() => deleteAt(category, i)}
                    onMoveUp={() => move(category, i, -1)}
                    onMoveDown={() => move(category, i, 1)}
                    onReplaceRequest={() => setReplacing({ category, index: i })}
                  />
                ))}
              </div>

              {replacing?.category === category && (
                <div className="mt-3">
                  <p className="label-caption mb-1">교체할 운동 선택</p>
                  <ExercisePicker
                    category={category}
                    excludeIds={program[category].map((e) => e.id)}
                    onPick={applyReplace}
                    onCancel={() => setReplacing(null)}
                    label="이 운동으로 교체"
                  />
                </div>
              )}

              <div className="mt-3">
                {addingTo === category ? (
                  <ExercisePicker
                    category={category}
                    excludeIds={program[category].map((e) => e.id)}
                    onPick={(ex) => applyAdd(category, ex)}
                    onCancel={() => setAddingTo(null)}
                    label="운동 추가"
                  />
                ) : (
                  <button onClick={() => setAddingTo(category)} className="btn-secondary w-full py-2 text-sm">
                    + 운동 추가
                  </button>
                )}
              </div>
            </section>
          ))}

          <div className="card mb-6 p-4">
            <p className="label-caption mb-2">PT 평가 메모</p>
            <textarea
              value={ptNote}
              onChange={(e) => setPtNote(e.target.value)}
              rows={4}
              placeholder="예) 좌측 weight bearing 증가, 우측 hip control 감소 의심, scapular asymmetry 관찰..."
              className="w-full rounded border border-clinical-200 px-3 py-2 text-sm"
            />
          </div>

          <button onClick={() => navigate('/result')} className="btn-secondary w-full py-3">
            평가 결과로 돌아가기
          </button>
        </>
      )}
    </div>
  )
}
