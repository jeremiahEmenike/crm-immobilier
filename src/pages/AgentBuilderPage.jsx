import { useState, useEffect } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { SECTORS, AGENT_TONES, AGENT_MODELS, AGENT_LANGUAGES, SECTOR_LABELS } from '../lib/constants'
import { Modal, Field, Badge, EmptyState, ActionButtons } from '../components/UI'
import toast from 'react-hot-toast'
import {
  Bot, Plus, Pencil, Trash2, Power, PowerOff, Copy,
  Building2, ShoppingCart, Heart, UtensilsCrossed,
  Globe, Sparkles, Loader2, ChevronDown, ChevronUp
} from 'lucide-react'

const SECTOR_ICONS = { real_estate: Building2, ecommerce: ShoppingCart, medical: Heart, restaurant: UtensilsCrossed }

const EMPTY_AGENT = {
  name: '', sector: 'real_estate', tone: 'professional', model: 'gpt-4.1-mini',
  language: ['fr'], system_prompt: '', persona_instructions: '', avatar_url: '', settings: {}
}

export default function AgentBuilderPage() {
  const { tenant, agents, activeAgent, setActiveAgent, refreshAgents } = useTenant()
  const [templates, setTemplates] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_AGENT })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)

  // Load sector templates
  useEffect(() => {
    supabase.from('sector_templates').select('*').eq('is_active', true)
      .then(({ data }) => setTemplates(data || []))
  }, [])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_AGENT })
    setShowModal(true)
  }

  const openEdit = (agent) => {
    setEditing(agent)
    setForm({
      name: agent.name || '',
      sector: agent.sector || 'real_estate',
      tone: agent.tone || 'professional',
      model: agent.model || 'gpt-4.1-mini',
      language: agent.language || ['fr'],
      system_prompt: agent.system_prompt || '',
      persona_instructions: agent.persona_instructions || '',
      avatar_url: agent.avatar_url || '',
      settings: agent.settings || {},
    })
    setShowModal(true)
  }

  // Auto-fill system_prompt from template when sector changes (new agent only)
  const onSectorChange = (sector) => {
    setField('sector', sector)
    if (!editing) {
      const tmpl = templates.find(t => t.sector === sector)
      if (tmpl?.default_system_prompt) {
        setField('system_prompt', tmpl.default_system_prompt)
      }
    }
  }

  const toggleLang = (lang) => {
    setForm(f => {
      const langs = f.language.includes(lang)
        ? f.language.filter(l => l !== lang)
        : [...f.language, lang]
      return { ...f, language: langs.length > 0 ? langs : ['fr'] }
    })
  }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Le nom est requis')
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('agents')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editing.id)
        if (error) throw error
        toast.success('Agent mis à jour')
      } else {
        // Create agent
        const { data: newAgent, error } = await supabase.from('agents')
          .insert({ ...form, tenant_id: tenant.id })
          .select().single()
        if (error) throw error

        // Create default flow from template
        const tmpl = templates.find(t => t.sector === form.sector)
        if (tmpl) {
          await supabase.from('agent_flows').insert({
            agent_id: newAgent.id,
            tenant_id: tenant.id,
            name: tmpl.name,
            flow_graph: tmpl.default_flow_graph,
            variables_schema: tmpl.default_variables || {},
            is_active: true,
            version: 1,
          })
        }
        toast.success('Agent créé avec flux par défaut')
      }
      await refreshAgents()
      setShowModal(false)
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (agent) => {
    try {
      await supabase.from('agents')
        .update({ is_active: !agent.is_active, updated_at: new Date().toISOString() })
        .eq('id', agent.id)
      await refreshAgents()
      toast.success(agent.is_active ? 'Agent désactivé' : 'Agent activé')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const duplicate = async (agent) => {
    try {
      const { id, created_at, updated_at, ...rest } = agent
      const { data: newAgent, error } = await supabase.from('agents')
        .insert({ ...rest, name: `${agent.name} (copie)`, is_active: false })
        .select().single()
      if (error) throw error

      // Copy flows
      const { data: flows } = await supabase.from('agent_flows')
        .select('*').eq('agent_id', agent.id)
      for (const flow of (flows || [])) {
        await supabase.from('agent_flows').insert({
          agent_id: newAgent.id, tenant_id: flow.tenant_id,
          name: flow.name, flow_graph: flow.flow_graph,
          variables_schema: flow.variables_schema, is_active: flow.is_active, version: 1,
        })
      }

      await refreshAgents()
      toast.success('Agent dupliqué')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (agent) => {
    if (!confirm(`Supprimer l'agent "${agent.name}" ? Cette action est irréversible.`)) return
    try {
      await supabase.from('agents').delete().eq('id', agent.id)
      await refreshAgents()
      if (activeAgent?.id === agent.id) setActiveAgent(null)
      toast.success('Agent supprimé')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot size={22} className="text-brand-500" /> Agent Builder
          </h1>
          <p className="text-sm text-dark-200 mt-1">
            Créez et gérez vos agents IA — {agents.length} agent{agents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nouvel Agent
        </button>
      </div>

      {/* Agent Cards */}
      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Aucun agent"
          description="Créez votre premier agent IA pour commencer"
          action={{ label: 'Créer un agent', onClick: openNew }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map(agent => {
            const SectorIcon = SECTOR_ICONS[agent.sector] || Bot
            const isSelected = activeAgent?.id === agent.id
            const isExpanded = expanded === agent.id

            return (
              <div
                key={agent.id}
                className={`bg-dark-700 border rounded-xl p-4 transition-all cursor-pointer
                  ${isSelected ? 'border-brand-500 ring-1 ring-brand-500/30' : 'border-dark-400 hover:border-dark-300'}`}
                onClick={() => setActiveAgent(agent)}
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: SECTORS.find(s => s.key === agent.sector)?.color + '22' }}
                  >
                    <SectorIcon size={20} style={{ color: SECTORS.find(s => s.key === agent.sector)?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{agent.name}</h3>
                      {isSelected && <Badge className="bg-brand-500/15 text-brand-500">Actif</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={agent.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-dark-200/15 text-dark-200'}>
                        {agent.is_active ? 'Activé' : 'Désactivé'}
                      </Badge>
                      <span className="text-xs text-dark-200">{SECTOR_LABELS[agent.sector]}</span>
                    </div>
                  </div>
                </div>

                {/* Quick info */}
                <div className="mt-3 flex items-center gap-3 text-xs text-dark-200">
                  <span className="flex items-center gap-1"><Globe size={12} /> {(agent.language || ['fr']).join(', ')}</span>
                  <span className="flex items-center gap-1"><Sparkles size={12} /> {agent.model || 'gpt-4.1-mini'}</span>
                </div>

                {/* Expandable system prompt preview */}
                {agent.system_prompt && (
                  <button
                    className="mt-3 text-xs text-dark-200 hover:text-dark-50 flex items-center gap-1 w-full text-left"
                    onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : agent.id) }}
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Prompt système
                  </button>
                )}
                {isExpanded && agent.system_prompt && (
                  <p className="mt-2 text-xs text-dark-200 bg-dark-600 rounded-lg p-3 line-clamp-6">
                    {agent.system_prompt}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-1 border-t border-dark-500 pt-3">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(agent) }}
                    className="p-2 rounded-lg hover:bg-dark-500 text-dark-200 hover:text-dark-50" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleActive(agent) }}
                    className="p-2 rounded-lg hover:bg-dark-500 text-dark-200 hover:text-dark-50"
                    title={agent.is_active ? 'Désactiver' : 'Activer'}>
                    {agent.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); duplicate(agent) }}
                    className="p-2 rounded-lg hover:bg-dark-500 text-dark-200 hover:text-dark-50" title="Dupliquer">
                    <Copy size={14} />
                  </button>
                  <div className="flex-1" />
                  <button onClick={(e) => { e.stopPropagation(); remove(agent) }}
                    className="p-2 rounded-lg hover:bg-red-500/15 text-dark-200 hover:text-red-400" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editing ? `Modifier ${editing.name}` : 'Nouvel Agent'} onClose={() => setShowModal(false)} wide>
          <div className="space-y-4">
            {/* Row 1: Name + Sector */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom de l'agent">
                <input className="input" placeholder="Ex: Ama, Dr. Bot..." value={form.name}
                  onChange={e => setField('name', e.target.value)} />
              </Field>
              <Field label="Secteur">
                <select className="input" value={form.sector} onChange={e => onSectorChange(e.target.value)}>
                  {SECTORS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </Field>
            </div>

            {/* Row 2: Tone + Model */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ton de communication">
                <select className="input" value={form.tone} onChange={e => setField('tone', e.target.value)}>
                  {AGENT_TONES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Modèle LLM">
                <select className="input" value={form.model} onChange={e => setField('model', e.target.value)}>
                  {AGENT_MODELS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </Field>
            </div>

            {/* Languages */}
            <Field label="Langues">
              <div className="flex flex-wrap gap-2">
                {AGENT_LANGUAGES.map(lang => (
                  <button
                    key={lang.key}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${form.language.includes(lang.key)
                        ? 'bg-brand-500/20 text-brand-500 border border-brand-500/40'
                        : 'bg-dark-600 text-dark-200 border border-dark-400 hover:border-dark-300'}`}
                    onClick={() => toggleLang(lang.key)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* System Prompt */}
            <Field label="Prompt système">
              <textarea className="input min-h-[120px]" placeholder="Instructions principales pour l'agent..."
                value={form.system_prompt} onChange={e => setField('system_prompt', e.target.value)} />
            </Field>

            {/* Persona Instructions */}
            <Field label="Instructions de personnalité (optionnel)">
              <textarea className="input min-h-[80px]" placeholder="Ex: Utilise des emojis, vouvoie toujours, sois concis..."
                value={form.persona_instructions} onChange={e => setField('persona_instructions', e.target.value)} />
            </Field>

            {/* Avatar URL */}
            <Field label="Avatar URL (optionnel)">
              <input className="input" placeholder="https://..." value={form.avatar_url}
                onChange={e => setField('avatar_url', e.target.value)} />
            </Field>

            <ActionButtons
              onSave={save}
              onCancel={() => setShowModal(false)}
              saving={saving}
              saveLabel={editing ? 'Mettre à jour' : 'Créer l\'agent'}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
