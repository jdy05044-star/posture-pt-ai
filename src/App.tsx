import { Route, Routes } from 'react-router-dom'
import { AppStateProvider } from '@/state/AppState'
import Home from '@/pages/Home'
import Capture from '@/pages/Capture'
import Analyze from '@/pages/Analyze'
import Result from '@/pages/Result'
import Program from '@/pages/Program'
import Compare from '@/pages/Compare'
import Report from '@/pages/Report'

export default function App() {
  return (
    <AppStateProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/result" element={<Result />} />
        <Route path="/program" element={<Program />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </AppStateProvider>
  )
}
