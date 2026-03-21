import { useState, lazy, Suspense } from 'react'
import { useTenant, useCRMData } from './hooks/useData'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import { Loader2 } from 'lucide-react'

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'))
const LeadsPage = lazy(() => import('./pages/LeadsPage'))
const VisitsPage = lazy(() => import('./pages/VisitsPage'))
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage'))
const FaqsPage = lazy(() => import('./pages/FaqsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={22} className="text-brand-500 animate-spin" />
    </div>
  )
}

function CRMApp() {
  const { tenant, authLoading } = useTenant()
  const { data, loading, refresh } = useCRMData()
  const [page, setPage] = useState('dashboard')

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="text-brand-500 animate-spin" />
          <p className="text-dark-100 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!tenant) return <AuthPage />

  // Data loading
  if (loading && !data.properties.length && !data.leads.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="text-brand-500 animate-spin" />
          <p className="text-dark-100 text-sm">Synchronisation Supabase...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout page={page} onNavigate={setPage}>
      <Suspense fallback={<PageLoader />}>
        {page === 'dashboard' && <DashboardPage data={data} />}
        {page === 'properties' && <PropertiesPage data={data} refresh={refresh} />}
        {page === 'leads' && <LeadsPage data={data} refresh={refresh} />}
        {page === 'visits' && <VisitsPage data={data} refresh={refresh} />}
        {page === 'availability' && <AvailabilityPage />}
        {page === 'faqs' && <FaqsPage data={data} refresh={refresh} />}
        {page === 'settings' && <SettingsPage data={data} />}
      </Suspense>
    </Layout>
  )
}

export default CRMApp
