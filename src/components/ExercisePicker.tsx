import { useState } from 'react'
import type { Exercise, ExerciseCategory } from '@/types'
import { EXERCISE_LIBRARY } from '@/exercises/exerciseLibrary'

interface Props {
  category: ExerciseCategory
  excludeIds: string[]
  onPick: (exercise: Exercise) => void
  onCancel?: () => void
  label?: string
}

export default function ExercisePicker({ category, excludeIds, onPick, onCancel, label }: Props) {
  const options = EXERCISE_LIBRARY.filter((e) => e.category === category && !excludeIds.includes(e.id))
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '')

  if (options.length === 0) {
    return <p className="text-xs text-clinical-400">추가할 수 있는 운동이 더 없습니다.</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-clinical-50 p-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="rounded border border-clinical-200 px-2 py-1 text-sm"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          const found = options.find((o) => o.id === selectedId)
          if (found) onPick(found)
        }}
        className="btn-secondary px-3 py-1 text-xs"
      >
        {label ?? '추가'}
      </button>
      {onCancel && (
        <button onClick={onCancel} className="text-xs text-clinical-400">
          취소
        </button>
      )}
    </div>
  )
}
