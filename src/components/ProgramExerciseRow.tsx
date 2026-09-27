import type { ProgramExercise } from '@/types'

interface Props {
  exercise: ProgramExercise
  index: number
  total: number
  onChange: (updated: ProgramExercise) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onReplaceRequest: () => void
}

export default function ProgramExerciseRow({
  exercise,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onReplaceRequest
}: Props) {
  const sets = exercise.overrides.sets ?? exercise.sets
  const repetitions = exercise.overrides.repetitions ?? exercise.repetitions
  const duration = exercise.overrides.duration ?? exercise.duration
  const intensity = exercise.overrides.intensity ?? exercise.intensity
  const note = exercise.overrides.note ?? ''

  function patchOverride(patch: Partial<ProgramExercise['overrides']>) {
    onChange({ ...exercise, overrides: { ...exercise.overrides, ...patch } })
  }

  return (
    <div className={`card p-3 ${exercise.requiresCaution ? 'border-alert-amber' : ''}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-clinical-800">{exercise.name}</p>
          <p className="text-xs text-clinical-500">{exercise.purpose}</p>
        </div>
        <span className="flex-none rounded bg-clinical-100 px-2 py-0.5 text-[10px] text-clinical-500">
          {exercise.source}
        </span>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <label className="flex flex-col gap-0.5">
          <span className="label-caption">세트</span>
          <input
            type="number"
            min={0}
            value={sets ?? ''}
            onChange={(e) => patchOverride({ sets: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="rounded border border-clinical-200 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="label-caption">반복</span>
          <input
            type="number"
            min={0}
            value={repetitions ?? ''}
            onChange={(e) =>
              patchOverride({ repetitions: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            className="rounded border border-clinical-200 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="label-caption">시간</span>
          <input
            type="text"
            value={duration ?? ''}
            onChange={(e) => patchOverride({ duration: e.target.value })}
            className="rounded border border-clinical-200 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="label-caption">강도</span>
          <input
            type="text"
            value={intensity ?? ''}
            onChange={(e) => patchOverride({ intensity: e.target.value })}
            className="rounded border border-clinical-200 px-2 py-1"
          />
        </label>
      </div>

      {exercise.precautions && (
        <p className="mb-2 text-xs text-alert-amber">주의사항: {exercise.precautions}</p>
      )}
      <p className="mb-2 text-xs text-clinical-400">선택 이유: {exercise.reason}</p>

      <label className="mb-2 flex flex-col gap-0.5 text-sm">
        <span className="label-caption">PT 메모</span>
        <input
          type="text"
          value={note}
          onChange={(e) => patchOverride({ note: e.target.value })}
          placeholder="이 운동에 대한 메모 (선택)"
          className="rounded border border-clinical-200 px-2 py-1"
        />
      </label>

      <div className="flex flex-wrap gap-2 text-xs">
        <button onClick={onMoveUp} disabled={index === 0} className="btn-secondary px-2 py-1 disabled:opacity-30">
          위로
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="btn-secondary px-2 py-1 disabled:opacity-30"
        >
          아래로
        </button>
        <button onClick={onReplaceRequest} className="btn-secondary px-2 py-1">
          교체
        </button>
        <button onClick={onDelete} className="btn-secondary px-2 py-1 text-alert-red">
          삭제
        </button>
      </div>
    </div>
  )
}
