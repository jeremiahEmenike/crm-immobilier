import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
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
const AgentBuilderPage = lazy(() => import('./pages/AgentBuilderPage'))
const WhatsAppNumbersPage = lazy(() => import('./pages/WhatsAppNumbersPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={22} className="text-brand-500 animate-spin" />
    </div>
  )
}

function CRMApp() {
  const { tenant, authUser, authLoading, logout, refreshTenant } = useTenant()
  const { data, loading, refresh } = useCRMData()
  const [page, setPage] = useState('dashboard')
  const [onboardingDone, setOnboardingDone] = useState(null) // null = unknown, true/false
  const [transitioning, setTransitioning] = useState(false)

  // Sync onboarding state from tenant
  useEffect(() => {
    if (tenant) setOnboardingDone(!!tenant.onboarding_completed)
  }, [tenant])

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-100 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  // Not logged in at all — safe to redirect to landing
  if (!authUser) {
    return <Navigate to="/" replace />
  }

  // Authenticated but tenant failed to load — show error instead of redirecting (avoids loop)
// Authenticated but tenant failed to load — show error instead of redirecting (avoids loop)
  // 3. Utilisateur connecté mais tenant non chargé → affichage d'erreur (pas de redirection)
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Erreur de chargement du compte</h3>
          <p className="text-dark-200 text-sm">
            Impossible de charger les données de votre agence. Vérifiez votre connexion ou contactez le support.
          </p>
          <button onClick={logout} className="mt-4 btn-primary">
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  // Onboarding wizard for new users
  if (onboardingDone === false && !transitioning) {
    return <OnboardingWizard onComplete={async () => {
      setTransitioning(true)
      await refreshTenant()
      await refresh()
      setOnboardingDone(true)
      setTransitioning(false)
    }} />
  }

  // Transition screen after onboarding
  if (transitioning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center">
            <Loader2 size={24} className="text-brand-500 animate-spin" />
          </div>
          <p className="text-dark-50 font-medium text-sm">Préparation de votre espace...</p>
          <p className="text-dark-200 text-xs">Votre agent est en cours de déploiement</p>
        </div>
      </div>
    )
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
        {page === 'properties' && <PropertiesPage data={data} refresh={refresh} />}
        {page === 'leads' && <LeadsPage data={data} refresh={refresh} />}
        {page === 'conversations' && <ConversationsPage />}
        {page === 'visits' && <VisitsPage data={data} refresh={refresh} />}
        {page === 'availability' && <AvailabilityPage />}
        {page === 'faqs' && <FaqsPage data={data} refresh={refresh} />}
        {page === 'whatsapp' && <WhatsAppNumbersPage />}
        {page === 'settings' && <SettingsPage data={data} />}
      </Suspense>
    </Layout>
  )
}

export default CRMApp
