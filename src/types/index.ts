// 앱 전역에서 사용하는 핵심 타입 정의
// STEP이 진행될수록(평가엔진, 처방엔진 등) 이 파일에 타입을 계속 추가한다.

/** 촬영 뷰 종류: 정면 / 측면 / 후면 */
export type ViewType = 'front' | 'side' | 'back'

export const VIEW_LABELS: Record<ViewType, string> = {
  front: '정면',
  side: '측면',
  back: '후면'
}

/** 촬영 가이드 문구 (요청 스펙 4번 항목 기반) */
export const CAPTURE_GUIDES: Record<ViewType, string[]> = {
  front: ['양발을 자연스럽게 벌려주세요', '팔은 자연스럽게 몸 옆에 두세요', '정면을 바라봐주세요'],
  side: ['몸 전체가 프레임 안에 들어오게 해주세요', '자연스럽게 선 자세를 유지해주세요'],
  back: ['정면과 동일하게 자연스럽게 선 자세를 유지해주세요', '뒤돌아 선 상태에서 촬영해주세요']
}

/** 하나의 촬영 이미지 (업로드 or 카메라 촬영 결과) */
export interface CaptureImage {
  view: ViewType
  dataUrl: string
  capturedAt: string // ISO timestamp
  /** 전신이 프레임에 들어왔는지 등 사용자가 직접 확인한 체크리스트 */
  selfCheck: {
    fullBodyInFrame: boolean
    cameraLevel: boolean
    leftRightClear: boolean
  }
}

/** MediaPipe Pose Landmarker가 반환하는 정규화 좌표 1개 */
export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

/** 사람 인식이 어려운 구간을 대비해, 분석에 사용하는 주요 랜드마크 이름 */
export type LandmarkName =
  | 'nose'
  | 'leftEar'
  | 'rightEar'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftHip'
  | 'rightHip'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle'
  | 'leftFootIndex'
  | 'rightFootIndex'

/** 한 장의 사진에 대한 Pose 분석 결과 */
export interface PoseAnalysisResult {
  view: ViewType
  landmarks: Landmark[]
  /** MediaPipe가 반환하는 인덱스 → 이름 매핑을 적용한 편의 접근자 */
  named: Partial<Record<LandmarkName, Landmark>>
  /** 이미지 내 인물 인식 신뢰도 계열 지표 (0~1). 존재하지 않으면 표기하지 않는다. */
  overallConfidence: number | null
  analyzedAt: string
}

/** 환자 기본 정보 및 문진 입력 (요청 스펙 11번 항목) */
export interface PatientIntake {
  sex: 'male' | 'female' | 'unspecified'
  age: number | null
  heightCm: number | null
  weightKg: number | null
  mainSymptom: string
  painLocation: string
  painLevel: number | null // 0-10
  painDuration: string
  exerciseExperience: 'none' | 'beginner' | 'intermediate' | 'advanced' | ''
  exerciseGoal: string
  /** RED FLAG 확인 문항에 대한 응답. true가 하나라도 있으면 전문가 평가 권장 배너를 띄운다. */
  redFlags: {
    id: string
    question: string
    answer: boolean | null
  }[]
}

export type ExerciseCategory = 'warmup' | 'main' | 'cooldown'
export type ExerciseSource = 'PDF' | '일반 운동 라이브러리'

/** 운동 데이터 구조 (요청 스펙 9번 항목) */
export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  purpose: string
  duration?: string
  sets?: number
  repetitions?: number
  intensity?: string
  precautions?: string
  /** 이 운동의 근거 출처. PDF에 실제로 없는 내용을 'PDF'로 표시하지 않는다. */
  source: ExerciseSource
  /** 시작 자세 설명 */
  startPosition?: string
  /** 수행 방법을 단계별로 나눈 설명 */
  executionSteps?: string[]
  /** 호흡 큐 (예: "내쉬며 들어올리고, 마시며 내려온다") */
  breathingCue?: string
  /** 흔히 하는 실수/주의할 보상동작 (NG) */
  commonMistakes?: string[]
  /** 어떤 관찰 영역(어깨/골반/허리/목/무릎/발)에 매칭되는지 */
  targetAreas: ObservationArea[]
  /**
   * 이 운동이 도움이 될 수 있는 증상/질환 태그 (요청 스펙 10번 항목: 사용자가 입력한 주요 증상과 매칭).
   * 진단명을 확정하는 용도가 아니라, 문진에서 선택한 증상과 운동을 연결하는 '태그' 성격이다.
   * 특정 질환명이 없는 일반적인 자세 개선 목적 운동은 'general'만 가진다.
   */
  conditionTags: ConditionTag[]
}

export type ObservationArea = '어깨' | '골반' | '허리/몸통' | '머리/목' | '무릎' | '발'

/**
 * 증상/질환 태그. CONTRAINDICATIONS(src/data/contraindications.ts)의 condition과 이름을 맞춰두면
 * "이 증상엔 이 운동을 우선 제안하되, 동시에 이 질환엔 이 운동이 금기"라는 교차 판단이 쉬워진다.
 */
export type ConditionTag =
  | 'general' // 특정 질환 없이 일반적인 자세 개선/코어 강화 목적
  | '요통'
  | '디스크'
  | '척추전방전위증'
  | '척추관협착증'
  | '강직성척추염'
  | '라운드숄더'
  | '회전근개병변'
  | '오십견'
  | '어깨불안정'
  | '손목터널증후군'
  | '고관절수술후'
  | '천장관절기능부전'
  | '무릎관절염'
  | '거북목'
  | '평발'

/** ConditionTag의 실제 값 목록 (런타임에서 select/checkbox 옵션을 만들 때 사용). 'general'은 제외 — 문진에서 사용자가 직접 선택하는 항목이 아니다. */
export const CONDITION_TAG_OPTIONS: Exclude<ConditionTag, 'general'>[] = [
  '요통',
  '디스크',
  '척추전방전위증',
  '척추관협착증',
  '강직성척추염',
  '라운드숄더',
  '회전근개병변',
  '오십견',
  '어깨불안정',
  '손목터널증후군',
  '고관절수술후',
  '천장관절기능부전',
  '무릎관절염',
  '거북목',
  '평발'
]

/** 처방 엔진이 운동을 선택한 이유를 추적하기 위한 구조 (요청 스펙 21번 항목) */
export interface PrescriptionReasonEntry {
  exerciseId: string
  exerciseName: string
  reason: string
  source: ExerciseSource
}

// ── STEP5: 각도 계산 ──────────────────────────────────────────

/** 하나의 각도/비대칭 측정값. 계산에 필요한 landmark가 없으면 valueDeg는 null이 된다. */
export interface AngleMeasurement {
  id: string
  label: string
  area: ObservationArea
  /** 도(degree) 단위 측정값. 측정 불가 시 null — 절대 임의로 채우지 않는다. */
  valueDeg: number | null
  /** 방향 설명 (예: "우측이 더 낮음") */
  direction: string | null
  /** 관련 landmark들의 visibility 평균 (0~1). 없으면 null */
  confidence: number | null
  /** 측정이 불가능했던 이유 (필요 landmark 미인식 등) */
  unavailableReason?: string
}

/** 관찰 영역 하나에 대한 자세평가 결과 (요청 스펙 6번 항목: 결과화면 구조) */
export interface AreaAssessmentResult {
  area: ObservationArea
  measurements: AngleMeasurement[]
  /** 사람이 읽는 관찰 문구. 원인/진단을 단정하지 않는다. */
  observation: string
  /** 이 영역 전체의 신뢰도 (measurements의 confidence 평균, 없으면 null) */
  confidence: number | null
}

/** 우선 확인 영역 (요청 스펙 7번 항목). 의료적 진단 순위가 아니다. */
export interface PriorityAreaEntry {
  area: ObservationArea
  reason: string
  basedOnMeasurement: string
  valueDeg: number | null
  confidence: number | null
}

export interface AssessmentSummary {
  areaResults: AreaAssessmentResult[]
  priorityAreas: PriorityAreaEntry[]
  generatedAt: string
}

// ── STEP8: 처방 엔진 ──────────────────────────────────────────

export interface GenerateProgramArgs {
  /** 자세평가에서 우선 확인 영역으로 나온 관찰 영역들 */
  priorityAreas: ObservationArea[]
  /** 문진에서 선택한 주요 증상 태그 */
  symptomTags: ConditionTag[]
  /** 문진에서 확인된, 주의가 필요한 질환 태그 (금기/주의사항 표시용) */
  cautionConditions: ConditionTag[]
  exerciseLevel: PatientIntake['exerciseExperience']
}

/** PT가 화면에서 직접 수정 가능한 운동 프로그램 항목 (요청 스펙 14번 항목) */
export interface ProgramExercise extends Exercise {
  /** 처방 엔진이 이 운동을 선택한 이유 (요청 스펙 21번 항목) */
  reason: string
  /** symptomTags/cautionConditions와 겹쳐 주의가 필요하다고 표시된 경우 true */
  requiresCaution: boolean
  /** PT가 직접 수정한 값. 있으면 원본 Exercise 값 대신 이 값을 표시/사용한다. */
  overrides: {
    sets?: number
    repetitions?: number
    duration?: string
    intensity?: string
    note?: string
  }
}

export interface GeneratedProgram {
  warmup: ProgramExercise[]
  main: ProgramExercise[]
  cooldown: ProgramExercise[]
  generatedAt: string
}
