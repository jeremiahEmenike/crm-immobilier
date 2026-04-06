import { useState } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { SECTOR_LABELS } from '../lib/constants'
import {
  Building2, ShoppingCart, Heart, UtensilsCrossed,
  MessageSquare, Zap, FileText, Shield, Upload,
  Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Check, Save, AlertTriangle, Bot, Phone, Settings2,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Sector colors & icons ──────────────────
const COLORS = { real_estate: '#0071e3', ecommerce: '#30d158', medical: '#ff375f', restaurant: '#ff9f0a' }
const ICONS = { real_estate: Building2, ecommerce: ShoppingCart, medical: Heart, restaurant: UtensilsCrossed }

// ─── Default qualification questions per sector
const DEFAULT_QUESTIONS = {
  real_estate: [
    { key: 'budget', question: 'Quel est votre budget maximum ?', type: 'open', required: true },
    { key: 'location', question: 'Quelle zone ou quartier recherchez-vous ?', type: 'open', required: true },
    { key: 'property_type', question: 'Quel type de bien recherchez-vous ?', type: 'choice', options: ['Appartement', 'Villa', 'Maison', 'Terrain', 'Bureau'], required: true },
    { key: 'rooms', question: 'Combien de chambres minimum ?', type: 'open', required: false },
    { key: 'timeline', question: 'Quand souhaitez-vous emménager ?', type: 'choice', options: ['Immédiatement', 'Dans 1-3 mois', 'Dans 3-6 mois', 'Plus tard'], required: false },
  ],
  ecommerce: [
    { key: 'order_id', question: 'Quel est votre numéro de commande ?', type: 'open', required: false },
    { key: 'product_interest', question: 'Quel type de produit recherchez-vous ?', type: 'open', required: false },
    { key: 'budget', question: 'Quel est votre budget ?', type: 'open', required: false },
    { key: 'delivery_location', question: 'Où souhaitez-vous être livré ?', type: 'open', required: true },
  ],
  medical: [
    { key: 'reason', question: 'Quelle est la raison de votre visite ?', type: 'open', required: true },
    { key: 'symptoms', question: 'Avez-vous des symptômes particuliers ?', type: 'open', required: false },
    { key: 'urgency', question: 'Comment évaluez-vous l\'urgence ?', type: 'choice', options: ['Urgente', 'Normal', 'Suivi régulier'], required: true },
    { key: 'insurance', question: 'Avez-vous une assurance maladie ?', type: 'choice', options: ['Oui', 'Non'], required: false },
    { key: 'availability', question: 'Quelles sont vos disponibilités ?', type: 'open', required: true },
  ],
  restaurant: [
    { key: 'order_type', question: 'Livraison ou sur place ?', type: 'choice', options: ['Livraison', 'Sur place', 'À emporter'], required: true },
    { key: 'location', question: 'Quelle est votre adresse de livraison ?', type: 'open', required: false },
    { key: 'party_size', question: 'Combien de personnes ?', type: 'open', required: false },
    { key: 'allergies', question: 'Avez-vous des allergies alimentaires ?', type: 'open', required: false },
  ],
}

// ─── Default handoff rules ──────────────────
const DEFAULT_HANDOFF = [
  { trigger: 'L\'IA ne comprend pas 2 fois de suite', action: 'Escalade vers un humain', active: true },
  { trigger: 'Le client demande "parler à un humain"', action: 'Transfert immédiat', active: true },
  { trigger: 'Lead scoré HOT (>15/20)', action: 'Notification push au responsable', active: true },
  { trigger: 'Demande de remboursement / réclamation', action: 'Notification + mise en pause', active: false },
]

// ─── Section component ──────────────────────
function Section({ title, icon: Icon, color, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl bg-dark-600/50 border border-dark-400 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-dark-500/30 transition-colors text-left">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-sm">{title}</h3>
        </div>
        {open ? <ChevronDown size={16} className="text-dark-200" /> : <ChevronRight size={16} className="text-dark-200" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-dark-400/50 pt-4">{children}</div>}
    </div>
  )
}

// ─── Question editor ────────────────────────
function QuestionEditor({ questions, onChange, color }) {
  const addQuestion = () => {
    onChange([...questions, { key: `q_${Date.now()}`, question: '', type: 'open', required: false }])
  }

  const updateQ = (i, field, val) => {
    const next = [...questions]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  const removeQ = (i) => {
    onChange(questions.filter((_, j) => j !== i))
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={q.key || i} className="flex items-start gap-3 p-3 rounded-xl bg-dark-700/50 border border-dark-400/50 group">
          <GripVertical size={14} className="text-dark-300 mt-2.5 cursor-grab flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <input
              className="input text-sm"
              placeholder="Question..."
              value={q.question}
              onChange={e => updateQ(i, 'question', e.target.value)}
            />
            <div className="flex items-center gap-3">
              <select className="input w-auto text-xs py-1.5" value={q.type} onChange={e => updateQ(i, 'type', e.target.value)}>
                <option value="open">Réponse libre</option>
                <option value="choice">Choix multiple</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-dark-200 cursor-pointer">
                <input type="checkbox" checked={q.required} onChange={e => updateQ(i, 'required', e.target.checked)}
                  className="rounded border-dark-400" />
                Obligatoire
              </label>
            </div>
            {q.type === 'choice' && (
              <input
                className="input text-xs"
                placeholder="Options séparées par des virgules..."
                value={(q.options || []).join(', ')}
                onChange={e => updateQ(i, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
            )}
          </div>
          <button onClick={() => removeQ(i)} className="text-dark-300 hover:text-red-400 transition-colors mt-2 opacity-0 group-hover:opacity-100">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-dark-400 text-xs text-dark-200 hover:border-dark-300 hover:text-dark-100 transition-colors">
        <Plus size={12} /> Ajouter une question
      </button>
    </div>
  )
}

// ─── Main page ──────────────────────────────
export default function TemplateConfigPage() {
  const { tenant, activeAgent } = useTenant()
  const sector = activeAgent?.sector || tenant?.default_sector || 'real_estate'
  const color = COLORS[sector]
  const SectorIcon = ICONS[sector]
  const [saving, setSaving] = useState(false)

  // Load from agent config or defaults
  const agentConfig = activeAgent?.config || {}
  const [questions, setQuestions] = useState(agentConfig.qualification_questions || DEFAULT_QUESTIONS[sector] || [])
  const [handoff, setHandoff] = useState(agentConfig.handoff_rules || DEFAULT_HANDOFF)
  const [faqDraft, setFaqDraft] = useState({ question: '', answer: '' })

  const toggleHandoff = (i) => {
    const next = [...handoff]
    next[i] = { ...next[i], active: !next[i].active }
    setHandoff(next)
  }

  const handleSave = async () => {
    if (!activeAgent?.id) {
      toast.error('Aucun agent actif.')
      return
    }
    setSaving(true)
    try {
      const updatedConfig = {
        ...agentConfig,
        qualification_questions: questions,
        handoff_rules: handoff,
      }
      await supabase
        .from('agents')
        .update({ config: updatedConfig, updated_at: new Date().toISOString() })
        .eq('id', activeAgent.id)
      toast.success('Template sauvegardé !')
    } catch (err) {
      console.error(err)
      toast.error('Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFaq = async () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) return
    try {
      await supabase.from('faqs').insert({
        tenant_id: tenant.id,
        category: SECTOR_LABELS[sector],
        question: faqDraft.question,
        answer: faqDraft.answer,
      })
      setFaqDraft({ question: '', answer: '' })
      toast.success('FAQ ajoutée')
    } catch (err) {
      toast.error('Erreur')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
              <SectorIcon size={18} style={{ color }} />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight">
                Template {SECTOR_LABELS[sector]}
              </h1>
              <p className="text-xs text-dark-200">Configuration du template pour {activeAgent?.name || 'votre agent'}</p>
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: color }}>
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          Sauvegarder
        </button>
      </div>

      {/* 1. Qualification Questions */}
      <Section title="Questions de qualification" icon={MessageSquare} color={color} defaultOpen>
        <p className="text-xs text-dark-200 mb-4">
          Les questions que votre agent posera pour qualifier chaque prospect. L'ordre compte — l'agent les posera de haut en bas.
        </p>
        <QuestionEditor questions={questions} onChange={setQuestions} color={color} />
      </Section>

      {/* 2. Handoff & Escalade */}
      <Section title="Règles de handoff" icon={Shield} color={color}>
        <p className="text-xs text-dark-200 mb-4">
          Quand l'agent doit-il passer la main à un humain ? Configurez les déclencheurs d'escalade.
        </p>
        <div className="space-y-3">
          {handoff.map((rule, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-dark-700/50 border border-dark-400/50">
              <button onClick={() => toggleHandoff(i)} className="flex-shrink-0">
                {rule.active ? (
                  <div className="w-10 h-5 rounded-full relative" style={{ background: color }}>
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
                  </div>
                ) : (
                  <div className="w-10 h-5 rounded-full bg-dark-400 relative">
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-dark-200 shadow" />
                  </div>
                )}
              </button>
              <div className="flex-1">
                <div className="text-sm font-medium">{rule.trigger}</div>
                <div className="text-xs text-dark-200 mt-0.5">→ {rule.action}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. FAQ / Knowledge Base */}
      <Section title="FAQs & Base de connaissances" icon={FileText} color={color}>
        <p className="text-xs text-dark-200 mb-4">
          Ajoutez les questions fréquentes et informations que votre agent doit connaître.
        </p>
        <div className="space-y-3 mb-4">
          <input
            className="input text-sm"
            placeholder="Question fréquente..."
            value={faqDraft.question}
            onChange={e => setFaqDraft({ ...faqDraft, question: e.target.value })}
          />
          <textarea
            className="input min-h-[60px] text-sm resize-none"
            placeholder="Réponse..."
            value={faqDraft.answer}
            onChange={e => setFaqDraft({ ...faqDraft, answer: e.target.value })}
          />
          <button onClick={handleAddFaq}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: `${color}15`, color }}>
            <Plus size={12} /> Ajouter cette FAQ
          </button>
        </div>
        <div className="text-[10px] text-dark-300 flex items-center gap-1.5">
          <AlertTriangle size={10} />
          Les FAQs existantes sont gérées depuis la page "FAQs" dans la sidebar.
        </div>
      </Section>

      {/* 4. Notifications */}
      <Section title="Notifications & Alertes" icon={Zap} color={color}>
        <p className="text-xs text-dark-200 mb-4">
          Configurez quand et comment vous êtes alerté.
        </p>
        <div className="space-y-3">
          {[
            { label: 'Lead HOT détecté', desc: 'Notification immédiate quand le score dépasse 15/20', active: true },
            { label: 'Nouveau lead capturé', desc: 'Chaque nouveau prospect qualifié', active: true },
            { label: 'Résumé quotidien', desc: 'Rapport de la journée envoyé chaque soir', active: false },
            { label: 'Escalade humaine', desc: 'Quand l\'agent ne peut pas répondre', active: true },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50 border border-dark-400/50">
              <div>
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-dark-200 mt-0.5">{n.desc}</div>
              </div>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer ${n.active ? '' : ''}`}
                style={{ background: n.active ? color : '#d2d2d7' }}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${n.active ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Footer note */}
      <div className="text-center py-6">
        <p className="text-xs text-dark-300">
          Toute la complexité (n8n, RAG vectoriel, API WhatsApp) est gérée automatiquement. <br />
          Vous configurez l'objectif — CERBERUS s'occupe du reste.
        </p>
      </div>
    </div>
  )
}
