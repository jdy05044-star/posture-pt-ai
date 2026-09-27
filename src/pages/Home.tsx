import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <p className="label-caption mb-2 tracking-wide">POSTURE SCREENING · PT ASSIST</p>
        <h1 className="text-2xl font-semibold text-clinical-900">자세 평가 및 운동 프로그램</h1>
        <p className="mt-3 text-sm leading-relaxed text-clinical-600">
          정면·측면·후면 사진으로 자세를 스크리닝하고,
          <br />
          PT의 판단을 돕는 운동 프로그램 초안을 구성합니다.
        </p>
      </div>

      <div className="card mb-6 p-4 text-sm text-clinical-600">
        <p className="mb-1 font-medium text-clinical-800">사용 전 안내</p>
        <p>
          이 앱은 질환을 진단하지 않으며, 의사의 진료를 대체하지 않습니다. 자세 스크리닝 및 PT 평가
          보조 목적으로만 사용해주세요.
        </p>
      </div>

      <button onClick={() => navigate('/capture')} className="btn-primary w-full py-4 text-base">
        자세 평가 시작
      </button>
    </div>
  )
}
