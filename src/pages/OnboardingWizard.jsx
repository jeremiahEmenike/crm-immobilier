import { useState, useEffect, useRef } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { SECTOR_LABELS } from '../lib/constants'
import {
  Building2, ShoppingCart, Heart, UtensilsCrossed,
  Check, Sparkles, X, Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── CONFIG ─────────────────────────────────
const SECTOR_ICONS = { real_estate: Building2, ecommerce: ShoppingCart, medical: Heart, restaurant: UtensilsCrossed }
const SECTOR_COLORS = { real_estate: '#0071e3', ecommerce: '#30d158', medical: '#ff375f', restaurant: '#ff9f0a' }

const AGENT_PERSONAS = {
  real_estate: {
    name: 'Ama', role: 'Votre commerciale IA',
    avatar: '🏠',
    pitch: (skills) => `Bonjour, je suis **Ama**, votre nouvelle experte en intelligence artificielle.\n\nJe vois que votre agence fait de la **${skills.join(', ')}**.\n\nMon rôle ? Faire le travail pénible pour vous. Je vais répondre à vos clients sur WhatsApp en moins de 3 secondes, qualifier leurs budgets et leurs zones de recherche, et vous envoyer une alerte dès qu'un prospect est chaud.\n\nPensez à moi comme l'assistante qui ne dort jamais. Même à 22h le dimanche, je travaille pour remplir votre calendrier de visites.`,
  },
  ecommerce: {
    name: 'Nova', role: 'Votre vendeur IA 24/7',
    avatar: '🛍️',
    pitch: (skills) => `Hey ! Je suis **Nova**, votre vendeur IA.\n\nVotre boutique propose : **${skills.join(', ')}**.\n\nMon job ? Transformer chaque visiteur en client. Je réponds aux questions produits instantanément, je relance les paniers abandonnés, et je recommande les bons articles au bon moment.\n\nPendant que vous dormez, je vends. 24h/24, 7j/7.`,
  },
  medical: {
    name: 'Dr. Santé', role: 'Votre secrétaire IA',
    avatar: '🩺',
    pitch: (skills) => `Bonjour, je suis **Dr. Santé**, votre secrétaire IA.\n\nVotre cabinet propose : **${skills.join(', ')}**.\n\nJe gère les prises de rendez-vous, je filtre les urgences, je rassure les patients et je réduis les no-shows avec des rappels automatiques.\n\nVotre téléphone ne sonnera plus pour les questions basiques. Je m'en occupe.`,
  },
  restaurant: {
    name: 'Chef Bot', role: "Votre maître d'hôtel IA",
    avatar: '🍽️',
    pitch: (skills) => `Bonsoir ! Je suis **Chef Bot**, votre maître d'hôtel IA.\n\nVotre restaurant propose : **${skills.join(', ')}**.\n\nJe prends les commandes sur WhatsApp, je gère les réservations, je suggère les plats du jour et je calcule les totaux automatiquement.\n\nVos clients commandent. Je livre l'expérience.`,
  },
}

const SECTOR_SKILLS = {
  real_estate: [
    { label: 'Vente', default: true },
    { label: 'Location', default: true },
    { label: 'Gestion Locative', default: true },
    { label: 'Chasseur de biens', default: false },
    { label: 'Syndic', default: false },
    { label: 'Vente de terrains', default: false },
    { label: 'Promotion immobilière', default: false },
  ],
  ecommerce: [
    { label: 'Vente en ligne', default: true },
    { label: 'Support client', default: true },
    { label: 'Suivi de commande', default: true },
    { label: 'Relance panier', default: false },
    { label: 'Recommandations produits', default: false },
    { label: 'Retours & Remboursements', default: false },
  ],
  medical: [
    { label: 'Prise de RDV', default: true },
    { label: 'Pré-consultation', default: true },
    { label: 'Rappels RDV', default: true },
    { label: 'Suivi patient', default: false },
    { label: 'Renouvellement ordonnances', default: false },
    { label: 'Informations générales', default: false },
  ],
  restaurant: [
    { label: 'Prise de commande', default: true },
    { label: 'Réservation', default: true },
    { label: 'Menu & Suggestions', default: true },
    { label: 'Livraison', default: false },
    { label: 'Programme fidélité', default: false },
    { label: 'Avis & Retours', default: false },
  ],
}

// ─── PROGRESS DOTS ──────────────────────────
function ProgressDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 24 : 8, height: 8,
          borderRadius: 4,
          background: i <= current ? '#0071e3' : '#d2d2d7',
          transition: 'all 0.4s cubic-bezier(.4,0,.2,1)',
        }} />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════
// STEP 1: SECTOR ROUTER
// ═══════════════════════════════════════════════
function StepSector({ value, onChange }) {
  const sectors = [
    { key: 'real_estate', label: 'Immobilier', desc: 'Agences, mandataires, gestion locative' },
    { key: 'ecommerce', label: 'E-commerce', desc: 'Boutiques en ligne, DTC, marketplaces' },
    { key: 'medical', label: 'Médical', desc: 'Cabinets, cliniques, dentistes' },
    { key: 'restaurant', label: 'Restaurant', desc: 'Restaurants, livraisons, traiteurs' },
  ]

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.03em', color: '#1d1d1f', marginBottom: 8 }}>
        Dans quel domaine opérez-vous ?
      </h1>
      <p style={{ fontSize: 15, color: '#86868b', marginBottom: 48 }}>
        Votre agent sera pré-configuré pour votre industrie.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {sectors.map(s => {
          const Icon = SECTOR_ICONS[s.key]
          const color = SECTOR_COLORS[s.key]
          const selected = value === s.key

          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              style={{
                position: 'relative',
                padding: '32px 24px',
                borderRadius: 20,
                border: selected ? `2px solid ${color}` : '2px solid #e8e8ed',
                background: selected ? `${color}08` : '#fff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s',
                boxShadow: selected ? `0 8px 32px ${color}15` : '0 2px 8px rgba(0,0,0,.04)',
              }}
            >
              {selected && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 24, height: 24, borderRadius: 12,
                  background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={14} color="#fff" />
                </div>
              )}

              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={26} color={color} />
              </div>

              <div style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: '#86868b', lineHeight: 1.4 }}>{s.desc}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// STEP 2: SKILLS (Pilules LinkedIn-style)
// ═══════════════════════════════════════════════
function StepSkills({ sector, skills, onChange }) {
  const color = SECTOR_COLORS[sector]
  const [customInput, setCustomInput] = useState('')

  const toggle = (label) => {
    if (skills.includes(label)) {
      onChange(skills.filter(s => s !== label))
    } else {
      onChange([...skills, label])
    }
  }

  const addCustom = () => {
    const val = customInput.trim()
    if (val && !skills.includes(val)) {
      onChange([...skills, val])
      setCustomInput('')
    }
  }

  const allLabels = (SECTOR_SKILLS[sector] || []).map(s => s.label)
  const customSkills = skills.filter(s => !allLabels.includes(s))

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.03em', color: '#1d1d1f', marginBottom: 8 }}>
        Quels services proposez-vous ?
      </h1>
      <p style={{ fontSize: 15, color: '#86868b', marginBottom: 40 }}>
        Votre agent saura exactement quoi répondre — et quoi refuser.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {(SECTOR_SKILLS[sector] || []).map(s => {
          const active = skills.includes(s.label)
          return (
            <button
              key={s.label}
              onClick={() => toggle(s.label)}
              style={{
                padding: '10px 20px',
                borderRadius: 980,
                border: active ? `2px solid ${color}` : '2px solid #e8e8ed',
                background: active ? `${color}10` : '#fff',
                color: active ? color : '#6e6e73',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {active && <Check size={14} />}
              {s.label}
            </button>
          )
        })}

        {customSkills.map(s => (
          <div key={s} style={{
            padding: '10px 12px 10px 20px',
            borderRadius: 980,
            border: `2px solid ${color}`,
            background: `${color}10`,
            color: color,
            fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Check size={14} />
            {s}
            <button onClick={() => onChange(skills.filter(sk => sk !== s))} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#86868b',
              padding: '0 2px', display: 'flex',
            }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, maxWidth: 320, margin: '0 auto' }}>
        <input
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Ajouter un service..."
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 12,
            border: '1.5px solid #e8e8ed', fontSize: 14, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={addCustom}
          disabled={!customInput.trim()}
          style={{
            width: 44, height: 44, borderRadius: 12,
            border: 'none', background: customInput.trim() ? color : '#e8e8ed',
            color: customInput.trim() ? '#fff' : '#86868b',
            cursor: customInput.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#aeaeb2', marginTop: 24 }}>
        {skills.length} service{skills.length > 1 ? 's' : ''} sélectionné{skills.length > 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════
// STEP 3: L'ENTRETIEN D'EMBAUCHE
// ═══════════════════════════════════════════════
function StepInterview({ sector, skills }) {
  const persona = AGENT_PERSONAS[sector]
  const color = SECTOR_COLORS[sector]
  const pitchRaw = persona.pitch(skills.length > 0 ? skills : ['vos services'])
  const [displayedChars, setDisplayedChars] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayedChars(0)
    setDone(false)
    const total = pitchRaw.length
    let i = 0
    const timer = setInterval(() => {
      i += 2
      if (i >= total) { i = total; setDone(true); clearInterval(timer) }
      setDisplayedChars(i)
    }, 12)
    return () => clearInterval(timer)
  }, [pitchRaw])

  const displayedText = pitchRaw.slice(0, displayedChars)

  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#1d1d1f' }}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <div style={{
        width: 96, height: 96, borderRadius: 28, margin: '0 auto 24px',
        background: `linear-gradient(135deg, ${color}20, ${color}08)`,
        border: `2px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44,
        boxShadow: `0 12px 40px ${color}15`,
      }}>
        {persona.avatar}
      </div>

      <div style={{
        fontSize: 13, fontWeight: 600, color: color,
        textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4,
      }}>
        {persona.role}
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-.02em', marginBottom: 32 }}>
        {persona.name}
      </h2>

      <div style={{
        textAlign: 'left',
        background: '#f5f5f7',
        borderRadius: 20,
        padding: 28,
        fontSize: 15,
        lineHeight: 1.7,
        color: '#3a3a3c',
        minHeight: 180,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -8, left: '50%',
          width: 16, height: 16, background: '#f5f5f7', borderRadius: 4,
          transform: 'translateX(-50%) rotate(45deg)',
        }} />

        {displayedText.split('\n').map((line, i) => (
          <p key={i} style={{ marginBottom: line ? 12 : 4 }}>
            {renderText(line)}
          </p>
        ))}

        {!done && (
          <span style={{
            display: 'inline-block', width: 6, height: 18,
            background: color, borderRadius: 1,
            animation: 'blink-cursor 0.8s step-end infinite',
            verticalAlign: 'text-bottom', marginLeft: 2,
          }} />
        )}
      </div>

      <style>{`
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════
// MAIN WIZARD
// ═══════════════════════════════════════════════
export default function OnboardingWizard({ onComplete }) {
  const { tenant, refreshAgents } = useTenant()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [sector, setSector] = useState(tenant?.default_sector || 'real_estate')
  const [skills, setSkills] = useState([])

  useEffect(() => {
    const defaults = (SECTOR_SKILLS[sector] || []).filter(s => s.default).map(s => s.label)
    setSkills(defaults)
  }, [sector])

  const TOTAL_STEPS = 3

  const canNext = () => {
    if (step === 0) return !!sector
    if (step === 1) return skills.length > 0
    return true
  }

  const handleNext = () => { if (step < TOTAL_STEPS - 1) setStep(step + 1) }
  const handleBack = () => { if (step > 0) setStep(step - 1) }

  const handleHire = async () => {
    setSaving(true)
    try {
      const persona = AGENT_PERSONAS[sector]

      await supabase
        .from('tenants')
        .update({
          default_sector: sector,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenant.id)

      const { data: existingAgents } = await supabase
        .from('agents')
        .select('id')
        .eq('tenant_id', tenant.id)
        .limit(1)

      const skillsText = skills.join(', ')
      const systemPrompt = `Tu es ${persona.name}, ${persona.role.toLowerCase()} spécialisée en ${SECTOR_LABELS[sector]?.toLowerCase() || sector}. Tu communiques en français avec un ton professionnel et chaleureux.\n\nServices proposés par l'agence : ${skillsText}.\n\nSi un client demande un service qui n'est PAS dans cette liste, réponds poliment que ce n'est pas proposé et redirige vers les services disponibles.\n\nTon rôle : qualifier les prospects, répondre aux questions fréquentes, et alerter l'agent humain quand un prospect est chaud.`

      const agentPayload = {
        tenant_id: tenant.id,
        name: persona.name,
        sector: sector,
        tone: 'professional',
        language: ['fr'],
        model: 'gpt-4.1-mini',
        is_active: true,
        persona_instructions: persona.pitch(skills),
        system_prompt: systemPrompt,
        config: { skills },
      }

      if (existingAgents?.length > 0) {
        await supabase.from('agents').update(agentPayload).eq('id', existingAgents[0].id)
      } else {
        await supabase.from('agents').insert(agentPayload)
      }

      await refreshAgents()
      toast.success(`${persona.name} a été embauchée !`)
      onComplete?.()
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Erreur lors de la configuration')
    } finally {
      setSaving(false)
    }
  }

  const persona = AGENT_PERSONAS[sector]
  const color = SECTOR_COLORS[sector]

  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #1d1d1f, #3a3a3c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>C</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>
            CERBERUS<span style={{ fontWeight: 300, color: '#86868b', marginLeft: 4 }}>AI</span>
          </span>
        </div>

        <ProgressDots current={step} total={TOTAL_STEPS} />

        <div style={{ width: 80, textAlign: 'right' }}>
          <span style={{ fontSize: 12, color: '#aeaeb2' }}>{step + 1}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        overflowY: 'auto',
      }}>
        {step === 0 && <StepSector value={sector} onChange={setSector} />}
        {step === 1 && <StepSkills sector={sector} skills={skills} onChange={setSkills} />}
        {step === 2 && <StepInterview sector={sector} skills={skills} />}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 32px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          {step > 0 && (
            <button
              onClick={handleBack}
              style={{
                padding: '10px 20px', borderRadius: 980,
                border: '1.5px solid #e8e8ed', background: '#fff',
                fontSize: 14, fontWeight: 600, color: '#6e6e73',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Retour
            </button>
          )}
        </div>

        <div>
          {step < 2 ? (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              style={{
                padding: '12px 28px', borderRadius: 980,
                border: 'none',
                background: canNext() ? '#0071e3' : '#d2d2d7',
                color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: canNext() ? 'pointer' : 'default',
                boxShadow: canNext() ? '0 4px 14px rgba(0,113,227,.2)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              Continuer
            </button>
          ) : (
            <button
              onClick={handleHire}
              disabled={saving}
              style={{
                padding: '14px 36px', borderRadius: 980,
                border: 'none',
                background: saving ? '#d2d2d7' : color,
                color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: saving ? 'default' : 'pointer',
                boxShadow: saving ? 'none' : `0 6px 24px ${color}30`,
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              {saving ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin-fast .6s linear infinite',
                    display: 'inline-block',
                  }} />
                  Configuration...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Embaucher {persona.name}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin-fast { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
