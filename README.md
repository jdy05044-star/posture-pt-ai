# PosturePT — 자세평가 및 운동 프로그램 추천 웹앱 (MVP)

PT의 자세 스크리닝 및 운동 프로그램 구성을 돕는 웹앱입니다.
**질환을 진단하거나 의사의 진료를 대체하지 않습니다.**

## 지금까지 구현된 것 (STEP 1~4)

1. 프로젝트 뼈대 (Vite + React + TypeScript + Tailwind CSS)
2. 사진 업로드/카메라 촬영 (정면/측면/후면, 촬영 가이드, 자가 체크리스트, 삭제·재촬영)
3. MediaPipe Pose Landmarker 연결 (브라우저에서 직접 실행, 서버 전송 없음)
4. 사진 위 landmark(관절점) + 연결선 시각화, 분석 신뢰도 표시

## STEP5~6 추가 구현 내용

- `src/assessment/angleCalculations.ts`: 정면/후면 사진에서 어깨·골반 높이차, 머리 중심선 편차, 무릎 정렬 편차를 계산하고, 측면 사진에서 forward head 경향, 몸통 기울기, 무릎 굽힘/폄 각도를 계산합니다. 골반 전후경사처럼 2D landmark만으로 신뢰성 있게 계산할 수 없는 항목은 값을 지어내지 않고 "측정 불확실"로 명시합니다.
- `src/assessment/assessmentEngine.ts`: 세 장의 분석 결과를 관찰 영역(어깨/골반/허리·몸통/머리·목/무릎/발)별로 묶고, 편차가 큰 순서로 "우선 확인 영역" 최대 3개를 뽑습니다 (의료적 진단 순위 아님, 안내 문구 포함).
- `src/pages/Result.tsx`, `src/components/PostureResultCard.tsx`: 결과 화면. 각 영역마다 측정값·신뢰도·관찰문구 + STEP6.5에서 만든 교육 카드를 함께 보여줍니다.

## STEP8~9 추가 구현 내용

- `src/prescription/prescriptionEngine.ts`: `generateProgram()` — 자세평가 우선 확인 영역 + 선택한 증상 태그로 운동에 점수를 매겨 Warm-up 1~3 / Main 3~6(운동 경험에 따라 조정) / Cool-down 1~3개를 구성합니다. 각 운동마다 선택 이유를 문자열로 남기고, 문진에서 표시한 질환과 겹치면 `requiresCaution`으로 주의 표시를 합니다.
- `src/pages/Program.tsx`: 증상/주의질환 태그 선택 → 프로그램 생성 → PT 수정까지 한 화면에서 진행합니다.
- `src/components/ProgramExerciseRow.tsx`: 세트/반복/시간/강도/메모를 직접 수정할 수 있고, [위로]/[아래로]/[교체]/[삭제] 버튼을 제공합니다 (요청 스펙 14번 항목).
- `src/components/ExercisePicker.tsx`: 교체·추가 시 라이브러리에서 운동을 고르는 선택 UI.
- PT 평가 메모 입력창 포함 (요청 스펙 15번 항목). 단, 현재는 새로고침하면 초기화되는 세션 상태이며 저장 기능은 STEP10~11에서 추가합니다.

## STEP10~12 추가 구현 내용

- `src/pages/Compare.tsx` + AppState의 `beforeSummary`/`saveAsBefore`: 평가 결과 화면에서 "Before로 저장" → 운동 수행 후 다시 촬영·분석 → `/compare`에서 측정값별 Before→After 변화량을 보여줍니다. 촬영 조건 차이에 따른 측정 오차 가능성을 항상 안내합니다.
- `src/lib/storage.ts`: localStorage 기반 세션 저장. 사진(dataUrl)은 용량·민감정보 문제로 **의도적으로 저장하지 않으며**, 환자명/평가일/평가결과 스냅샷/운동 프로그램/PT메모만 자동 저장·복원됩니다. 새로고침해도 이 데이터는 유지됩니다.
- `src/pages/Report.tsx`: 환자 기본정보, 촬영 사진(세션 내에서만), 우선 확인 영역, 영역별 평가결과, 운동 프로그램, PT 메모를 한 화면에 모은 리포트. "PDF로 저장" 버튼은 브라우저 인쇄(`window.print()`)를 열며, 인쇄 시 불필요한 버튼은 자동으로 숨겨집니다(각 브라우저의 "PDF로 저장" 인쇄 대상 선택 필요).
- 모바일 UI: iOS 노치/홈 인디케이터 안전영역 padding, 입력창 자동확대 방지(16px 최소 폰트) 등 세부 보정을 추가했습니다.

## 남은 한계 / 다음에 다듬을 것

- 사진은 새로고침 시 사라집니다 (localStorage에 이미지까지 저장하려면 IndexedDB 등으로 확장 필요 — README 하단 기술 스택 참고).
- PDF는 진짜 파일 생성이 아니라 브라우저 인쇄 다이얼로그를 이용합니다. 더 정교한 PDF(레이아웃 고정, 자동 다운로드)가 필요하면 `jspdf`/`html2canvas` 도입을 고려하세요.
- Before/After는 세션 내 1개만 저장됩니다. 여러 회차를 이력으로 쌓으려면 STEP7 언급된 Supabase/Firebase 등 백엔드 연동이 필요합니다.

## PDF 자료 반영 현황

- `src/data/contraindications.ts`: 업로드하신 평가 자료의 **질환별 금기/주의 동작 체크리스트**를 구조화 (`source: 'PDF'`)
- `src/exercises/exercises.json`: 일반적으로 통용되는 PT/필라테스 기초 운동 33개(Warm-up 6 / Main 20 / Cool-down 7, 흉추 가동성 운동 3종 포함)로 채워두었습니다. 각 운동마다 목적/시작자세/수행법(단계별)/호흡큐/흔한 실수(NG)/주의사항/`conditionTags`(증상-운동 매칭 태그)까지 포함되어 있습니다 (`source: '일반 운동 라이브러리'`, 특정 저작물 인용 없이 자체 작성). 업로드하신 자료들(모던필라테스 교재, 척추안정화연구소 교재 2건, 필라테스 굿노트 운동카드, 출판 도서)은 모두 제3자 저작권이 있어 운동 상세설명을 그대로 옮기지 않았습니다. 실제 임상에서 쓰시는 운동으로 교체·추가하며 다듬어주세요.
- `src/exercises/exerciseLibrary.ts`: `findExercisesByCondition()`, `findExercisesByArea()` 헬퍼로 증상/관찰영역 기준 운동 조회 가능 (STEP8 처방엔진에서 사용 예정)
- `src/data/postureEducation.ts` + `src/components/AreaEducationCard.tsx`: 어깨/골반/허리·몸통/머리·목/무릎/발 6개 관찰 영역마다 "무엇을 관찰하나요 / 왜 관찰하나요 / 자주 관찰되는 패턴"을 설명하는 콘텐츠. STEP6 결과 화면에서 각 영역 옆에 접이식 카드로 배치해서 사용 예정 (자체 작성, 진단적 표현 없음)
- 별도로 업로드된 학술 워크샵 교재(척추안정화연구소)는 제3자 저작권(논문 재수록, 인물 사진 등) 문제로 **코드/데이터에 반영하지 않았습니다.** 이론적 배경 이해에만 참고했습니다.

## 설치 방법

```bash
cd posture-pt-ai
npm install
```

## 실행 방법

```bash
npm run dev
```

터미널에 표시되는 주소(`http://localhost:5173`)로 접속합니다.
모바일 기기(카메라 촬영 테스트)에서 접속하려면 PC와 같은 Wi-Fi에 연결한 뒤,
`vite.config.ts`의 `server.host: true` 설정 덕분에 표시되는 `http://<PC의 사설IP>:5173` 주소로 접속하면 됩니다.
카메라 접근은 브라우저 보안 정책상 `localhost` 또는 `https` 환경에서만 정상 동작할 수 있습니다.

## Pose 모델 사용 방법

`src/lib/poseLandmarker.ts`에서 Google이 호스팅하는 CDN(jsdelivr, storage.googleapis.com)의
MediaPipe Pose Landmarker(`pose_landmarker_lite`) 모델을 최초 1회 로드해 재사용합니다.
인터넷 연결이 필요하며, 최초 로드 시 다소 시간이 걸릴 수 있습니다.
더 정밀한 모델이 필요하면 `pose_landmarker_full` 또는 `pose_landmarker_heavy` 경로로 교체하세요
(정확도는 오르지만 로딩 속도가 느려집니다).

## 운동 데이터 수정 방법

`src/exercises/exercises.json`에 아래 구조로 운동을 추가합니다.

```json
{
  "id": "bridge-01",
  "name": "브릿지",
  "category": "main",
  "purpose": "골반·둔근 안정성 강화",
  "duration": null,
  "sets": 3,
  "repetitions": 12,
  "intensity": "낮음",
  "precautions": "급성 요통 환자 주의",
  "source": "일반 운동 라이브러리",
  "targetAreas": ["골반"]
}
```

`source`는 반드시 `"PDF"` 또는 `"일반 운동 라이브러리"` 중 하나로 표기해, 나중에 리포트에서
근거를 구분해서 보여줄 수 있게 합니다.

## 처방 로직 수정 방법 (STEP8에서 구현 예정)

`src/prescription/` 폴더에 `generateProgram()` 함수를 추가할 예정입니다.
입력: 자세평가 결과(`postureResult`), 증상(`symptoms`), 금기사항(`precautions`), 운동 경험(`exerciseLevel`).
출력: Warm-up/Main/Cool-down으로 구성된 운동 프로그램 + 각 운동의 선택 이유(`PrescriptionReasonEntry`, `src/types/index.ts` 참고).

## 기술 스택

- React 18 + TypeScript, React Router
- Tailwind CSS
- @mediapipe/tasks-vision (Pose Landmarker)
- Recharts (Before/After 비교 차트에서 사용 예정)
- 데이터 저장: 현재는 로컬 상태(React Context)뿐이며, 브라우저를 새로고침하면 초기화됩니다.
  STEP7 이후 localStorage 저장을 추가하고, 이후 Supabase/Firebase로 확장 가능하도록 구조화할 예정입니다.
