import { useState, useEffect } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { SECTOR_LABELS } from '../lib/constants'
import { Bot, Phone, Zap, MessageSquare, Users, Building2, ShoppingCart, Heart, UtensilsCrossed, Loader2, Plus, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const SECTOR_ICONS = { real_estate: Building2, ecommerce: ShoppingCart, medical: Heart, restaurant: UtensilsCrossed }
const SECTOR_COLORS = { real_estate: '#3b82f6', ecommerce: '#10b981', medical: '#f43f5e', restaurant: '#f59e0b' }

export default function AgencyMapPage() {
  const { tenant, agents } = useTenant()
  const [numbers, setNumbers] = useState([])
  const [leadCounts, setLeadCounts] = useState({})
  const [msgCounts, setMsgCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    loadData()
  }, [tenant])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load WhatsApp numbers
      const { data: nums } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('tenant_id', tenant.id)
      setNumbers(nums || [])

      // Load lead counts per agent
      const { data: leads } = await supabase
        .from('leads')
        .select('agent_id')
        .eq('tenant_id', tenant.id)

      const lc = {}
      for (const l of (leads || [])) {
        lc[l.agent_id] = (lc[l.agent_id] || 0) + 1
      }
      setLeadCounts(lc)

      // Load message counts per agent (via leads)
      const { data: msgs } = await supabase
        .from('messages')
        .select('lead_id')
        .eq('tenant_id', tenant.id)

      // Rough count — we'll just show total messages
      setMsgCounts({ total: (msgs || []).length })
    } catch (err) {
      console.error('AgencyMap load error:', err)
    }
    setLoading(false)
  }

  // Group agents by sector
  const sectorGroups = {}
  for (const agent of agents) {
    if (!sectorGroups[agent.sector]) sectorGroups[agent.sector] = []
    sectorGroups[agent.sector].push(agent)
  }

  const totalLeads = Object.values(leadCounts).reduce((a, b) => a + b, 0)
  const totalAgents = agents.length
  const activeAgents = agents.filter(a => a.is_active).length

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={22} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Agency Map</h1>
      <p className="page-sub">Vue d'ensemble de votre écosystème IA</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Secteurs actifs', value: Object.keys(sectorGroups).length, icon: Zap, color: '#0071e3' },
          { label: 'Agents déployés', value: `${activeAgents}/${totalAgents}`, icon: Bot, color: '#5856d6' },
          { label: 'Numéros WhatsApp', value: numbers.length, icon: Phone, color: '#10b981' },
          { label: 'Total leads', value: totalLeads, icon: Users, color: '#3b82f6' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
            className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <span className="text-[10px] text-dark-200 uppercase tracking-widest font-semibold">{s.label}</span>
            </div>
            <div className="text-2xl font-display font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Sector Map */}
      <div className="space-y-6">
        {Object.entries(sectorGroups).map(([sectorKey, sectorAgents], si) => {
          const SectorIcon = SECTOR_ICONS[sectorKey] || Zap
          const color = SECTOR_COLORS[sectorKey] || '#0071e3'
          const sectorNums = numbers.filter(n => {
            const agentIds = sectorAgents.map(a => a.id)
            return agentIds.includes(n.agent_id) || (!n.agent_id && si === 0) // unassigned go to first sector
          })

          return (
            <motion.div key={sectorKey} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + si * 0.15 }}
              className="card overflow-hidden">
              {/* Sector Header */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-dark-400/60"
                style={{ background: `linear-gradient(90deg, ${color}08, transparent)` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                  <SectorIcon size={20} style={{ color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-base">{SECTOR_LABELS[sectorKey] || sectorKey}</h3>
                  <p className="text-xs text-dark-200">{sectorAgents.length} agent{sectorAgents.length > 1 ? 's' : ''} · {sectorNums.length} numéro{sectorNums.length > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} style={{ color }} />
                  <span className="text-xs font-medium" style={{ color }}>Actif</span>
                </div>
              </div>

              {/* Agents in this sector */}
              <div className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sectorAgents.map(agent => {
                    const agentLeads = leadCounts[agent.id] || 0
                    const agentNums = numbers.filter(n => n.agent_id === agent.id)

                    return (
                      <div key={agent.id} className="p-4 rounded-xl bg-dark-700 border border-dark-400/60 hover:border-dark-300 transition-colors">
                        {/* Agent header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: color }}>
                            {agent.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{agent.name}</div>
                            <div className="text-[10px] text-dark-200">{agent.tone || 'professional'} · {(agent.language || ['fr']).join(', ')}</div>
                          </div>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.is_active ? 'bg-emerald-500' : 'bg-dark-300'}`} />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 rounded-lg bg-dark-600">
                            <div className="text-xs font-bold">{agentLeads}</div>
                            <div className="text-[9px] text-dark-200">Leads</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-dark-600">
                            <div className="text-xs font-bold">{agentNums.length}</div>
                            <div className="text-[9px] text-dark-200">Numéros</div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-dark-600">
                            <div className="text-xs font-bold" style={{ color: agent.is_active ? '#10b981' : '#64748b' }}>
                              {agent.is_active ? 'ON' : 'OFF'}
                            </div>
                            <div className="text-[9px] text-dark-200">Statut</div>
                          </div>
                        </div>

                        {/* Connected numbers */}
                        {agentNums.length > 0 && (
                          <div className="space-y-1">
                            {agentNums.map(n => (
                              <div key={n.id} className="flex items-center gap-2 text-[11px] text-dark-100">
                                <Phone size={10} className="text-emerald-400" />
                                {n.phone_number}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add agent card */}
                  <div className="p-4 rounded-xl border border-dashed border-dark-400 flex flex-col items-center justify-center gap-2 text-dark-200 hover:text-dark-50 hover:border-dark-300 transition-colors cursor-pointer min-h-[140px]">
                    <Plus size={20} />
                    <span className="text-xs">Nouvel agent</span>
                  </div>
                </div>
              </div>

              {/* Unassigned numbers for first sector */}
              {si === 0 && numbers.filter(n => !n.agent_id).length > 0 && (
                <div className="px-6 py-3 border-t border-dark-400/60 bg-dark-700/30">
                  <div className="text-[10px] text-dark-200 uppercase tracking-wider font-semibold mb-2">Numéros non-assignés</div>
                  <div className="flex flex-wrap gap-2">
                    {numbers.filter(n => !n.agent_id).map(n => (
                      <span key={n.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-500 text-xs text-dark-100">
                        <Phone size={10} className="text-amber-400" />
                        {n.phone_number}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}

        {/* Empty state */}
        {Object.keys(sectorGroups).length === 0 && (
          <div className="card p-12 text-center">
            <Bot size={32} className="text-dark-300 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Aucun agent encore</h3>
            <p className="text-sm text-dark-200 max-w-sm mx-auto">
              Créez votre premier agent dans l'Agent Builder pour commencer à construire votre agence IA.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
