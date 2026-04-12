import { useState, useEffect, useRef } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import {
  Check, Sparkles, Plus, GripVertical,
  Home, Sliders, User, Package, HelpCircle,
  Clock, Bell, MessageCircle, ChevronDown, ChevronUp,
  Trash2, AlertCircle, Loader2, Upload, X, Image, Film, FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ═══════════════════════════════════════════════
// DESIGN TOKENS (White Apple aesthetic)
// ═══════════════════════════════════════════════
const T = {
  blue: '#0071e3', blueSoft: '#0071e310', blueGlow: '0 4px 14px rgba(0,113,227,.18)',
  text: '#1d1d1f', textSec: '#6e6e73', textTer: '#86868b', textQuat: '#aeaeb2',
  bg: '#fff', bgSec: '#f5f5f7', bgTer: '#fafafa',
  border: '#e8e8ed', borderLight: '#f0f0f5',
  green: '#34c759', red: '#ff3b30', amber: '#ff9f0a',
  radius: 16, radiusPill: 980,
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
}

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

const CURRENCIES = [
  { key: 'XOF', label: 'FCFA (XOF)', symbol: 'FCFA' },
  { key: 'NGN', label: 'Naira (₦)', symbol: '₦' },
  { key: 'USD', label: 'Dollar ($)', symbol: '$' },
  { key: 'EUR', label: 'Euro (€)', symbol: '€' },
  { key: 'GHS', label: 'Cedi (₵)', symbol: '₵' },
]

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

const DEFAULT_FAQS = [
  { question: "Quels sont vos frais d'agence ?", answer: "Nos frais varient selon le type de transaction. Contactez-nous pour un devis personnalisé.", category: 'Paiement', documents: [] },
  { question: 'Comment se passe une visite ?', answer: "Vous prenez rendez-vous, nous confirmons le créneau, et un agent vous accompagne sur place.", category: 'Visite', documents: [] },
  { question: 'Quels documents faut-il fournir ?', answer: "Pour une location : pièce d'identité, justificatif de revenus, et dernier avis d'imposition. Pour un achat : pièce d'identité et attestation de financement.", category: 'Documents', documents: [] },
]

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
const PROPERTY_TYPES_LIST = ['Appartement', 'Maison', 'Villa', 'Terrain', 'Bureau', 'Commerce', 'Duplex', 'Studio', 'Autre']
const TRANSACTION_TYPES_LIST = [{ key: 'sale', label: 'Vente' }, { key: 'rent', label: 'Location' }]


// ═══════════════════════════════════════════════
// SHARED STYLES & COMPONENTS
// ═══════════════════════════════════════════════
const cardStyle = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 20, transition: 'all .2s' }
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg, fontSize: 14, fontFamily: T.font, color: T.text, outline: 'none', transition: 'border-color .2s', boxSizing: 'border-box' }
const labelStyle = { fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 6, display: 'block', letterSpacing: '.02em' }
const btnPrimary = (disabled) => ({ padding: '12px 28px', borderRadius: T.radiusPill, border: 'none', background: disabled ? '#d2d2d7' : T.blue, color: '#fff', fontSize: 15, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', boxShadow: disabled ? 'none' : T.blueGlow, fontFamily: T.font, display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .2s' })
const btnSecondary = { padding: '10px 20px', borderRadius: T.radiusPill, border: `1.5px solid ${T.border}`, background: T.bg, fontSize: 14, fontWeight: 600, color: T.textSec, cursor: 'pointer', fontFamily: T.font, display: 'inline-flex', alignItems: 'center', gap: 6 }

function StepHeader({ title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: T.text, marginBottom: 8 }}>{title}</h1>
      <p style={{ fontSize: 15, color: T.textTer, maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  )
}

function Toggle({ on, onToggle, size = 'md' }) {
  const w = size === 'sm' ? 36 : 44, h = size === 'sm' ? 20 : 24, dot = size === 'sm' ? 16 : 20
  return (
    <button onClick={(e) => { e.stopPropagation(); onToggle() }} style={{
      width: w, height: h, borderRadius: h, border: 'none', background: on ? T.green : '#d2d2d7',
      cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{ width: dot, height: dot, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? w - dot - 2 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
    </button>
  )
}

function SkipNotice({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: '#fff8e1', marginBottom: 24 }}>
      <AlertCircle size={16} color={T.amber} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#92400e' }}>{text}</span>
    </div>
  )
}

// ─── Upload helper ────
async function uploadFile(bucket, file, tenantId) {
  const ext = file.name.split('.').pop()
  const path = `${tenantId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

// ─── Inline media upload (white theme) ────
function MiniMediaUpload({ files, onChange, tenantId, accept = 'image/*,video/*', label: lbl = 'Photos / Vidéos', max = 8 }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    setUploading(true)
    const newFiles = [...files]
    for (const file of selected) {
      if (newFiles.length >= max) break
      try {
        let url
        try { url = await uploadFile('property-images', file, tenantId) }
        catch { url = URL.createObjectURL(file) } // fallback preview
        newFiles.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), url, name: file.name, type: file.type, size: file.size })
      } catch (err) { console.error('Upload error:', err) }
    }
    onChange(newFiles)
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div>
      <label style={labelStyle}>{lbl}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {files.map(f => (
          <div key={f.id} style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative', border: `1px solid ${T.border}`, background: T.bgSec }}>
            {f.type?.startsWith('video/') ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Film size={18} color={T.textQuat} />
                <span style={{ fontSize: 8, color: T.textQuat, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              </div>
            ) : (
              <img src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            )}
            <button onClick={() => onChange(files.filter(x => x.id !== f.id))} style={{
              position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10,
              background: 'rgba(0,0,0,.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><X size={10} color="#fff" /></button>
          </div>
        ))}
        {files.length < max && (
          <button onClick={() => ref.current?.click()} disabled={uploading} style={{
            width: 72, height: 72, borderRadius: 10, border: `2px dashed ${T.border}`, background: T.bgSec,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            cursor: 'pointer', fontSize: 10, color: T.textQuat, fontFamily: T.font,
          }}>
            {uploading ? <Loader2 size={16} color={T.textQuat} style={{ animation: 'spin-fast .6s linear infinite' }} /> : <><Upload size={16} color={T.textQuat} /><span>Ajouter</span></>}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} multiple hidden onChange={handleFiles} />
      <div style={{ fontSize: 11, color: T.textQuat, marginTop: 6 }}>{files.length}/{max} fichiers</div>
    </div>
  )
}

// ─── Mini document upload (white theme) ────
function MiniDocUpload({ files, onChange, tenantId, max = 5 }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    setUploading(true)
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    const newFiles = [...files]
    for (const file of selected) {
      if (newFiles.length >= max) break
      if (!allowed.includes(file.type)) { toast.error('Format non supporté. PDF ou image uniquement.'); continue }
      try {
        const url = await uploadFile('faq-documents', file, tenantId)
        newFiles.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), url, name: file.name, type: file.type, size: file.size })
      } catch (err) { toast.error('Erreur upload: ' + err.message) }
    }
    onChange(newFiles)
    setUploading(false)
    e.target.value = ''
  }

  const fmtSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`

  return (
    <div>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {files.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: T.bgSec }}>
              {f.type?.includes('pdf') ? <FileText size={16} color={T.blue} /> : <Image size={16} color={T.green} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div style={{ fontSize: 10, color: T.textQuat }}>{fmtSize(f.size)}</div>
              </div>
              <button onClick={() => onChange(files.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}><X size={14} color={T.textQuat} /></button>
            </div>
          ))}
        </div>
      )}
      {files.length < max && (
        <button onClick={() => ref.current?.click()} disabled={uploading} style={{
          width: '100%', padding: '10px', borderRadius: 10, border: `1.5px dashed ${T.border}`, background: T.bgSec,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', fontSize: 12, color: T.textSec, fontFamily: T.font,
        }}>
          {uploading ? <Loader2 size={14} style={{ animation: 'spin-fast .6s linear infinite' }} /> : <><Upload size={14} /> Document (PDF, image)</>}
        </button>
      )}
      <input ref={ref} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple hidden onChange={handleFiles} />
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 1: SERVICES
// ═══════════════════════════════════════════════
function StepServices({ services, onChange }) {
  const toggle = (idx) => { const u = [...services]; u[idx] = { ...u[idx], is_active: !u[idx].is_active }; onChange(u) }
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepHeader title="Quels services proposez-vous ?" subtitle="Activez les services que votre agence offre. Ama saura exactement quoi répondre — et quoi refuser." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {services.map((svc, idx) => (
          <div key={svc.service_key} onClick={() => toggle(idx)} style={{
            ...cardStyle, borderColor: svc.is_active ? T.blue : T.border, background: svc.is_active ? T.blueSoft : T.bg,
            display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: svc.is_active ? `${T.blue}15` : T.bgSec, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {svc.is_active ? <Check size={18} color={T.blue} /> : <Home size={18} color={T.textQuat} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{svc.label}</div>
              <div style={{ fontSize: 13, color: T.textTer }}>{svc.description}</div>
            </div>
            <Toggle on={svc.is_active} onToggle={() => toggle(idx)} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: T.textQuat, textAlign: 'center', marginTop: 20 }}>Vous pourrez modifier ces services à tout moment dans les paramètres.</p>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 2: QUALIFICATION
// ═══════════════════════════════════════════════
function StepQualification({ services, onChange }) {
  const [expanded, setExpanded] = useState(null)
  const active = services.filter(s => s.is_active)
  const realIdx = (si) => services.findIndex(s => s.service_key === active[si].service_key)

  const toggleQ = (si, qi) => { const u = [...services]; const qs = [...u[realIdx(si)].questions]; qs[qi] = { ...qs[qi], required: !qs[qi].required }; u[realIdx(si)] = { ...u[realIdx(si)], questions: qs }; onChange(u) }
  const removeQ = (si, qi) => { const u = [...services]; const qs = [...u[realIdx(si)].questions]; qs.splice(qi, 1); u[realIdx(si)] = { ...u[realIdx(si)], questions: qs }; onChange(u) }
  const addQ = (si) => { const u = [...services]; const qs = [...u[realIdx(si)].questions]; qs.push({ key: `custom_${Date.now()}`, type: 'open', question: '', required: false }); u[realIdx(si)] = { ...u[realIdx(si)], questions: qs }; onChange(u) }
  const updateQText = (si, qi, text) => { const u = [...services]; const qs = [...u[realIdx(si)].questions]; qs[qi] = { ...qs[qi], question: text }; u[realIdx(si)] = { ...u[realIdx(si)], questions: qs }; onChange(u) }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepHeader title="Questions de qualification" subtitle="Personnalisez les questions qu'Ama posera pour chaque service." />
      {active.length === 0 && <SkipNotice text="Aucun service activé. Retournez à l'étape précédente." />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {active.map((svc, si) => {
          const isOpen = expanded === si
          return (
            <div key={svc.service_key} style={{ ...cardStyle, padding: 0 }}>
              <button onClick={() => setExpanded(isOpen ? null : si)} style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sliders size={16} color={T.blue} /></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{svc.label}</div>
                    <div style={{ fontSize: 12, color: T.textTer }}>{svc.questions.length} questions</div>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18} color={T.textTer} /> : <ChevronDown size={18} color={T.textTer} />}
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${T.borderLight}` }}>
                  {svc.questions.map((q, qi) => (
                    <div key={q.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: qi < svc.questions.length - 1 ? `1px solid ${T.borderLight}` : 'none' }}>
                      <GripVertical size={14} color={T.textQuat} style={{ flexShrink: 0, opacity: .4 }} />
                      <div style={{ flex: 1 }}>
                        {q.key.startsWith('custom_') ? <input value={q.question} onChange={e => updateQText(si, qi, e.target.value)} placeholder="Votre question..." style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }} autoFocus /> : <span style={{ fontSize: 14, color: T.text }}>{q.question}</span>}
                        {q.type === 'choice' && q.options && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {q.options.map(o => <span key={o} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: T.bgSec, color: T.textTer }}>{o}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: q.required ? T.blue : T.textQuat }}>{q.required ? 'Obligatoire' : 'Optionnel'}</span>
                        <Toggle on={q.required} onToggle={() => toggleQ(si, qi)} size="sm" />
                        <button onClick={() => removeQ(si, qi)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={14} color={T.textQuat} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addQ(si)} style={{ ...btnSecondary, marginTop: 12, fontSize: 13, padding: '8px 16px' }}><Plus size={14} /> Ajouter une question</button>
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
// STEP 3: AGENT
// ═══════════════════════════════════════════════
function StepAgent({ agent, onChange }) {
  const tones = [{ key: 'professional', label: 'Professionnel', emoji: '👔', desc: 'Formel et courtois' }, { key: 'friendly', label: 'Amical', emoji: '😊', desc: 'Chaleureux et accessible' }, { key: 'casual', label: 'Décontracté', emoji: '✌️', desc: 'Relax et naturel' }, { key: 'formal', label: 'Formel', emoji: '📋', desc: 'Strict et protocolaire' }]
  const languages = [{ key: 'fr', label: 'Français', flag: '🇫🇷' }, { key: 'en', label: 'Anglais', flag: '🇬🇧' }]
  const toggleLang = (k) => { const c = agent.language || ['fr']; if (c.includes(k)) { if (c.length > 1) onChange({ ...agent, language: c.filter(l => l !== k) }) } else onChange({ ...agent, language: [...c, k] }) }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <StepHeader title="Personnalisez votre agent" subtitle="Donnez un nom, un ton et une langue à votre assistante IA." />
      <div style={{ marginBottom: 24 }}><label style={labelStyle}>Nom de l'agent</label><input value={agent.name} onChange={e => onChange({ ...agent, name: e.target.value })} placeholder="Ex: Ama" style={inputStyle} /></div>
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Ton de communication</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {tones.map(t => { const s = agent.tone === t.key; return (
            <button key={t.key} onClick={() => onChange({ ...agent, tone: t.key })} style={{ ...cardStyle, padding: '14px 16px', borderColor: s ? T.blue : T.border, background: s ? T.blueSoft : T.bg, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.label}</div><div style={{ fontSize: 12, color: T.textTer }}>{t.desc}</div></div>
            </button>
          )})}
        </div>
      </div>
      <div><label style={labelStyle}>Langue(s)</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {languages.map(l => { const s = (agent.language || ['fr']).includes(l.key); return (
            <button key={l.key} onClick={() => toggleLang(l.key)} style={{ ...cardStyle, padding: '12px 20px', borderColor: s ? T.blue : T.border, background: s ? T.blueSoft : T.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>{l.flag}</span><span style={{ fontSize: 14, fontWeight: 600, color: s ? T.blue : T.text }}>{l.label}</span>{s && <Check size={16} color={T.blue} />}
            </button>
          )})}
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 4: PROPERTIES (with currency, description, media)
// ═══════════════════════════════════════════════
function StepProperties({ properties, onChange, currency, onCurrencyChange, tenantId }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', price: '', zone: '', property_type: 'Appartement', transaction_type: 'sale', rooms: '', surface: '', description: '', media: [] })
  const currObj = CURRENCIES.find(c => c.key === currency) || CURRENCIES[0]

  const addProperty = () => {
    if (!form.title || !form.price || !form.zone) { toast.error('Titre, prix et zone sont obligatoires'); return }
    onChange([...properties, { ...form, price: Number(form.price), rooms: form.rooms ? Number(form.rooms) : null, surface: form.surface ? Number(form.surface) : null }])
    setForm({ title: '', price: '', zone: '', property_type: 'Appartement', transaction_type: 'sale', rooms: '', surface: '', description: '', media: [] })
    setShowForm(false)
    toast.success('Bien ajouté')
  }

  const fmtPrice = (n) => new Intl.NumberFormat('fr-FR').format(n)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <StepHeader title="Ajoutez vos biens" subtitle="Ajoutez quelques biens pour qu'Ama puisse proposer des matches. Vous pourrez en ajouter plus tard." />
      <SkipNotice text="Vous pouvez sauter cette étape et ajouter vos biens plus tard depuis le CRM." />

      {/* Currency selector */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Devise :</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {CURRENCIES.map(c => (
            <button key={c.key} onClick={() => onCurrencyChange(c.key)} style={{
              padding: '6px 14px', borderRadius: T.radiusPill, fontSize: 13, fontWeight: 600, fontFamily: T.font,
              border: `1.5px solid ${currency === c.key ? T.blue : T.border}`,
              background: currency === c.key ? T.blueSoft : T.bg,
              color: currency === c.key ? T.blue : T.textSec, cursor: 'pointer',
            }}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {properties.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {properties.map((p, idx) => (
            <div key={idx} style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {p.media?.length > 0 && <img src={p.media[0].url} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} alt="" />}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: T.textTer }}>{p.zone} · {fmtPrice(p.price)} {currObj.symbol} · {p.property_type}</div>
                </div>
              </div>
              <button onClick={() => onChange(properties.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={16} color={T.red} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm ? (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Titre *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Villa 4 chambres Lomé" style={inputStyle} /></div>
            <div><label style={labelStyle}>Zone *</label><input value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} placeholder="Agoe, Tokoin..." style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Prix ({currObj.symbol}) *</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="50000000" style={inputStyle} /></div>
            <div><label style={labelStyle}>Type</label><select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})} style={inputStyle}>{PROPERTY_TYPES_LIST.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Transaction</label><select value={form.transaction_type} onChange={e => setForm({...form, transaction_type: e.target.value})} style={inputStyle}>{TRANSACTION_TYPES_LIST.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Chambres</label><input type="number" value={form.rooms} onChange={e => setForm({...form, rooms: e.target.value})} placeholder="3" style={inputStyle} /></div>
            <div><label style={labelStyle}>Surface (m²)</label><input type="number" value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} placeholder="120" style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Belle villa avec jardin, parking, 4 chambres..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <MiniMediaUpload files={form.media} onChange={media => setForm({...form, media})} tenantId={tenantId} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={addProperty} style={btnPrimary(false)}><Check size={16} /> Ajouter</button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={{ ...cardStyle, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px dashed ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 14, fontFamily: T.font }}>
          <Plus size={18} /> Ajouter un bien
        </button>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 5: FAQs (with document uploads)
// ═══════════════════════════════════════════════
function StepFaqs({ faqs, onChange, tenantId }) {
  const [editIdx, setEditIdx] = useState(null)
  const addFaq = () => { onChange([...faqs, { question: '', answer: '', category: 'Général', documents: [] }]); setEditIdx(faqs.length) }
  const updateFaq = (idx, field, val) => { const u = [...faqs]; u[idx] = { ...u[idx], [field]: val }; onChange(u) }
  const removeFaq = (idx) => { onChange(faqs.filter((_, i) => i !== idx)); if (editIdx === idx) setEditIdx(null) }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepHeader title="Questions fréquentes" subtitle="Ajoutez les FAQs que vos clients posent souvent. Vous pouvez joindre des documents (PDF, images)." />
      <SkipNotice text="Des FAQs par défaut sont pré-remplies. Modifiez-les ou ajoutez les vôtres." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {faqs.map((faq, idx) => (
          <div key={idx} style={cardStyle}>
            {editIdx === idx ? (
              <div>
                <div style={{ marginBottom: 10 }}><label style={labelStyle}>Question</label><input value={faq.question} onChange={e => updateFaq(idx, 'question', e.target.value)} style={inputStyle} placeholder="Ex: Quels sont vos frais d'agence ?" /></div>
                <div style={{ marginBottom: 10 }}><label style={labelStyle}>Réponse</label><textarea value={faq.answer} onChange={e => updateFaq(idx, 'answer', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Réponse détaillée..." /></div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Documents joints (PDF, images)</label>
                  <MiniDocUpload files={faq.documents || []} onChange={docs => updateFaq(idx, 'documents', docs)} tenantId={tenantId} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditIdx(null)} style={btnPrimary(!faq.question || !faq.answer)} disabled={!faq.question || !faq.answer}><Check size={14} /> OK</button>
                  <button onClick={() => removeFaq(idx)} style={{ ...btnSecondary, color: T.red, borderColor: '#fecaca' }}><Trash2 size={14} /> Supprimer</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditIdx(idx)} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{faq.question || '(question vide)'}</div>
                <div style={{ fontSize: 13, color: T.textTer, lineHeight: 1.4 }}>{faq.answer || '(réponse vide)'}</div>
                {(faq.documents?.length > 0) && <div style={{ fontSize: 11, color: T.blue, marginTop: 6 }}>{faq.documents.length} document(s) joint(s)</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={addFaq} style={{ ...cardStyle, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `2px dashed ${T.border}`, color: T.textSec, fontWeight: 600, fontSize: 14, fontFamily: T.font }}>
        <Plus size={18} /> Ajouter une FAQ
      </button>
    </div>
  )
}


// ═══════════════════════════════════════════════
// STEP 6: AVAILABILITY
// ═══════════════════════════════════════════════
function StepAvailability({ slots, onChange }) {
  const grouped = [1,2,3,4,5,6,0].map(day => ({ day, name: DAY_NAMES[day], slots: slots.filter(s => s.day_of_week === day) }))
  const toggleDay = (day) => {
    if (slots.some(s => s.day_of_week === day)) onChange(slots.filter(s => s.day_of_week !== day))
    else onChange([...slots, { day_of_week: day, start_time: '08:00', end_time: '12:00' }, { day_of_week: day, start_time: '14:00', end_time: '18:00' }])
  }
  const updateSlot = (si, field, val) => { const u = [...slots]; u[si] = { ...u[si], [field]: val }; onChange(u) }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <StepHeader title="Créneaux de disponibilité" subtitle="Configurez les heures pendant lesquelles Ama peut proposer des visites." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {grouped.map(g => (
          <div key={g.day} style={{ ...cardStyle, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: g.slots.length > 0 ? 1 : .5 }}>
            <Toggle on={g.slots.length > 0} onToggle={() => toggleDay(g.day)} size="sm" />
            <div style={{ width: 80, fontSize: 14, fontWeight: 600, color: T.text }}>{g.name}</div>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {g.slots.length > 0 ? g.slots.map((slot, i) => {
                const ri = slots.indexOf(slot)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="time" value={slot.start_time} onChange={e => updateSlot(ri, 'start_time', e.target.value)} style={{ ...inputStyle, width: 100, padding: '6px 8px', fontSize: 13 }} />
                    <span style={{ color: T.textTer, fontSize: 12 }}>→</span>
                    <input type="time" value={slot.end_time} onChange={e => updateSlot(ri, 'end_time', e.target.value)} style={{ ...inputStyle, width: 100, padding: '6px 8px', fontSize: 13 }} />
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
      <div style={{ ...cardStyle, padding: 28, textAlign: 'center', borderColor: nurturing.enabled ? T.green : T.border, background: nurturing.enabled ? '#f0fdf4' : T.bg }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px', background: nurturing.enabled ? '#dcfce7' : T.bgSec, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={28} color={nurturing.enabled ? T.green : T.textQuat} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>{nurturing.enabled ? 'Relance activée' : 'Relance désactivée'}</h3>
          <p style={{ fontSize: 14, color: T.textTer, lineHeight: 1.5 }}>{nurturing.enabled ? 'Ama enverra des messages de suivi aux leads qui ne répondent plus.' : 'Les leads silencieux ne seront pas relancés automatiquement.'}</p>
        </div>
        <Toggle on={nurturing.enabled} onToggle={() => onChange({ ...nurturing, enabled: !nurturing.enabled })} />
        {nurturing.enabled && (
          <div style={{ marginTop: 24, textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Max relances / semaine</label><input type="number" value={nurturing.maxPerWeek} min={1} max={10} onChange={e => onChange({ ...nurturing, maxPerWeek: Number(e.target.value) })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cooldown (heures)</label><input type="number" value={nurturing.cooldownHours} min={1} max={168} onChange={e => onChange({ ...nurturing, cooldownHours: Number(e.target.value) })} style={inputStyle} /></div>
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
      <StepHeader title="Connecter WhatsApp" subtitle="Connectez le numéro WhatsApp Business de votre agence." />
      <div style={{ ...cardStyle, padding: 32, textAlign: 'center', border: `2px dashed ${T.blue}`, background: T.blueSoft }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, margin: '0 auto 20px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={32} color="#fff" /></div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Configuration WhatsApp</h3>
        <p style={{ fontSize: 14, color: T.textTer, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>La connexion WhatsApp Business sera finalisée par notre équipe. Terminez la configuration et nous vous contacterons.</p>
        <div style={{ padding: '14px 20px', borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <AlertCircle size={18} color={T.amber} /><span style={{ fontSize: 13, color: T.textSec }}>Embedded Signup disponible prochainement</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: T.textQuat, textAlign: 'center', marginTop: 16 }}>Contactez-nous à <strong>cerberusaiautomation@gmail.com</strong> pour l'activation.</p>
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
        const done = i < current, active = i === current, Icon = s.icon
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div title={s.label} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? T.green : active ? T.blue : T.bgSec, transition: 'all .3s' }}>
              {done ? <Check size={14} color="#fff" /> : <Icon size={14} color={active ? '#fff' : T.textQuat} />}
            </div>
            {i < total - 1 && <div style={{ width: 16, height: 2, borderRadius: 1, background: done ? T.green : T.border, transition: 'background .3s' }} />}
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
  const [services, setServices] = useState(() => DEFAULT_SERVICES.map(s => ({ ...s, is_active: s.default_on, questions: [...s.questions] })))
  const [agent, setAgent] = useState({ name: 'Ama', tone: 'professional', language: ['fr'] })
  const [properties, setProperties] = useState([])
  const [currency, setCurrency] = useState('XOF')
  const [faqs, setFaqs] = useState(() => DEFAULT_FAQS.map(f => ({ ...f })))
  const [availability, setAvailability] = useState(() => [...DEFAULT_AVAILABILITY])
  const [nurturing, setNurturing] = useState({ enabled: true, maxPerWeek: 3, cooldownHours: 24 })

  const TOTAL = STEPS.length
  const canNext = () => { if (step === 0) return services.some(s => s.is_active); if (step === 2) return agent.name.trim().length > 0; return true }
  const handleNext = () => { if (step < TOTAL - 1 && canNext()) setStep(step + 1) }
  const handleBack = () => { if (step > 0) setStep(step - 1) }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const tid = tenant.id, uid = currentUser?.id
      const activeServices = services.filter(s => s.is_active)
      const currSymbol = CURRENCIES.find(c => c.key === currency)?.symbol || 'FCFA'

      // 1. tenant_services
      await supabase.from('tenant_services').delete().eq('tenant_id', tid)
      if (activeServices.length > 0) await supabase.from('tenant_services').insert(activeServices.map((s, i) => ({ tenant_id: tid, service_key: s.service_key, label: s.label, description: s.description || '', is_active: true, sort_order: i, qualification_questions: s.questions })))

      // 2. agent
      const { data: existingAgents } = await supabase.from('agents').select('id').eq('tenant_id', tid).limit(1)
      const svcLabels = activeServices.map(s => s.label).join(', ')
      const prompt = `Tu es ${agent.name}, assistante IA spécialisée en immobilier. Tu communiques en ${(agent.language || ['fr']).includes('fr') ? 'français' : 'anglais'} avec un ton ${agent.tone}.\n\nServices proposés : ${svcLabels}.\nDevise : ${currSymbol}.\n\nSi un client demande un service hors liste, redirige poliment. Ton rôle : qualifier les prospects, répondre aux FAQs, alerter l'agent humain sur les leads chauds.`
      const ap = { tenant_id: tid, name: agent.name, sector: 'real_estate', tone: agent.tone, language: agent.language || ['fr'], model: 'gpt-4.1-mini', is_active: true, system_prompt: prompt }
      if (existingAgents?.length > 0) await supabase.from('agents').update(ap).eq('id', existingAgents[0].id)
      else await supabase.from('agents').insert(ap)

      // 3. properties
      if (properties.length > 0) await supabase.from('properties').insert(properties.map(p => ({
        tenant_id: tid, title: p.title, price: p.price, zone: p.zone, property_type: p.property_type,
        transaction_type: p.transaction_type, rooms: p.rooms, surface: p.surface,
        description: p.description || '', status: 'available',
        images: (p.media || []).map(m => m.url),
      })))

      // 4. FAQs
      const validFaqs = faqs.filter(f => f.question && f.answer)
      if (validFaqs.length > 0) {
        await supabase.from('faqs').delete().eq('tenant_id', tid)
        await supabase.from('faqs').insert(validFaqs.map(f => ({ tenant_id: tid, question: f.question, answer: f.answer, category: f.category || 'Général', active: true, documents: (f.documents || []).map(d => ({ url: d.url, name: d.name, type: d.type })) })))
      }

      // 5. availability
      if (uid) {
        await supabase.from('availability').delete().eq('tenant_id', tid)
        if (availability.length > 0) await supabase.from('availability').insert(availability.map(s => ({ tenant_id: tid, user_id: uid, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, is_active: true })))
      }

      // 6. follow_up_rules
      const { data: existingRules } = await supabase.from('follow_up_rules').select('id').eq('tenant_id', tid).limit(1)
      const triggers = nurturing.enabled ? { cron_h2: true, cron_h24: true, cron_j3: true, cron_j7: true, cron_j30: true, db_trigger: true, post_visit: true } : { cron_h2: false, cron_h24: false, cron_j3: false, cron_j7: false, cron_j30: false, db_trigger: false, post_visit: false }
      const rp = { tenant_id: tid, max_followups_per_week: nurturing.maxPerWeek, cooldown_hours: nurturing.cooldownHours, enabled_triggers: triggers }
      if (existingRules?.length > 0) await supabase.from('follow_up_rules').update(rp).eq('id', existingRules[0].id)
      else await supabase.from('follow_up_rules').insert(rp)

      // 7. tenant settings (currency + onboarding done)
      await supabase.from('tenants').update({ default_sector: 'real_estate', onboarding_completed: true, settings: { currency }, updated_at: new Date().toISOString() }).eq('id', tid)

      await refreshAgents()
      toast.success(`${agent.name} est prête !`)
      onComplete?.()
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Erreur: ' + err.message)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${T.borderLight}`, background: T.bg, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1d1d1f, #3a3a3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>C</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>CERBERUS<span style={{ fontWeight: 300, color: T.textTer, marginLeft: 4 }}>AI</span></span>
        </div>
        <ProgressBar current={step} total={TOTAL} steps={STEPS} />
        <div style={{ minWidth: 90, textAlign: 'right' }}><span style={{ fontSize: 12, color: T.textQuat }}>Étape {step + 1}/{TOTAL}</span></div>
      </div>

      {/* Step bar */}
      <div style={{ padding: '12px 24px', background: T.bgTer, borderBottom: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        {(() => { const I = STEPS[step].icon; return <I size={16} color={T.blue} /> })()}
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>{STEPS[step].label}</span>
        <span style={{ fontSize: 13, color: T.textQuat }}>— {STEPS[step].desc}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 24px 120px' }}>
        {step === 0 && <StepServices services={services} onChange={setServices} />}
        {step === 1 && <StepQualification services={services} onChange={setServices} />}
        {step === 2 && <StepAgent agent={agent} onChange={setAgent} />}
        {step === 3 && <StepProperties properties={properties} onChange={setProperties} currency={currency} onCurrencyChange={setCurrency} tenantId={tenant?.id} />}
        {step === 4 && <StepFaqs faqs={faqs} onChange={setFaqs} tenantId={tenant?.id} />}
        {step === 5 && <StepAvailability slots={availability} onChange={setAvailability} />}
        {step === 6 && <StepNurturing nurturing={nurturing} onChange={setNurturing} />}
        {step === 7 && <StepWhatsApp />}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg, position: 'sticky', bottom: 0, zIndex: 10 }}>
        <div>{step > 0 && <button onClick={handleBack} style={btnSecondary}>Retour</button>}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {(step === 3 || step === 4) && <button onClick={handleNext} style={{ ...btnSecondary, color: T.textQuat, borderColor: 'transparent' }}>Passer</button>}
          {step < TOTAL - 1 ? (
            <button onClick={handleNext} disabled={!canNext()} style={btnPrimary(!canNext())}>Continuer</button>
          ) : (
            <button onClick={handleFinish} disabled={saving} style={{ ...btnPrimary(saving), padding: '14px 36px', fontSize: 16, fontWeight: 700, background: saving ? '#d2d2d7' : T.green, boxShadow: saving ? 'none' : '0 6px 24px rgba(52,199,89,.25)' }}>
              {saving ? <><Loader2 size={18} style={{ animation: 'spin-fast .6s linear infinite' }} /> Configuration...</> : <><Sparkles size={18} /> Lancer {agent.name}</>}
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
