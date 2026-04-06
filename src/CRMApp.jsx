import { useState, useCallback, lazy, Suspense } from 'react'
import { useTenant, useCRMData } from './hooks/useData'
import Layout from './components/Layout'
import OnboardingWizard from './pages/OnboardingWizard'
import { Loader2 } from 'lucide-react'

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'))
const LeadsPage = lazy(() => import('./pages/LeadsPage'))
const VisitsPage = lazy(() => import('./pages/VisitsPage'))
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage'))
const ConversationsPage = lazy(() => import('./pages/ConversationsPage'))
const FaqsPage = lazy(() => import('./pages/FaqsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ConversationBuilderPage = lazy(() => import('./pages/ConversationBuilderPage'))
const AgentBuilderPage = lazy(() => import('./pages/AgentBuilderPage'))
const AgencyMapPage = lazy(() => import('./pages/AgencyMapPage'))
const TemplateConfigPage = lazy(() => import('./pages/TemplateConfigPage'))

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
  const [onboardingDone, setOnboardingDone] = useState(null) // null = unknown, true/false

  // Sync onboarding state from tenant
  const checkOnboarding = useCallback(() => {
    if (tenant) setOnboardingDone(!!tenant.onboarding_completed)
  }, [tenant])

  // Check on tenant load
  useState(() => { checkOnboarding() })
  // Re-check when tenant changes
  if (tenant && onboardingDone === null) checkOnboarding()

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

  // Not logged in — redirect to landing page (has auth modal)
  if (!tenant) {
    window.location.href = '/'
    return null
  }

  // Onboarding wizard for new users
  if (onboardingDone === false) {
    return <OnboardingWizard onComplete={() => { setOnboardingDone(true); refresh() }} />
  }

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
        {page === 'agents' && <AgentBuilderPage />}
        {page === 'agency-map' && <AgencyMapPage />}
        {page === 'templates' && <TemplateConfigPage />}
        {page === 'properties' && <PropertiesPage data={data} refresh={refresh} />}
        {page === 'leads' && <LeadsPage data={data} refresh={refresh} />}
        {page === 'conversations' && <ConversationsPage />}
        {page === 'visits' && <VisitsPage data={data} refresh={refresh} />}
        {page === 'availability' && <AvailabilityPage />}
        {page === 'faqs' && <FaqsPage data={data} refresh={refresh} />}
        {page === 'settings' && <SettingsPage data={data} />}
        {page === 'builder' && <ConversationBuilderPage />}
      </Suspense>
    </Layout>
  )
}

export default CRMApp
