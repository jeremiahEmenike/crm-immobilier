import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useTenant } from './hooks/useData'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const CRMApp = lazy(() => import('./CRMApp'))

function Loader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e8e8ed', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function LandingOrRedirect() {
  const { authUser, authLoading } = useTenant()
  if (authLoading) return <Loader />
  if (authUser) return <Navigate to="/app" replace />
  return <LandingPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<LandingOrRedirect />} />
          <Route path="/app/*" element={<CRMApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
