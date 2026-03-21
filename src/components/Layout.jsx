import { useState } from 'react'
import { useTenant } from '../hooks/useData'
import { LayoutDashboard, Building2, Users, CalendarDays, Clock, MessageCircleQuestion, Settings, LogOut, Zap, Menu, X } from 'lucide-react'
import NotificationBell from './NotificationBell'

const NAV = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'properties', label: 'Biens', icon: Building2 },
  { key: 'leads', label: 'Leads', icon: Users },
  { key: 'visits', label: 'Visites', icon: CalendarDays },
  { key: 'availability', label: 'Disponibilités', icon: Clock },
  { key: 'faqs', label: 'FAQs', icon: MessageCircleQuestion },
  { key: 'settings', label: 'Paramètres', icon: Settings },
]

export default function Layout({ page, onNavigate, children }) {
  const { tenant, logout } = useTenant()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigate = (key) => {
    onNavigate(key)
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-dark-400">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-dark-900" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-brand-500 font-bold tracking-[2px] uppercase">Cerberus</div>
            <div className="text-[10px] text-dark-200 tracking-wider">CRM IMMOBILIER</div>
          </div>
          <NotificationBell tenantId={tenant?.id} />
        </div>
        <div className="text-sm font-bold truncate mt-2">{tenant?.name}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-emerald-400">Supabase connecté</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={`sidebar-link w-full ${page === item.key ? 'active' : ''}`}
          >
            <item.icon size={17} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-dark-400">
        <div className="text-[11px] text-dark-200 mb-1 truncate">Connecté</div>
        <div className="text-xs font-medium truncate mb-3">{tenant?.email}</div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut size={14} />
          Se déconnecter
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[230px] bg-dark-700 border-r border-dark-400 flex-col flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-700 border-b border-dark-400 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Zap size={13} className="text-dark-900" />
          </div>
          <span className="text-sm font-bold">{tenant?.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell tenantId={tenant?.id} />
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-dark-500 text-dark-100">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-[270px] bg-dark-700 border-l border-dark-400 flex flex-col">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-dark-500 text-dark-100">
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
