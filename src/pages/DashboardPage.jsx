import { Building2, Users, CalendarDays, MessageCircleQuestion, TrendingUp } from 'lucide-react'
import { StatCard, Badge } from '../components/UI'
import { fmtDate, fmtTime } from '../lib/constants'

export default function DashboardPage({ data }) {
  const { properties, leads, visits, faqs } = data

  return (
    <div>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-sub">Données synchronisées en temps réel avec Supabase</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Biens actifs" value={properties.filter(p => p.status === 'available').length} color="text-emerald-400" icon={Building2} />
        <StatCard label="Total leads" value={leads.length} color="text-blue-400" icon={Users} />
        <StatCard label="Visites prévues" value={visits.filter(v => ['scheduled', 'confirmed'].includes(v.status)).length} color="text-amber-400" icon={CalendarDays} />
        <StatCard label="FAQs actives" value={faqs.filter(f => f.active).length} color="text-purple-400" icon={MessageCircleQuestion} />
        <StatCard label="Conversions" value={leads.filter(l => l.pipeline_stage === 'Won').length} color="text-brand-500" icon={TrendingUp} />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        {/* Recent leads */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Derniers leads</h3>
          {leads.length === 0 ? (
            <p className="text-dark-200 text-sm py-6 text-center">Aucun lead</p>
          ) : (
            <div className="space-y-0">
              {[...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-dark-400/60 last:border-0">
                  <div>
                    <div className="text-[13px] font-medium">{l.name || 'Sans nom'}</div>
                    <div className="text-[11px] text-dark-200">{l.phone} · {fmtDate(l.created_at)}</div>
                  </div>
                  <Badge status={l.pipeline_stage} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming visits */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Prochaines visites</h3>
          {visits.filter(v => ['scheduled', 'confirmed'].includes(v.status)).length === 0 ? (
            <p className="text-dark-200 text-sm py-6 text-center">Aucune visite prévue</p>
          ) : (
            <div className="space-y-0">
              {visits.filter(v => ['scheduled', 'confirmed'].includes(v.status)).slice(0, 6).map((v) => {
                const lead = leads.find(l => l.id === v.lead_id)
                const prop = properties.find(p => p.id === v.property_id)
                return (
                  <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-dark-400/60 last:border-0">
                    <div>
                      <div className="text-[13px] font-medium">{fmtDate(v.scheduled_at)} · {fmtTime(v.scheduled_at)}</div>
                      <div className="text-[11px] text-dark-200">{lead?.name || '—'} → {prop?.title || '—'}</div>
                    </div>
                    <Badge status={v.status} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
