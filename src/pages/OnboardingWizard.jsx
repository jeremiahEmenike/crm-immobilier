import { useState, useEffect, useRef, useCallback } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { SECTOR_LABELS } from '../lib/constants'
import {
  Building2, ShoppingCart, Heart, UtensilsCrossed,
  Check, Sparkles, X, Plus, GripVertical,
  Home, Sliders, User, Package, HelpCircle,
  Clock, Bell, MessageCircle, ChevronDown, ChevronUp,
  Trash2, ToggleLeft, ToggleRight, AlertCircle, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ═══════════════════════════════════════════════
// DESIGN TOKENS (White Apple aesthetic)
// ═══════════════════════════════════════════════
const T = {
  blue: '#0071e3',
  blueSoft: '#0071e310',
  blueGlow: '0 4px 14px rgba(0,113,227,.18)',
  text: '#1d1d1f',
  textSec: '#6e6e73',
  textTer: '#86868b',
  textQuat: '#aeaeb2',
  bg: '#ffffff',
  bgSec: '#f5f5f7',
  bgTer: '#fafafa',
  border: '#e8e8ed',
  borderLight: '#f0f0f5',
  green: '#34c759',
  red: '#ff3b30',
  amber: '#ff9f0a',
  radius: 16,
  radiusPill: 980,
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
}

// ═══════════════════════════════════════════════
// STEP CONFIGS
// ═══════════════════════════════════════════════
const STEPS = [
  { key: 'services', label: 'Services', icon: Home, desc: 'Services de votre agence' },
  { key: 'qualification', label: 'Qualification', icon: Sliders, desc: 'Questions de qualification' },
  { key: 'agent', label: 'Agent IA', icon: User, desc: 'Personnaliser Ama' },
  { key: 'properties', label: 'Biens', icon: Package, desc: 'Ajouter des biens' },
  { key: 'faqs', label: 'FAQs', icon: HelpCircle, desc: 'Questions fréquentes' },
  { key: 'availability', label: 'Disponibilité', icon: Clock, desc: 'Créneaux de visite' },
  { key: 'nurturing', label: 'Relance', icon: Bell, desc: 'Relance automatique' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: 'Connecter WhatsApp' },
]

// ─── DEFAULT SERVICES (7 services immobilier) ────
const DEFAULT_SERVICES = [
  { service_key: 'achat', label: 'Achat immobilier', description: 'Accompagnement achat de biens', sort_order: 0, default_on: true,
    questions: [
      { key: 'budget', type: 'open', question: 'Quel est votre budget maximum ?', required: true },
      { key: 'zone', type: 'open', question: 'Quelle zone ou quartier recherchez-vous ?', required: true },
      { key: 'property_type', type: 'choice', question: 'Quel type de bien ?', options: ['Appartement','Villa','Maison','Duplex','Terrain'], required: true },
      { key: 'rooms', type: 'open', question: 'Combien de chambres minimum ?', required: false },
      { key: 'timeline', type: 'choice', question: 'Quand souhaitez-vous emménager ?', options: ['Immédiatement','1-3 mois','3-6 mois','Plus tard'], required: false },
      { key: 'financing', type: 'choice', question: 'Avez-vous un financement prêt ?', options: ['Oui','En cours','Non'], required: false },
    ],
  },
  { service_key: 'location_longue', label: 'Location longue durée', description: 'Location résidentielle classique', sort_order: 1, default_on: true,
    questions: [
      { key: 'budget', type: 'open', question: 'Quel est votre budget loyer mensuel ?', required: true },
      { key: 'zone', type: 'open', question: 'Quelle zone ou quartier ?', required: true },
      { key: 'property_type', type: 'choice', question: 'Quel type de bien ?', options: ['Appartement','Villa','Maison','Studio'], required: true },
      { key: 'rooms', type: 'open', question: 'Combien de chambres ?', required: false },
      { key: 'move_date', type: 'open', question: 'Quand souhaitez-vous emménager ?', required: true },
    ],
  },
  { service_key: 'vente', label: 'Mise en vente', description: 'Mandat de vente pour propriétaires', sort_order: 2, default_on: true,
    questions: [
      { key: 'address', type: 'open', question: 'Où est situé votre bien ?', required: true },
      { key: 'property_type', type: 'choice', question: 'Quel type de bien ?', options: ['Appartement','Villa','Maison','Duplex','Terrain'], required: true },
      { key: 'surface', type: 'open', question: 'Quelle est la surface en m² ?', required: true },
      { key: 'rooms', type: 'open', question: 'Combien de chambres ?', required: false },
      { key: 'price', type: 'open', question: 'Quel prix de vente souhaitez-vous ?', required: true },
      { key: 'reason', type: 'open', question: 'Quelle est la raison de la vente ?', required: false },
    ],
  },
  { service_key: 'gestion_locative', label: 'Gestion locative & Mandat', description: 'Gestion complète pour bailleurs', sort_order: 3, default_on: false,
    questions: [
      { key: 'address', type: 'open', question: 'Où est situé votre bien ?', required: true },
      { key: 'property_type', type: 'choice', question: 'Quel type de bien ?', options: ['Appartement','Villa','Maison','Studio','Bureau'], required: true },
      { key: 'furnished', type: 'choice', question: 'Le bien est-il meublé ?', options: ['Oui','Non','Partiellement'], required: true },
      { key: 'rent_target', type: 'open', question: 'Quel loyer mensuel visez-vous ?', required: true },
      { key: 'availability', type: 'open', question: 'Quand le bien sera-t-il disponible ?', required: true },
    ],
  },
  { service_key: 'meuble', label: 'Résidences meublées', description: 'Locations courte et moyenne durée', sort_order: 4, default_on: false,
    questions: [
      { key: 'budget', type: 'open', question: 'Quel est votre budget ?', required: true },
      { key: 'zone', type: 'open', question: 'Quelle zone ?', required: true },
      { key: 'duration', type: 'choice', question: 'Quelle durée de séjour ?', options: ['< 1 mois','1-3 mois','3-6 mois','6+ mois'], required: true },
      { key: 'persons', type: 'open', question: 'Combien de personnes ?', required: true },
    ],
  },
  { service_key: 'investissement', label: 'Investissement patrimonial', description: 'Conseil et opportunités pour investisseurs', sort_order: 5, default_on: false,
    questions: [
      { key: 'budget', type: 'open', question: "Quel est votre budget d'investissement ?", required: true },
      { key: 'objective', type: 'choice', question: 'Quel est votre objectif ?', options: ['Rendement locatif','Plus-value','Patrimoine','Mixte'], required: true },
      { key: 'zone', type: 'open', question: 'Quelle zone vous intéresse ?', required: true },
      { key: 'property_type', type: 'choice', question: 'Quel type de bien ?', options: ['Appartement','Villa','Terrain','Immeuble','Indifférent'], required: false },
      { key: 'timeline', type: 'choice', question: "Quel est votre horizon d'investissement ?", options: ['Court terme (<2 ans)','Moyen terme (2-5 ans)','Long terme (>5 ans)'], required: false },
    ],
  },
  { service_key: 'autre', label: 'Autre demande', description: 'Demandes hors catégorie', sort_order: 6, default_on: true,
    questions: [
      { key: 'description', type: 'open', question: 'Décrivez votre besoin', required: true },
      { key: 'budget', type: 'open', question: 'Budget estimé ?', required: false },
      { key: 'zone', type: 'open', question: 'Zone concernée ?', required: false },
      { key: 'timeline', type: 'open', question: 'Délai souhaité ?', required: false },
    ],
  },
]

// ─── DEFAULT FAQs ────
const DEFAULT_FAQS = [
  { question: "Quels sont vos frais d'agence ?", answer: "Nos frais varient selon le type de transaction. Contactez-nous pour un devis personnalisé.", category: 'Paiement' },
  { question: 'Comment se passe une visite ?', answer: "Vous prenez rendez-vous, nous confirmons le créneau, et un agent vous accompagne sur place.", category: 'Visite' },
  { question: 'Quels documents faut-il fournir ?', answer: "Pour une location : pièce d'identité, justificatif de revenus, et dernier avis d'imposition. Pour un achat : pièce d'identité et attestation de financement.", category: 'Documents' },
]

// ─── DEFAULT AVAILABILITY ────
const DEFAULT_AVAILABILITY = [
  { day_of_week: 1, start_time: '08:00', end_time: '12:00' },
  { day_of_week: 1, start_time: '14:00', end_time: '18:00' },
  { day_of_week: 2, start_time: '08:00', end_time: '12:00' },
  { day_of_week: 2, start_time: '14:00', end_time: '18:00' },
  { day_of_week: 3, start_time: '08:00', end_time: '12:00' },
  { day_of_week: 3, start_time: '14:00', end_time: '18:00' },
  { day_of_week: 4, start_time: '08:00', end_time: '12:00' },
  { day_of_week: 4, start_time: '14:00', end_time: '18:00' },
  { day_of_week: 5, start_time: '08:00', end_time: '12:00' },
  { day_of_week: 5, start_time: '14:00', end_time: '17:00' },
  { day_of_week: 6, start_time: '09:00', end_time: '13:00' },
]

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const PROPERTY_TYPES_LIST = ['Appartement', 'Maison', 'Villa', 'Terrain', 'Bureau', 'Commerce', 'Duplex', 'Studio']
const TRANSACTION_TYPES_LIST = [{ key: 'sale', label: 'Vente' }, { key: 'rent', label: 'Location' }]


// ═══════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════
const cardStyle = {
  background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radius,
  padding: 20, transition: 'all .2s',
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  border: `1.5px solid ${T.border}`, background: T.bg,
  fontSize: 14, fontFamily: T.font, color: T.text, outline: 'none',
  transition: 'border-color .2s',
}

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 6,
  display: 'block', letterSpacing: '.02em',
}

const btnPrimary = (disabled) => ({
  padding: '12px 28px', borderRadius: T.radiusPill, border: 'none',
  background: disabled ? '#d2d2d7' : T.blue, color: '#fff',
  fontSize: 15, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
  boxShadow: disabled ? 'none' : T.blueGlow, fontFamily: T.font,
  display: 'inline-flex', alignItems: 'center', gap: 8,
  transition: 'all .2s',
})

const btnSecondary = {
  padding: '10px 20px', borderRadius: T.radiusPill,
  border: `1.5px solid ${T.border}`, background: T.bg,
  fontSize: 14, fontWeight: 600, color: T.textSec,
  cursor: 'pointer', fontFamily: T.font,
  display: 'inline-flex', alignItems: 'center', gap: 6,
}

function StepHeader({ title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: T.text, marginBottom: 8 }}>
        {title}
      </h1>
      <p style={{ fontSize: 15, color: T.textTer, maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </div>
  )
}

function Toggle({ on, onToggle, size = 'md' }) {
  const w = size === 'sm' ? 36 : 44
  const h = size === 'sm' ? 20 : 24
  const dot = size === 'sm' ? 16 : 20
  return (
    <button onClick={(e) => { e.stopPropagation(); onToggle() }} style={{
      width: w, height: h, borderRadius: h, border: 'none',
      background: on ? T.green : '#d2d2d7', cursor: 'pointer',
      position: 'relative', transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{
        width: dot, height: dot, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? w - dot - 2 : 2,
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)',
      }} />
    </button>
  )
}

function SkipNotice({ text }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 16px', borderRadius: 12,
      background: '#fff8e1', marginBottom: 24,
    }}>
      <AlertCircle size={16} color={T.amber} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#92400e' }}>{text}</span>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 1: SERVICES
// ═══════════════════════════════════════════════
function StepServices({ services, onChange }) {
  const toggleService = (idx) => {
    const updated = [...services]
    updated[idx] = { ...updated[idx], is_active: !updated[idx].is_active }
    onChange(updated)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepHeader
        title="Quels services proposez-vous ?"
        subtitle="Activez les services que votre agence offre. Ama saura exactement quoi répondre — et quoi refuser."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {services.map((svc, idx) => (
          <div key={svc.service_key} style={{
            ...cardStyle,
            borderColor: svc.is_active ? T.blue : T.border,
            background: svc.is_active ? T.blueSoft : T.bg,
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer',
          }} onClick={() => toggleService(idx)}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: svc.is_active ? `${T.blue}15` : T.bgSec,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {svc.is_active ? <Check size={18} color={T.blue} /> : <Home size={18} color={T.textQuat} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{svc.label}</div>
              <div style={{ fontSize: 13, color: T.textTer }}>{svc.description}</div>
            </div>
            <Toggle on={svc.is_active} onToggle={() => toggleService(idx)} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: T.textQuat, textAlign: 'center', marginTop: 20 }}>
        Vous pourrez modifier ces services à tout moment dans les paramètres.
      </p>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 2: QUALIFICATION QUESTIONS
// ═══════════════════════════════════════════════
function StepQualification({ services, onChange }) {
  const [expanded, setExpanded] = useState(null)
  const activeServices = services.filter(s => s.is_active)

  const getRealIdx = (svcIdx) => services.findIndex(s => s.service_key === activeServices[svcIdx].service_key)

  const toggleQuestion = (svcIdx, qIdx) => {
    const realIdx = getRealIdx(svcIdx)
    const updated = [...services]
    const qs = [...updated[realIdx].questions]
    qs[qIdx] = { ...qs[qIdx], required: !qs[qIdx].required }
    updated[realIdx] = { ...updated[realIdx], questions: qs }
    onChange(updated)
  }

  const removeQuestion = (svcIdx, qIdx) => {
    const realIdx = getRealIdx(svcIdx)
    const updated = [...services]
    const qs = [...updated[realIdx].questions]
    qs.splice(qIdx, 1)
    updated[realIdx] = { ...updated[realIdx], questions: qs }
    onChange(updated)
  }

  const addQuestion = (svcIdx) => {
    const realIdx = getRealIdx(svcIdx)
    const updated = [...services]
    const qs = [...updated[realIdx].questions]
    qs.push({ key: `custom_${Date.now()}`, type: 'open', question: '', required: false })
    updated[realIdx] = { ...updated[realIdx], questions: qs }
    onChange(updated)
  }

  const updateQuestionText = (svcIdx, qIdx, text) => {
    const realIdx = getRealIdx(svcIdx)
    const updated = [...services]
    const qs = [...updated[realIdx].questions]
    qs[qIdx] = { ...qs[qIdx], question: text }
    updated[realIdx] = { ...updated[realIdx], questions: qs }
    onChange(updated)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepHeader
        title="Questions de qualification"
        subtitle="Personnalisez les questions qu'Ama posera pour chaque service. Activez ou désactivez les questions obligatoires."
      />
      {activeServices.length === 0 && (
        <SkipNotice text="Aucun service activé. Retournez à l'étape précédente." />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeServices.map((svc, svcIdx) => {
          const isOpen = expanded === svcIdx
          return (
            <div key={svc.service_key} style={{ ...cardStyle, padding: 0 }}>
              <button onClick={() => setExpanded(isOpen ? null : svcIdx)} style={{
                width: '100%', padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sliders size={16} color={T.blue} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{svc.label}</div>
                    <div style={{ fontSize: 12, color: T.textTer }}>{svc.questions.length} questions</div>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18} color={T.textTer} /> : <ChevronDown size={18} color={T.textTer} />}
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${T.borderLight}` }}>
                  {svc.questions.map((q, qIdx) => (
                    <div key={q.key} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 0',
                      borderBottom: qIdx < svc.questions.length - 1 ? `1px solid ${T.borderLight}` : 'none',
                    }}>
                      <GripVertical size={14} color={T.textQuat} style={{ flexShrink: 0, opacity: .4 }} />
                      <div style={{ flex: 1 }}>
                        {q.key.startsWith('custom_') ? (
                          <input value={q.question} onChange={(e) => updateQuestionText(svcIdx, qIdx, e.target.value)}
                            placeholder="Votre question..." style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }} autoFocus />
                        ) : (
                          <span style={{ fontSize: 14, color: T.text }}>{q.question}</span>
                        )}
                        {q.type === 'choice' && q.options && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {q.options.map(o => (
                              <span key={o} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: T.bgSec, color: T.textTer }}>{o}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: q.required ? T.blue : T.textQuat }}>
                          {q.required ? 'Obligatoire' : 'Optionnel'}
                        </span>
                        <Toggle on={q.required} onToggle={() => toggleQuestion(svcIdx, qIdx)} size="sm" />
                        <button onClick={() => removeQuestion(svcIdx, qIdx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={14} color={T.textQuat} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addQuestion(svcIdx)}
                    style={{ ...btnSecondary, marginTop: 12, fontSize: 13, padding: '8px 16px' }}>
                    <Plus size={14} /> Ajouter une question
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 3: AGENT PERSONALIZATION
// ═══════════════════════════════════════════════
function StepAgent({ agent, onChange }) {
  const tones = [
    { key: 'professional', label: 'Professionnel', emoji: '👔', desc: 'Formel et courtois' },
    { key: 'friendly', label: 'Amical', emoji: '😊', desc: 'Chaleureux et accessible' },
    { key: 'casual', label: 'Décontracté', emoji: '✌️', desc: 'Relax et naturel' },
    { key: 'formal', label: 'Formel', emoji: '📋', desc: 'Strict et protocolaire' },
  ]
  const languages = [
    { key: 'fr', label: 'Français', flag: '🇫🇷' },
    { key: 'en', label: 'Anglais', flag: '🇬🇧' },
  ]
  const toggleLang = (langKey) => {
    const current = agent.language || ['fr']
    if (current.includes(langKey)) {
      if (current.length > 1) onChange({ ...agent, language: current.filter(l => l !== langKey) })
    } else {
      onChange({ ...agent, language: [...current, langKey] })
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <StepHeader title="Personnalisez votre agent" subtitle="Donnez un nom, un ton et une langue à votre assistante IA." />
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Nom de l'agent</label>
        <input value={agent.name} onChange={(e) => onChange({ ...agent, name: e.target.value })} placeholder="Ex: Ama" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Ton de communication</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {tones.map(t => {
            const sel = agent.tone === t.key
            return (
              <button key={t.key} onClick={() => onChange({ ...agent, tone: t.key })} style={{
                ...cardStyle, padding: '14px 16px',
                borderColor: sel ? T.blue : T.border, background: sel ? T.blueSoft : T.bg,
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{t.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: T.textTer }}>{t.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Langue(s)</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {languages.map(l => {
            const sel = (agent.language || ['fr']).includes(l.key)
            return (
              <button key={l.key} onClick={() => toggleLang(l.key)} style={{
                ...cardStyle, padding: '12px 20px',
                borderColor: sel ? T.blue : T.border, background: sel ? T.blueSoft : T.bg,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center',
              }}>
                <span style={{ fontSize: 20 }}>{l.flag}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: sel ? T.blue : T.text }}>{l.label}</span>
                {sel && <Check size={16} color={T.blue} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 4: PROPERTIES
// ═══════════════════════════════════════════════
function StepProperties({ properties, onChange }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', price: '', zone: '', property_type: 'Appartement',
    transaction_type: 'sale', rooms: '', surface: '', description: '',
  })

  const addProperty = () => {
    if (!form.title || !form.price || !form.zone) { toast.error('Titre, prix et zone sont obligatoires'); return }
    onChange([...properties, { ...form, price: Number(form.price), rooms: form.rooms ? Number(form.rooms) : null, surface: form.surface ? Number(form.surface) : null }])
    setForm({ title: '', price: '', zone: '', property_type: 'Appartement', transaction_type: 'sale', rooms: '', surface: '', description: '' })
    setShowForm(false)
    toast.success('Bien ajouté')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepHeader title="Ajoutez vos biens" subtitle="Ajoutez quelques biens pour qu'Ama puisse commencer à proposer des matches. Vous pourrez en ajouter plus tard." />
      <SkipNotice text="Vous pouvez sauter cette étape et ajouter vos biens plus tard depuis le CRM." />
      {properties.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {properties.map((p, idx) => (
            <div key={idx} style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.title}</div>
                <div style={{ fontSize: 12, color: T.textTer }}>{p.zone} · {new Intl.NumberFormat('fr-FR').format(p.price)} FCFA · {p.property_type}</div>
              </div>
              <button onClick={() => onChange(properties.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <Trash2 size={16} color={T.red} />
              </button>
            </div>
          ))}
        </div>
      )}
      {showForm ? (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Titre *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Villa 4 chambres Lomé" style={inputStyle} /></div>
            <div><label style={labelStyle}>Zone *</label><input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} placeholder="Agoe, Tokoin..." style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Prix (FCFA) *</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="50000000" style={inputStyle} /></div>
            <div><label style={labelStyle}>Type</label><select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})} style={inputStyle}>{PROPERTY_TYPES_LIST.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Transaction</label><select value={form.transaction_type} onChange={e => setForm({...form, transaction_type: e.target.value})} style={inputStyle}>{TRANSACTION_TYPES_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Chambres</label><input type="number" value={form.rooms} onChange={e => setForm({...form, rooms: e.target.value})} placeholder="3" style={inputStyle} /></div>
            <div><label style={labelStyle}>Surface (m²)</label><input type="number" value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} placeholder="120" style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Belle villa avec jardin..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addProperty} style={btnPrimary(false)}><Check size={16} /> Ajouter</button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{
          ...cardStyle, width: '100%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          border: `2px dashed ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 14, fontFamily: T.font,
        }}><Plus size={18} /> Ajouter un bien</button>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 5: FAQs
// ═══════════════════════════════════════════════
function StepFaqs({ faqs, onChange }) {
  const [editIdx, setEditIdx] = useState(null)
  const addFaq = () => { onChange([...faqs, { question: '', answer: '', category: 'Général' }]); setEditIdx(faqs.length) }
  const updateFaq = (idx, field, val) => { const u = [...faqs]; u[idx] = { ...u[idx], [field]: val }; onChange(u) }
  const removeFaq = (idx) => { onChange(faqs.filter((_, i) => i !== idx)); if (editIdx === idx) setEditIdx(null) }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepHeader title="Questions fréquentes" subtitle="Ajoutez les FAQs que vos clients posent souvent. Ama les utilisera pour répondre instantanément." />
      <SkipNotice text="Des FAQs par défaut sont pré-remplies. Modifiez-les ou ajoutez les vôtres." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {faqs.map((faq, idx) => (
          <div key={idx} style={cardStyle}>
            {editIdx === idx ? (
              <div>
                <div style={{ marginBottom: 10 }}><label style={labelStyle}>Question</label><input value={faq.question} onChange={e => updateFaq(idx, 'question', e.target.value)} style={inputStyle} placeholder="Ex: Quels sont vos frais d'agence ?" /></div>
                <div style={{ marginBottom: 10 }}><label style={labelStyle}>Réponse</label><textarea value={faq.answer} onChange={e => updateFaq(idx, 'answer', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Réponse détaillée..." /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditIdx(null)} style={btnPrimary(!faq.question || !faq.answer)} disabled={!faq.question || !faq.answer}><Check size={14} /> OK</button>
                  <button onClick={() => removeFaq(idx)} style={{ ...btnSecondary, color: T.red, borderColor: '#fecaca' }}><Trash2 size={14} /> Supprimer</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditIdx(idx)} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{faq.question || '(question vide)'}</div>
                <div style={{ fontSize: 13, color: T.textTer, lineHeight: 1.4 }}>{faq.answer || '(réponse vide)'}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={addFaq} style={{
        ...cardStyle, width: '100%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        border: `2px dashed ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 14, fontFamily: T.font,
      }}><Plus size={18} /> Ajouter une FAQ</button>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 6: AVAILABILITY
// ═══════════════════════════════════════════════
function StepAvailability({ slots, onChange }) {
  const grouped = [1,2,3,4,5,6,0].map(day => ({
    day, name: DAY_NAMES[day],
    slots: slots.filter(s => s.day_of_week === day),
  }))

  const toggleDay = (day) => {
    const daySlots = slots.filter(s => s.day_of_week === day)
    if (daySlots.length > 0) {
      onChange(slots.filter(s => s.day_of_week !== day))
    } else {
      onChange([...slots,
        { day_of_week: day, start_time: '08:00', end_time: '12:00' },
        { day_of_week: day, start_time: '14:00', end_time: '18:00' },
      ])
    }
  }

  const updateSlot = (slotIdx, field, val) => {
    const updated = [...slots]; updated[slotIdx] = { ...updated[slotIdx], [field]: val }; onChange(updated)
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <StepHeader title="Créneaux de disponibilité" subtitle="Configurez les heures pendant lesquelles Ama peut proposer des visites à vos clients." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {grouped.map(g => (
          <div key={g.day} style={{
            ...cardStyle, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            opacity: g.slots.length > 0 ? 1 : .5,
          }}>
            <Toggle on={g.slots.length > 0} onToggle={() => toggleDay(g.day)} size="sm" />
            <div style={{ width: 80, fontSize: 14, fontWeight: 600, color: T.text }}>{g.name}</div>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {g.slots.length > 0 ? g.slots.map((slot, i) => {
                const realIdx = slots.indexOf(slot)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="time" value={slot.start_time} onChange={e => updateSlot(realIdx, 'start_time', e.target.value)} style={{ ...inputStyle, width: 100, padding: '6px 8px', fontSize: 13 }} />
                    <span style={{ color: T.textTer, fontSize: 12 }}>→</span>
                    <input type="time" value={slot.end_time} onChange={e => updateSlot(realIdx, 'end_time', e.target.value)} style={{ ...inputStyle, width: 100, padding: '6px 8px', fontSize: 13 }} />
                  </div>
                )
              }) : <span style={{ fontSize: 13, color: T.textQuat }}>Fermé</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 7: NURTURING
// ═══════════════════════════════════════════════
function StepNurturing({ nurturing, onChange }) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <StepHeader title="Relance automatique" subtitle="Activez la relance pour qu'Ama recontacte automatiquement les leads silencieux." />
      <div style={{
        ...cardStyle, padding: 28, textAlign: 'center',
        borderColor: nurturing.enabled ? T.green : T.border,
        background: nurturing.enabled ? '#f0fdf4' : T.bg,
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            background: nurturing.enabled ? '#dcfce7' : T.bgSec,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={28} color={nurturing.enabled ? T.green : T.textQuat} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            {nurturing.enabled ? 'Relance activée' : 'Relance désactivée'}
          </h3>
          <p style={{ fontSize: 14, color: T.textTer, lineHeight: 1.5 }}>
            {nurturing.enabled ? 'Ama enverra des messages de suivi aux leads qui ne répondent plus.'
              : 'Les leads silencieux ne seront pas relancés automatiquement.'}
          </p>
        </div>
        <Toggle on={nurturing.enabled} onToggle={() => onChange({ ...nurturing, enabled: !nurturing.enabled })} />
        {nurturing.enabled && (
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Max relances / semaine</label><input type="number" value={nurturing.maxPerWeek} min={1} max={10} onChange={e => onChange({ ...nurturing, maxPerWeek: Number(e.target.value) })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Cooldown (heures)</label><input type="number" value={nurturing.cooldownHours} min={1} max={168} onChange={e => onChange({ ...nurturing, cooldownHours: Number(e.target.value) })} style={inputStyle} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 8: WHATSAPP
// ═══════════════════════════════════════════════
function StepWhatsApp() {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <StepHeader title="Connecter WhatsApp" subtitle="Connectez le numéro WhatsApp Business de votre agence pour qu'Ama puisse répondre à vos clients." />
      <div style={{
        ...cardStyle, padding: 32, textAlign: 'center',
        border: `2px dashed ${T.blue}`, background: T.blueSoft,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22, margin: '0 auto 20px',
          background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MessageCircle size={32} color="#fff" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Configuration WhatsApp</h3>
        <p style={{ fontSize: 14, color: T.textTer, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>
          La connexion WhatsApp Business sera finalisée par notre équipe.
          Vous pouvez terminer la configuration et nous vous contacterons pour connecter votre numéro.
        </p>
        <div style={{
          padding: '14px 20px', borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center',
        }}>
          <AlertCircle size={18} color={T.amber} />
          <span style={{ fontSize: 13, color: T.textSec }}>Embedded Signup sera disponible prochainement</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: T.textQuat, textAlign: 'center', marginTop: 16 }}>
        Contactez-nous à <strong>cerberusaiautomation@gmail.com</strong> pour l'activation manuelle.
      </p>
    </div>
  )
}


// ═══════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════
function ProgressBar({ current, total, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        const Icon = s.icon
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div title={s.label} style={{
              width: 32, height: 32, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? T.green : active ? T.blue : T.bgSec, transition: 'all .3s',
            }}>
              {done ? <Check size={14} color="#fff" /> : <Icon size={14} color={active ? '#fff' : T.textQuat} />}
            </div>
            {i < total - 1 && (
              <div style={{ width: 16, height: 2, borderRadius: 1, background: done ? T.green : T.border, transition: 'background .3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}


// ═══════════════════════════════════════════════
// MAIN WIZARD
// ═══════════════════════════════════════════════
export default function OnboardingWizard({ onComplete }) {
  const { tenant, currentUser, refreshAgents } = useTenant()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [services, setServices] = useState(() =>
    DEFAULT_SERVICES.map(s => ({ ...s, is_active: s.default_on, questions: [...s.questions] }))
  )
  const [agent, setAgent] = useState({ name: 'Ama', tone: 'professional', language: ['fr'] })
  const [properties, setProperties] = useState([])
  const [faqs, setFaqs] = useState(() => [...DEFAULT_FAQS])
  const [availability, setAvailability] = useState(() => [...DEFAULT_AVAILABILITY])
  const [nurturing, setNurturing] = useState({ enabled: true, maxPerWeek: 3, cooldownHours: 24 })

  const TOTAL_STEPS = STEPS.length

  const canNext = () => {
    if (step === 0) return services.some(s => s.is_active)
    if (step === 2) return agent.name.trim().length > 0
    return true
  }

  const handleNext = () => { if (step < TOTAL_STEPS - 1 && canNext()) setStep(step + 1) }
  const handleBack = () => { if (step > 0) setStep(step - 1) }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const tenantId = tenant.id
      const userId = currentUser?.id

      // 1. Upsert tenant_services
      const activeServices = services.filter(s => s.is_active)
      await supabase.from('tenant_services').delete().eq('tenant_id', tenantId)
      if (activeServices.length > 0) {
        await supabase.from('tenant_services').insert(
          activeServices.map((s, idx) => ({
            tenant_id: tenantId, service_key: s.service_key, label: s.label,
            description: s.description || '', is_active: true, sort_order: idx,
            qualification_questions: s.questions,
          }))
        )
      }

      // 2. Upsert agent
      const { data: existingAgents } = await supabase.from('agents').select('id').eq('tenant_id', tenantId).limit(1)
      const serviceLabels = activeServices.map(s => s.label).join(', ')
      const systemPrompt = `Tu es ${agent.name}, assistante IA spécialisée en immobilier. Tu communiques en ${(agent.language || ['fr']).includes('fr') ? 'français' : 'anglais'} avec un ton ${agent.tone}.\n\nServices proposés par l'agence : ${serviceLabels}.\n\nSi un client demande un service qui n'est PAS dans cette liste, réponds poliment que ce n'est pas proposé et redirige vers les services disponibles.\n\nTon rôle : qualifier les prospects en posant les bonnes questions selon le service demandé, répondre aux FAQs, et alerter l'agent humain quand un prospect est chaud.`

      const agentPayload = {
        tenant_id: tenantId, name: agent.name, sector: 'real_estate',
        tone: agent.tone, language: agent.language || ['fr'],
        model: 'gpt-4.1-mini', is_active: true, system_prompt: systemPrompt,
      }
      if (existingAgents?.length > 0) {
        await supabase.from('agents').update(agentPayload).eq('id', existingAgents[0].id)
      } else {
        await supabase.from('agents').insert(agentPayload)
      }

      // 3. Insert properties
      if (properties.length > 0) {
        await supabase.from('properties').insert(
          properties.map(p => ({
            tenant_id: tenantId, title: p.title, price: p.price, zone: p.zone,
            property_type: p.property_type, transaction_type: p.transaction_type,
            rooms: p.rooms, surface: p.surface, description: p.description || '', status: 'available',
          }))
        )
      }

      // 4. Upsert FAQs
      const validFaqs = faqs.filter(f => f.question && f.answer)
      if (validFaqs.length > 0) {
        await supabase.from('faqs').delete().eq('tenant_id', tenantId)
        await supabase.from('faqs').insert(
          validFaqs.map(f => ({ tenant_id: tenantId, question: f.question, answer: f.answer, category: f.category || 'Général', active: true }))
        )
      }

      // 5. Upsert availability
      if (userId) {
        await supabase.from('availability').delete().eq('tenant_id', tenantId)
        if (availability.length > 0) {
          await supabase.from('availability').insert(
            availability.map(s => ({ tenant_id: tenantId, user_id: userId, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, is_active: true }))
          )
        }
      }

      // 6. Upsert follow_up_rules
      const { data: existingRules } = await supabase.from('follow_up_rules').select('id').eq('tenant_id', tenantId).limit(1)
      const rulesPayload = {
        tenant_id: tenantId,
        max_followups_per_week: nurturing.maxPerWeek,
        cooldown_hours: nurturing.cooldownHours,
        enabled_triggers: nurturing.enabled
          ? { cron_h2: true, cron_h24: true, cron_j3: true, cron_j7: true, cron_j30: true, db_trigger: true, post_visit: true }
          : { cron_h2: false, cron_h24: false, cron_j3: false, cron_j7: false, cron_j30: false, db_trigger: false, post_visit: false },
      }
      if (existingRules?.length > 0) {
        await supabase.from('follow_up_rules').update(rulesPayload).eq('id', existingRules[0].id)
      } else {
        await supabase.from('follow_up_rules').insert(rulesPayload)
      }

      // 7. Mark onboarding complete
      await supabase.from('tenants').update({
        default_sector: 'real_estate', onboarding_completed: true, updated_at: new Date().toISOString(),
      }).eq('id', tenantId)

      await refreshAgents()
      toast.success(`${agent.name} est prête ! Bienvenue dans CERBERUS.`)
      onComplete?.()
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Erreur lors de la configuration: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', fontFamily: T.font }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: `1px solid ${T.borderLight}`,
        background: T.bg, position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #1d1d1f, #3a3a3c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>C</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
            CERBERUS<span style={{ fontWeight: 300, color: T.textTer, marginLeft: 4 }}>AI</span>
          </span>
        </div>
        <ProgressBar current={step} total={TOTAL_STEPS} steps={STEPS} />
        <div style={{ minWidth: 90, textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: T.textQuat }}>Étape {step + 1}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Step title bar */}
      <div style={{
        padding: '12px 24px', background: T.bgTer, borderBottom: `1px solid ${T.borderLight}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {(() => { const Icon = STEPS[step].icon; return <Icon size={16} color={T.blue} /> })()}
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>{STEPS[step].label}</span>
        <span style={{ fontSize: 13, color: T.textQuat }}>— {STEPS[step].desc}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 24px 120px' }}>
        {step === 0 && <StepServices services={services} onChange={setServices} />}
        {step === 1 && <StepQualification services={services} onChange={setServices} />}
        {step === 2 && <StepAgent agent={agent} onChange={setAgent} />}
        {step === 3 && <StepProperties properties={properties} onChange={setProperties} />}
        {step === 4 && <StepFaqs faqs={faqs} onChange={setFaqs} />}
        {step === 5 && <StepAvailability slots={availability} onChange={setAvailability} />}
        {step === 6 && <StepNurturing nurturing={nurturing} onChange={setNurturing} />}
        {step === 7 && <StepWhatsApp />}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 24px', borderTop: `1px solid ${T.borderLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: T.bg, position: 'sticky', bottom: 0, zIndex: 10,
      }}>
        <div>
          {step > 0 && <button onClick={handleBack} style={btnSecondary}>Retour</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {(step === 3 || step === 4) && (
            <button onClick={handleNext} style={{ ...btnSecondary, color: T.textQuat, borderColor: 'transparent' }}>Passer</button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button onClick={handleNext} disabled={!canNext()} style={btnPrimary(!canNext())}>Continuer</button>
          ) : (
            <button onClick={handleFinish} disabled={saving} style={{
              ...btnPrimary(saving), padding: '14px 36px', fontSize: 16, fontWeight: 700,
              background: saving ? '#d2d2d7' : T.green,
              boxShadow: saving ? 'none' : '0 6px 24px rgba(52,199,89,.25)',
            }}>
              {saving ? (
                <><Loader2 size={18} style={{ animation: 'spin-fast .6s linear infinite' }} /> Configuration...</>
              ) : (
                <><Sparkles size={18} /> Lancer {agent.name}</>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin-fast { to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { border-color: ${T.blue} !important; box-shadow: 0 0 0 3px ${T.blue}15 !important; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
      `}</style>
    </div>
  )
}
