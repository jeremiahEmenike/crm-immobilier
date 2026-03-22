import { useState, useEffect, useMemo } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { StatCard, Badge } from '../components/UI'
import { fmtDate, fmtTime, fmtPrice } from '../lib/constants'
import {
  Building2, Users, CalendarDays, MessageCircleQuestion,
  TrendingUp, Flame, Target, Clock, MessageSquare, Bot, Zap,
  ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

// ─── Tabs ─────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Vue d\'ensemble' },
  { key: 'pipeline', label: 'Pipeline & Leads' },
  { key: 'matching', label: 'Matching & ROI' },
]

// ─── Chart colors ─────────────────────────
const COLORS = {
  hot: '#EF4444',
  qualified: '#F59E0B',
  warm: '#3B82F6',
  cold: '#6B7280',
  brand: '#C9A84C',
  emerald: '#10B981',
  purple: '#8B5CF6',
  blue: '#3B82F6',
}

const CLASSIFICATION_COLORS = [COLORS.hot, COLORS.qualified, COLORS.warm, COLORS.cold]

// ─── Custom tooltip ───────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-700 border border-dark-400 rounded-lg px-3 py-2 shadow-xl">
      {label && <div className="text-[10px] text-dark-200 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="text-[12px] font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────
export default function DashboardPage({ data }) {
  const { tenant } = useTenant()
  const { properties, leads, visits, faqs } = data
  const [tab, setTab] = useState('overview')
  const [msgStats, setMsgStats] = useState({ total: 0, today: 0, byDay: [] })

  // ─── Fetch message stats ──────────────
  useEffect(() => {
    if (!tenant) return
    const fetchMsgStats = async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('role, created_at')
        .eq('tenant_id', tenant.id)

      if (!msgs) return

      const todayStr = new Date().toISOString().split('T')[0]
      const todayCount = msgs.filter(m => m.created_at?.startsWith(todayStr)).length

      // Group by day (last 14 days)
      const byDay = {}
      const now = new Date()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        byDay[key] = { date: key, label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), messages: 0 }
      }
      for (const m of msgs) {
        const key = m.created_at?.split('T')[0]
        if (byDay[key]) byDay[key].messages++
      }

      setMsgStats({ total: msgs.length, today: todayCount, byDay: Object.values(byDay) })
    }
    fetchMsgStats()
  }, [tenant])

  // ─── Computed KPIs ────────────────────
  const kpis = useMemo(() => {
    const activeProps = properties.filter(p => p.status === 'available').length
    const totalLeads = leads.length
    const hotLeads = leads.filter(l => l.score >= 16).length
    const qualifiedLeads = leads.filter(l => l.score >= 11 && l.score < 16).length
    const warmLeads = leads.filter(l => l.score >= 6 && l.score < 11).length
    const coldLeads = leads.filter(l => l.score < 6).length
    const avgScore = totalLeads > 0 ? (leads.reduce((s, l) => s + (l.score || 0), 0) / totalLeads).toFixed(1) : '0'
    const pendingVisits = visits.filter(v => ['scheduled', 'confirmed'].includes(v.status)).length
    const completedVisits = visits.filter(v => v.status === 'completed').length
    const wonLeads = leads.filter(l => l.pipeline_stage === 'Won').length
    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(0) : '0'
    const matchedLeads = leads.filter(l => ['Matched', 'Visit_Scheduled', 'Won'].includes(l.pipeline_stage)).length
    const matchRate = totalLeads > 0 ? ((matchedLeads / totalLeads) * 100).toFixed(0) : '0'

    return {
      activeProps, totalLeads, hotLeads, qualifiedLeads, warmLeads, coldLeads,
      avgScore, pendingVisits, completedVisits, wonLeads, conversionRate,
      matchedLeads, matchRate
    }
  }, [properties, leads, visits])

  // ─── Chart data ───────────────────────
  const classificationData = useMemo(() => [
    { name: 'HOT', value: kpis.hotLeads },
    { name: 'Qualifié', value: kpis.qualifiedLeads },
    { name: 'Warm', value: kpis.warmLeads },
    { name: 'Cold', value: kpis.coldLeads },
  ].filter(d => d.value > 0), [kpis])

  const pipelineData = useMemo(() => {
    const stages = ['New', 'Contacted', 'Qualified', 'Matched', 'Visit_Scheduled', 'Won', 'Lost', 'Nurturing']
    const labels = { New: 'Nouveau', Contacted: 'Contacté', Qualified: 'Qualifié', Matched: 'Matché', Visit_Scheduled: 'Visite', Won: 'Converti', Lost: 'Perdu', Nurturing: 'Nurturing' }
    return stages.map(s => ({
      stage: labels[s] || s,
      count: leads.filter(l => l.pipeline_stage === s).length
    }))
  }, [leads])

  const intentData = useMemo(() => {
    const intents = {}
    leads.forEach(l => {
      const i = l.intent || 'Non défini'
      intents[i] = (intents[i] || 0) + 1
    })
    return Object.entries(intents).map(([name, value]) => ({ name, value }))
  }, [leads])

  const zoneData = useMemo(() => {
    const zones = {}
    leads.forEach(l => {
      if (l.zone) zones[l.zone] = (zones[l.zone] || 0) + 1
    })
    return Object.entries(zones)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [leads])

  const supplyDemand = useMemo(() => {
    const zones = new Set()
    leads.forEach(l => l.zone && zones.add(l.zone))
    properties.forEach(p => p.zone && zones.add(p.zone))
    return [...zones].map(z => ({
      zone: z,
      demand: leads.filter(l => l.zone === z).length,
      supply: properties.filter(p => p.zone === z && p.status === 'available').length,
    })).sort((a, b) => (b.demand - b.supply) - (a.demand - a.supply))
  }, [leads, properties])

  // ─── Alerts ───────────────────────────
  const alerts = useMemo(() => {
    const list = []
    const now = Date.now()
    leads.forEach(l => {
      if (l.score >= 16 && l.last_contact) {
        const h = (now - new Date(l.last_contact).getTime()) / 3600000
        if (h > 24) list.push({ type: 'critical', text: `${l.name || l.phone} — HOT lead sans contact depuis ${Math.floor(h)}h`, lead: l })
      }
      if (['Matched'].includes(l.pipeline_stage) && l.last_contact) {
        const h = (now - new Date(l.last_contact).getTime()) / 3600000
        if (h > 48) list.push({ type: 'warning', text: `${l.name || l.phone} — Matché sans visite depuis ${Math.floor(h / 24)}j`, lead: l })
      }
    })
    return list
  }, [leads])

  // ─── Render ───────────────────────────
  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub">Performance et analytics en temps réel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-700 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-[12px] font-medium transition-all ${
              tab === t.key
                ? 'bg-brand-500/20 text-brand-500'
                : 'text-dark-200 hover:text-dark-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════ */}
      {/* TAB 1: VUE D'ENSEMBLE              */}
      {/* ═══════════════════════════════════ */}
      {tab === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard label="Total leads" value={kpis.totalLeads} color="text-blue-400" icon={Users} />
            <StatCard label="Leads HOT" value={kpis.hotLeads} color="text-red-400" icon={Flame} />
            <StatCard label="Score moyen" value={kpis.avgScore} color="text-amber-400" icon={Target} />
            <StatCard label="Visites prévues" value={kpis.pendingVisits} color="text-emerald-400" icon={CalendarDays} />
            <StatCard label="Conversion" value={`${kpis.conversionRate}%`} color="text-brand-500" icon={TrendingUp} />
            <StatCard label="Messages IA" value={msgStats.total} color="text-purple-400" icon={MessageSquare} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            {/* Classification donut */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Classification des leads</h3>
              {classificationData.length === 0 ? (
                <p className="text-dark-300 text-[12px] text-center py-8">Aucun lead</p>
              ) : (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={classificationData}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={75}
                        paddingAngle={3} dataKey="value"
                        stroke="none"
                      >
                        {classificationData.map((_, i) => (
                          <Cell key={i} fill={CLASSIFICATION_COLORS[i % CLASSIFICATION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {classificationData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLASSIFICATION_COLORS[i] }} />
                    <span className="text-[11px] text-dark-200">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Intent breakdown */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Intentions</h3>
              {intentData.length === 0 ? (
                <p className="text-dark-300 text-[12px] text-center py-8">Aucun lead</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={intentData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#5D5F72' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9496A6' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Leads" fill={COLORS.brand} radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Message activity */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-1">Activité messages</h3>
              <p className="text-[11px] text-dark-200 mb-4">{msgStats.today} aujourd'hui · {msgStats.total} total</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={msgStats.byDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.brand} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.brand} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#5D5F72' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="messages" name="Messages" stroke={COLORS.brand} fill="url(#msgGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lists row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
            {/* Recent leads */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Derniers leads</h3>
              {leads.length === 0 ? (
                <p className="text-dark-300 text-[12px] text-center py-6">Aucun lead</p>
              ) : (
                <div className="space-y-0">
                  {[...leads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-dark-400/40 last:border-0">
                      <div>
                        <div className="text-[13px] font-medium">{l.name || 'Sans nom'}</div>
                        <div className="text-[11px] text-dark-200">{l.phone} · Score {l.score || 0}/20</div>
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
                <p className="text-dark-300 text-[12px] text-center py-6">Aucune visite prévue</p>
              ) : (
                <div className="space-y-0">
                  {visits.filter(v => ['scheduled', 'confirmed'].includes(v.status)).slice(0, 5).map(v => {
                    const lead = leads.find(l => l.id === v.lead_id)
                    const prop = properties.find(p => p.id === v.property_id)
                    return (
                      <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-dark-400/40 last:border-0">
                        <div>
                          <div className="text-[13px] font-medium">{fmtDate(v.scheduled_at)} · {fmtTime(v.scheduled_at)}</div>
                          <div className="text-[11px] text-dark-200">{lead?.name || '—'} → {prop?.title?.substring(0, 35) || '—'}</div>
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
      )}

      {/* ═══════════════════════════════════ */}
      {/* TAB 2: PIPELINE & LEADS            */}
      {/* ═══════════════════════════════════ */}
      {tab === 'pipeline' && (
        <div>
          {/* Pipeline funnel */}
          <div className="card p-5 mb-5">
            <h3 className="text-sm font-semibold mb-4">Funnel pipeline</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#9496A6' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5D5F72' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Leads" fill={COLORS.brand} radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="card p-5 mb-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" /> Alertes
              </h3>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] ${
                    a.type === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {a.type === 'critical' ? <Flame size={13} /> : <Clock size={13} />}
                    {a.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads table */}
          <div className="card p-0 overflow-x-auto">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold">Tous les leads</h3>
            </div>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  {['Nom', 'Téléphone', 'Score', 'Intent', 'Zone', 'Budget', 'Stage', 'Dernier contact'].map(h => (
                    <th key={h} className="table-head">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={8} className="table-cell text-center text-dark-300 py-8">Aucun lead</td></tr>
                ) : (
                  [...leads].sort((a, b) => (b.score || 0) - (a.score || 0)).map(l => (
                    <tr key={l.id} className="hover:bg-dark-500/30 transition-colors">
                      <td className="table-cell-main">{l.name || '—'}</td>
                      <td className="table-cell">{l.phone}</td>
                      <td className="table-cell">
                        <span className={`font-bold ${l.score >= 16 ? 'text-red-400' : l.score >= 11 ? 'text-amber-400' : l.score >= 6 ? 'text-blue-400' : 'text-dark-200'}`}>
                          {l.score || 0}/20
                        </span>
                      </td>
                      <td className="table-cell">{l.intent || '—'}</td>
                      <td className="table-cell">{l.zone || '—'}</td>
                      <td className="table-cell">{l.budget_max ? fmtPrice(l.budget_max) : '—'}</td>
                      <td className="table-cell"><Badge status={l.pipeline_stage} /></td>
                      <td className="table-cell text-[11px]">{l.last_contact ? fmtDate(l.last_contact) : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Top zones */}
          {zoneData.length > 0 && (
            <div className="card p-5 mt-5">
              <h3 className="text-sm font-semibold mb-4">Zones les plus demandées</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={zoneData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#5D5F72' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9496A6' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Leads" fill={COLORS.blue} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════ */}
      {/* TAB 3: MATCHING & ROI              */}
      {/* ═══════════════════════════════════ */}
      {tab === 'matching' && (
        <div>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatCard label="Taux matching" value={`${kpis.matchRate}%`} color="text-emerald-400" icon={Target} />
            <StatCard label="Visites planifiées" value={kpis.pendingVisits} color="text-amber-400" icon={CalendarDays} />
            <StatCard label="Visites effectuées" value={kpis.completedVisits} color="text-blue-400" icon={CalendarDays} />
            <StatCard label="Conversions" value={kpis.wonLeads} color="text-brand-500" icon={TrendingUp} />
          </div>

          {/* Supply vs Demand */}
          <div className="card p-5 mb-5">
            <h3 className="text-sm font-semibold mb-4">Offre vs Demande par zone</h3>
            {supplyDemand.length === 0 ? (
              <p className="text-dark-300 text-[12px] text-center py-8">Pas assez de données</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Zone', 'Demande (leads)', 'Offre (biens dispo)', 'Ratio', 'Signal'].map(h => (
                        <th key={h} className="table-head">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {supplyDemand.map(z => {
                      const ratio = z.supply > 0 ? (z.demand / z.supply).toFixed(1) : z.demand > 0 ? '∞' : '—'
                      const signal = z.demand > z.supply * 2
                        ? { text: 'Demande forte', color: 'text-red-400', bg: 'bg-red-500/10' }
                        : z.supply > z.demand * 2
                          ? { text: 'Surplus stock', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
                          : { text: 'Équilibré', color: 'text-blue-400', bg: 'bg-blue-500/10' }
                      return (
                        <tr key={z.zone} className="hover:bg-dark-500/30 transition-colors">
                          <td className="table-cell-main">{z.zone}</td>
                          <td className="table-cell">{z.demand}</td>
                          <td className="table-cell">{z.supply}</td>
                          <td className="table-cell font-mono text-[12px]">{ratio}</td>
                          <td className="table-cell">
                            <span className={`${signal.bg} ${signal.color} text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
                              {signal.text}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ROI */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Bot size={14} className="text-brand-500" /> ROI Automatisation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-dark-500 rounded-xl p-4">
                <div className="text-[10px] text-dark-200 uppercase tracking-wider mb-2">Messages IA</div>
                <div className="text-xl font-bold text-brand-500">{msgStats.total}</div>
                <div className="text-[10px] text-dark-300 mt-1">traités automatiquement</div>
              </div>
              <div className="bg-dark-500 rounded-xl p-4">
                <div className="text-[10px] text-dark-200 uppercase tracking-wider mb-2">Temps économisé</div>
                <div className="text-xl font-bold text-emerald-400">{Math.round(msgStats.total * 3 / 60)}h</div>
                <div className="text-[10px] text-dark-300 mt-1">~3min par message</div>
              </div>
              <div className="bg-dark-500 rounded-xl p-4">
                <div className="text-[10px] text-dark-200 uppercase tracking-wider mb-2">Équivalent agents</div>
                <div className="text-xl font-bold text-purple-400">{(msgStats.total * 3 / 60 / 8 / 22).toFixed(1)}</div>
                <div className="text-[10px] text-dark-300 mt-1">temps plein / mois</div>
              </div>
              <div className="bg-dark-500 rounded-xl p-4">
                <div className="text-[10px] text-dark-200 uppercase tracking-wider mb-2">Disponibilité</div>
                <div className="text-xl font-bold text-blue-400">24/7</div>
                <div className="text-[10px] text-dark-300 mt-1">nuits et weekends inclus</div>
              </div>
            </div>
          </div>

          {/* Properties performance */}
          <div className="card p-5 mt-5">
            <h3 className="text-sm font-semibold mb-4">Biens actifs</h3>
            {properties.length === 0 ? (
              <p className="text-dark-300 text-[12px] text-center py-6">Aucun bien</p>
            ) : (
              <div className="space-y-0">
                {properties.filter(p => p.status === 'available').map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-dark-400/40 last:border-0">
                    <div>
                      <div className="text-[13px] font-medium">{p.title?.substring(0, 45)}</div>
                      <div className="text-[11px] text-dark-200">{p.zone || '—'} · {fmtPrice(p.price)}</div>
                    </div>
                    <Badge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
