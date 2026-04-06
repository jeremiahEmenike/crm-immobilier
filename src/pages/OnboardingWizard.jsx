import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { SECTORS, SECTOR_LABELS, AGENT_TONES, AGENT_LANGUAGES } from '../lib/constants'
import {
  Building2, ShoppingCart, Heart, UtensilsCrossed,
  ArrowRight, ArrowLeft, Check, Sparkles, Phone,
  Bot, Globe, Upload, FileText, MapPin, Utensils,
  Package, Stethoscope, ToggleLeft, ToggleRight,
  Sliders, MessageSquare, Zap, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Icons ──────────────────────────────────
const SECTOR_ICONS = {
  real_estate: Building2,
  ecommerce: ShoppingCart,
  medical: Heart,
  restaurant: UtensilsCrossed,
}

const SECTOR_COLORS = {
  real_estate: '#0071e3',
  ecommerce: '#30d158',
  medical: '#ff375f',
  restaurant: '#ff9f0a',
}

// ─── Agent Personas ─────────────────────────
const AGENT_PERSONAS = {
  real_estate: {
    name: 'Ama', tagline: 'Votre commerciale IA',
    mission: 'Générer des leads chauds et booker des visites.',
    greeting: 'Bonjour ! Je suis Ama. Je qualifie vos prospects, propose les meilleurs biens, et planifie les visites — 24h/24.',
    superPowers: ['Matching vectoriel sur catalogue de biens', 'Scoring BANT automatique'],
  },
  ecommerce: {
    name: 'Nova', tagline: 'Votre vendeur IA 24/7',
    mission: 'Convertir les paniers abandonnés et maximiser les ventes.',
    greeting: 'Hey ! Je suis Nova. Je gère vos commandes, relance les paniers, et booste vos ventes — même la nuit.',
    superPowers: ['Recherche produits par photo (Vision IA)', 'Suivi de commande en temps réel'],
  },
  medical: {
    name: 'Dr. Santé', tagline: 'Votre secrétaire IA',
    mission: 'Filtrer les urgences, rassurer et planifier les RDV.',
    greeting: 'Bonjour ! Je suis Dr. Santé. Je gère vos rendez-vous et prépare les consultations de vos patients.',
    superPowers: ['Empathie extrême + 0 diagnostic médical', 'Rappels RDV anti no-show'],
  },
  restaurant: {
    name: 'Chef Bot', tagline: "Votre maître d'hôtel IA",
    mission: 'Maximiser le panier moyen et gérer les réservations.',
    greeting: 'Bonsoir ! Je suis Chef Bot. Réservations, commandes, menu du jour — je fais tourner votre restaurant.',
    superPowers: ['Lecture des pins GPS WhatsApp', 'Upsell automatique intelligent'],
  },
}

// ─── Sector-specific form fields ────────────
const SECTOR_FIELDS = {
  real_estate: {
    title: 'Configuration Agence Immobilière',
    icon: Building2,
    fields: [
      { key: 'commission_rate', label: 'Taux de commission (%)', type: 'text', placeholder: 'Ex: 10%', help: 'Le taux de commission de votre agence.' },
      { key: 'zones', label: 'Zones couvertes', type: 'text', placeholder: 'Ex: Cocody, Marcory, Plateau...', help: 'Les quartiers et zones que vous couvrez.' },
      { key: 'property_types', label: 'Types de biens', type: 'text', placeholder: 'Ex: Appartements, Villas, Terrains...', help: 'Les types de biens que vous gérez.' },
      { key: 'calendar_link', label: 'Lien calendrier visites', type: 'text', placeholder: 'https://calendly.com/...', help: 'Pour la planification automatique des visites.' },
    ],
  },
  restaurant: {
    title: 'Configuration Restaurant',
    icon: Utensils,
    fields: [
      { key: 'delivery_zones', label: 'Zones de livraison & frais', type: 'textarea', placeholder: 'Zone 1: Lomé centre — 500F\nZone 2: Banlieue — 1000F', help: 'Détaillez vos zones et frais de livraison.' },
      { key: 'prep_time', label: 'Temps de préparation moyen', type: 'text', placeholder: 'Ex: 30 minutes', help: 'Temps moyen pour préparer une commande.' },
      { key: 'payment_methods', label: 'Modes de paiement', type: 'text', placeholder: 'Ex: Cash, Mobile Money, Carte...', help: 'Les méthodes de paiement acceptées.' },
      { key: 'opening_hours', label: 'Horaires d\'ouverture', type: 'text', placeholder: 'Ex: Lun-Sam 11h-23h, Dim 12h-22h', help: 'Vos horaires d\'ouverture.' },
    ],
  },
  ecommerce: {
    title: 'Configuration Boutique',
    icon: Package,
    fields: [
      { key: 'catalog_source', label: 'Source du catalogue', type: 'select', options: ['Manuel (Google Sheets)', 'Shopify', 'WooCommerce', 'Autre'], help: 'D\'où viennent vos produits ?' },
      { key: 'return_policy', label: 'Politique de retour', type: 'textarea', placeholder: 'Ex: Retour accepté sous 14 jours...', help: 'Votre politique de retour et remboursement.' },
      { key: 'shipping_info', label: 'Frais d\'expédition', type: 'text', placeholder: 'Ex: Gratuit > 25 000F, sinon 2000F', help: 'Vos conditions de livraison.' },
      { key: 'payment_methods', label: 'Modes de paiement', type: 'text', placeholder: 'Ex: Mobile Money, Cash à la livraison...', help: 'Les méthodes de paiement acceptées.' },
    ],
  },
  medical: {
    title: 'Configuration Clinique',
    icon: Stethoscope,
    fields: [
      { key: 'specialties', label: 'Spécialités proposées', type: 'text', placeholder: 'Ex: Dentisterie, Pédiatrie, Ophtalmologie...', help: 'Les spécialités de votre centre.' },
      { key: 'pre_visit', label: 'Instructions pré-RDV', type: 'textarea', placeholder: 'Ex: Être à jeun, apporter carte vitale...', help: 'Instructions données avant chaque RDV.' },
      { key: 'insurances', label: 'Assurances acceptées', type: 'text', placeholder: 'Ex: CNAM, AXA, Allianz...', help: 'Les assurances que vous acceptez.' },
      { key: 'emergency_protocol', label: 'Protocole d\'urgence', type: 'text', placeholder: 'Ex: Appeler le 15, venir directement...', help: 'Que faire en cas d\'urgence.' },
    ],
  },
}

// ─── Behavior toggles ───────────────────────
const BEHAVIOR_TOGGLES = {
  real_estate: [
    { key: 'auto_match', label: 'Matching automatique de biens', desc: 'L\'agent propose automatiquement des biens correspondant aux critères du lead.', default: true },
    { key: 'auto_book', label: 'Planification automatique de visites', desc: 'Créneaux proposés et confirmés sans intervention humaine.', default: true },
    { key: 'require_budget', label: 'Exiger le budget avant de proposer', desc: 'L\'agent demande le budget avant de matcher des biens.', default: true },
    { key: 'hot_lead_alert', label: 'Alertes leads chauds', desc: 'Notification immédiate quand un lead est scoré HOT.', default: true },
  ],
  ecommerce: [
    { key: 'upsell', label: 'Proposer des ventes additionnelles', desc: 'L\'agent suggère des produits complémentaires.', default: true },
    { key: 'cart_recovery', label: 'Relance panier abandonné', desc: 'Relance automatique après X heures d\'inactivité.', default: true },
    { key: 'order_tracking', label: 'Suivi de commande automatique', desc: 'L\'agent donne le statut sans intervention humaine.', default: true },
    { key: 'promo_push', label: 'Promotions personnalisées', desc: 'Envoi de promos ciblées en fonction de l\'historique.', default: false },
  ],
  medical: [
    { key: 'triage', label: 'Triage par niveau d\'urgence', desc: 'Classificaiton automatique des demandes (Urgente / Normal / Suivi).', default: true },
    { key: 'pre_consult', label: 'Pré-consultation automatisée', desc: 'Collecte des symptômes avant le RDV.', default: true },
    { key: 'reminders', label: 'Rappels de RDV', desc: 'Rappel H-24 et H-2 automatique.', default: true },
    { key: 'no_diagnosis', label: 'Stricte limitation diagnostic', desc: 'L\'agent ne donne JAMAIS de diagnostic médical.', default: true },
  ],
  restaurant: [
    { key: 'upsell', label: 'Proposer des ventes additionnelles', desc: '"Avec cette pizza, une boisson fraîche pour 1000F ?"', default: true },
    { key: 'require_location', label: 'Exiger la localisation GPS', desc: 'Demander le pin GPS avant de valider la livraison.', default: true },
    { key: 'auto_calc', label: 'Calcul automatique du total', desc: 'Calcule et affiche le total de la commande automatiquement.', default: true },
    { key: 'reviews', label: 'Collecte d\'avis automatique', desc: 'Demande un avis après chaque commande/visite.', default: false },
  ],
}

// ─── Step indicator ─────────────────────────
function StepBar({ current, steps }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
              i < current ? 'bg-brand-500 text-white' :
              i === current ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40' :
              'bg-dark-600 text-dark-200 border border-dark-400'
            }`}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= current ? 'text-dark-50' : 'text-dark-200'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-12 h-px transition-all duration-500 ${i < current ? 'bg-brand-500' : 'bg-dark-400'}`} />}
        </div>
      ))}
    </div>
  )
}

// ─── Toggle switch ──────────────────────────
function Toggle({ on, onToggle, color }) {
  return (
    <button onClick={onToggle} className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
      style={{ background: on ? color || '#0071e3' : '#d2d2d7' }}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

// ═══════════════════════════════════════════════
// STEP 1: LE RÔLE (Template Selection)
// ═══════════════════════════════════════════════
function StepRole({ value, onChange }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-5">
          <Sparkles size={12} />
          Étape 1 · Le Rôle
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight mb-3">
          Choisissez votre secteur
        </h2>
        <p className="text-dark-100 text-sm max-w-lg mx-auto">
          Votre agent sera pré-configuré avec les meilleurs templates, scoring et flux de votre industrie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTORS.map(s => {
          const Icon = SECTOR_ICONS[s.key]
          const persona = AGENT_PERSONAS[s.key]
          const color = SECTOR_COLORS[s.key]
          const selected = value === s.key

          return (
            <motion.button
              key={s.key}
              onClick={() => onChange(s.key)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className={`relative p-6 rounded-2xl text-left transition-all duration-300 border ${
                selected ? 'border-transparent shadow-xl' : 'bg-dark-600 border-dark-400 hover:border-dark-300'
              }`}
              style={selected ? {
                background: `linear-gradient(135deg, ${color}18, ${color}06)`,
                borderColor: `${color}50`,
                boxShadow: `0 8px 32px ${color}18`,
              } : {}}
            >
              {selected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: color }}>
                  <Check size={14} className="text-white" />
                </div>
              )}

              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}15` }}>
                <Icon size={22} style={{ color }} />
              </div>

              <h3 className="font-display font-bold text-lg mb-0.5">{s.label}</h3>
              <p className="text-xs font-medium mb-2" style={{ color }}>{persona.name} · {persona.tagline}</p>
              <p className="text-xs text-dark-200 leading-relaxed mb-3">{persona.mission}</p>

              <div className="flex flex-wrap gap-1.5">
                {persona.superPowers.map((sp, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-dark-500/50 text-dark-100 border border-dark-400/50">{sp}</span>
                ))}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// STEP 2: LE CERVEAU (Knowledge Base)
// ═══════════════════════════════════════════════
function StepBrain({ sector, data, onChange }) {
  const config = SECTOR_FIELDS[sector]
  const color = SECTOR_COLORS[sector]
  const SectorIcon = config.icon
  const fileRef = useRef(null)
  const [files, setFiles] = useState([])

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
    // Store file names in data for display
    onChange({ ...data, _files: [...(data._files || []), ...newFiles.map(f => f.name)] })
  }

  const updateField = (key, val) => onChange({ ...data, [key]: val })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
          <FileText size={12} />
          Étape 2 · Le Cerveau
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight mb-3">
          Nourrissez votre agent
        </h2>
        <p className="text-dark-100 text-sm max-w-lg mx-auto">
          Uploadez vos documents et remplissez les informations clés. L'IA s'occupe du reste.
        </p>
      </div>

      {/* Upload area */}
      <div className="mb-8">
        <label className="text-xs font-bold text-dark-100 uppercase tracking-wider flex items-center gap-2 mb-3">
          <Upload size={12} /> Documents & Base de connaissances
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-dark-400 rounded-2xl p-8 text-center cursor-pointer hover:border-dark-300 transition-colors group"
        >
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-dark-600 group-hover:bg-dark-500 transition-colors">
            <Upload size={24} className="text-dark-200 group-hover:text-dark-100 transition-colors" />
          </div>
          <p className="text-sm font-medium mb-1">Glissez vos fichiers ici ou cliquez pour uploader</p>
          <p className="text-xs text-dark-200">
            {sector === 'restaurant' ? 'Menu PDF, carte, grille de prix...' :
             sector === 'real_estate' ? 'Plaquette agence, catalogue biens, grille de prix...' :
             sector === 'ecommerce' ? 'Catalogue produits, conditions de vente...' :
             'Plaquette clinique, liste des spécialités, FAQ patients...'}
          </p>
          <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" className="hidden" onChange={handleFileChange} />
        </div>

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-600 border border-dark-400 text-xs">
                <FileText size={12} className="text-dark-200" />
                <span className="text-dark-50 truncate max-w-[150px]">{f.name}</span>
                <button onClick={() => {
                  setFiles(files.filter((_, j) => j !== i))
                  onChange({ ...data, _files: (data._files || []).filter((_, j) => j !== i) })
                }} className="text-dark-200 hover:text-red-400">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sector-specific form */}
      <div className="p-6 rounded-2xl bg-dark-600/50 border border-dark-400">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
            <SectorIcon size={18} style={{ color }} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">{config.title}</h3>
            <p className="text-[10px] text-dark-200">Informations spécifiques à votre activité</p>
          </div>
        </div>

        <div className="space-y-5">
          {config.fields.map(field => (
            <div key={field.key}>
              <label className="text-xs font-semibold text-dark-100 mb-1.5 block">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder={field.placeholder}
                  value={data[field.key] || ''}
                  onChange={e => updateField(field.key, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select className="input" value={data[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}>
                  <option value="">Sélectionner...</option>
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  className="input"
                  type="text"
                  placeholder={field.placeholder}
                  value={data[field.key] || ''}
                  onChange={e => updateField(field.key, e.target.value)}
                />
              )}
              <p className="text-[10px] text-dark-200 mt-1">{field.help}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-dark-200 mt-4">
        Vous pourrez compléter et modifier tout cela depuis les paramètres.
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════
// STEP 3: LE COMPORTEMENT (Behavior + Connect)
// ═══════════════════════════════════════════════
function StepBehavior({ sector, config, onChange, phone, onPhoneChange }) {
  const persona = AGENT_PERSONAS[sector]
  const color = SECTOR_COLORS[sector]
  const toggles = BEHAVIOR_TOGGLES[sector] || []
  const [behaviorToggles, setBehaviorToggles] = useState(() => {
    const initial = {}
    toggles.forEach(t => { initial[t.key] = t.default })
    return initial
  })

  const toggleBehavior = (key) => {
    const next = { ...behaviorToggles, [key]: !behaviorToggles[key] }
    setBehaviorToggles(next)
    onChange({ ...config, behaviors: next })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-5">
          <Sliders size={12} />
          Étape 3 · Le Comportement
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight mb-3">
          Réglez votre agent
        </h2>
        <p className="text-dark-100 text-sm max-w-lg mx-auto">
          Personnalisation, comportement et connexion WhatsApp. Tout en un.
        </p>
      </div>

      <div className="space-y-8">
        {/* Agent Identity */}
        <div className="p-5 rounded-2xl bg-dark-600/50 border border-dark-400">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2"><Bot size={14} className="text-brand-400" /> Identité de l'agent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-dark-100 mb-1.5 block">Nom de l'agent</label>
              <input className="input" placeholder={persona.name} value={config.name} onChange={e => onChange({ ...config, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-dark-100 mb-1.5 block">Langues</label>
              <div className="flex flex-wrap gap-2">
                {AGENT_LANGUAGES.map(l => {
                  const active = config.languages.includes(l.key)
                  return (
                    <button key={l.key} onClick={() => {
                      const langs = active ? config.languages.filter(k => k !== l.key) : [...config.languages, l.key]
                      if (langs.length > 0) onChange({ ...config, languages: langs })
                    }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      active ? 'bg-brand-500/15 border-brand-500/30 text-brand-300' : 'bg-dark-600 border-dark-400 text-dark-200 hover:border-dark-300'
                    }`}>
                      {active && <Check size={10} className="inline mr-1" />}{l.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tone Slider */}
        <div className="p-5 rounded-2xl bg-dark-600/50 border border-dark-400">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2"><MessageSquare size={14} className="text-brand-400" /> Ton de communication</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dark-200 w-20 text-right">Professionnel</span>
            <div className="flex-1 relative">
              <input
                type="range" min="0" max="3" step="1"
                value={AGENT_TONES.findIndex(t => t.key === config.tone)}
                onChange={e => onChange({ ...config, tone: AGENT_TONES[Number(e.target.value)].key })}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, ${color}60, ${color})`, accentColor: color }}
              />
              <div className="flex justify-between mt-1.5">
                {AGENT_TONES.map((t, i) => (
                  <span key={i} className={`text-[9px] ${config.tone === t.key ? 'text-dark-50 font-bold' : 'text-dark-300'}`}>{t.label}</span>
                ))}
              </div>
            </div>
            <span className="text-xs text-dark-200 w-20">Décontracté</span>
          </div>
        </div>

        {/* Behavior Toggles */}
        <div className="p-5 rounded-2xl bg-dark-600/50 border border-dark-400">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2"><Zap size={14} style={{ color }} /> Comportements</h3>
          <div className="space-y-4">
            {toggles.map(t => (
              <div key={t.key} className="flex items-start gap-4">
                <Toggle on={behaviorToggles[t.key]} onToggle={() => toggleBehavior(t.key)} color={color} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-dark-200 mt-0.5">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Connection */}
        <div className="p-5 rounded-2xl bg-dark-600/50 border border-dark-400">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2"><Phone size={14} className="text-emerald-400" /> Connexion WhatsApp</h3>
          <div className="flex gap-2 mb-3">
            <span className="flex items-center px-3 py-2.5 rounded-lg bg-dark-700 border border-dark-400 text-sm text-dark-100">+228</span>
            <input className="input flex-1" placeholder="90 XX XX XX" value={phone} onChange={e => onPhoneChange(e.target.value)} />
          </div>
          <p className="text-[10px] text-dark-200">Le numéro WhatsApp Business sur lequel votre agent répondra. Vous pouvez passer cette étape.</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// STEP COMPLETE
// ═══════════════════════════════════════════════
function StepComplete({ sector, agentName }) {
  const persona = AGENT_PERSONAS[sector]
  const color = SECTOR_COLORS[sector]

  return (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
      >
        <Check size={36} className="text-white" />
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-3xl font-display font-extrabold tracking-tight mb-3">
          {agentName || persona.name} est prêt !
        </h2>
        <p className="text-dark-100 text-sm max-w-md mx-auto mb-10">
          Votre agent IA est configuré et opérationnel. Explorez le dashboard pour lancer vos premières conversations.
        </p>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        {[
          { icon: Bot, label: 'Agent Builder', desc: 'Affiner votre agent' },
          { icon: MessageSquare, label: 'Conversations', desc: 'Suivre les échanges' },
          { icon: Zap, label: 'Templates', desc: 'Configurer les flux' },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-dark-600 border border-dark-400 hover:border-dark-300 transition-colors cursor-pointer">
            <item.icon size={20} style={{ color }} className="mx-auto mb-2" />
            <div className="text-xs font-semibold">{item.label}</div>
            <div className="text-[10px] text-dark-200 mt-0.5">{item.desc}</div>
          </div>
        ))}
      </motion.div>
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

  // State
  const [sector, setSector] = useState(tenant?.default_sector || 'real_estate')
  const [brainData, setBrainData] = useState({})
  const [agentConfig, setAgentConfig] = useState({
    name: AGENT_PERSONAS[tenant?.default_sector || 'real_estate']?.name || 'Ama',
    tone: 'professional',
    languages: ['fr'],
    behaviors: {},
  })
  const [whatsappPhone, setWhatsappPhone] = useState('')

  // Update defaults when sector changes
  useEffect(() => {
    const persona = AGENT_PERSONAS[sector]
    if (persona) {
      setAgentConfig(prev => ({ ...prev, name: persona.name }))
    }
    setBrainData({})
  }, [sector])

  const STEP_NAMES = ['Le Rôle', 'Le Cerveau', 'Le Comportement']
  const TOTAL_STEPS = 3 // + complete screen

  const canNext = () => {
    if (step === 0) return !!sector
    if (step === 2) return agentConfig.name.trim().length > 0
    return true
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      // 1. Update tenant
      await supabase
        .from('tenants')
        .update({
          default_sector: sector,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenant.id)

      // 2. Create/update agent
      const { data: existingAgents } = await supabase
        .from('agents')
        .select('id')
        .eq('tenant_id', tenant.id)
        .limit(1)

      const persona = AGENT_PERSONAS[sector]
      const agentPayload = {
        tenant_id: tenant.id,
        name: agentConfig.name || persona.name,
        sector: sector,
        tone: agentConfig.tone,
        language: agentConfig.languages,
        model: 'gpt-4.1-mini',
        is_active: true,
        persona_instructions: persona.greeting,
        system_prompt: `Tu es ${agentConfig.name}, un assistant IA ${persona.tagline.toLowerCase()} spécialisé en ${SECTOR_LABELS[sector].toLowerCase()}. Tu communiques en ${agentConfig.languages.map(l => l === 'fr' ? 'français' : l === 'en' ? 'anglais' : l).join(' et ')} avec un ton ${agentConfig.tone}.`,
        config: {
          behaviors: agentConfig.behaviors,
          brain: brainData,
        },
      }

      if (existingAgents && existingAgents.length > 0) {
        await supabase.from('agents').update(agentPayload).eq('id', existingAgents[0].id)
      } else {
        await supabase.from('agents').insert(agentPayload)
      }

      // 3. Save WhatsApp number
      if (whatsappPhone.trim()) {
        const fullPhone = `+228${whatsappPhone.replace(/\s/g, '')}`
        await supabase.from('whatsapp_numbers').upsert({
          tenant_id: tenant.id,
          phone_number: fullPhone,
          display_name: agentConfig.name,
          status: 'connected',
        }, { onConflict: 'tenant_id,phone_number' })
      }

      // 4. Store brain data as knowledge base
      if (Object.keys(brainData).filter(k => !k.startsWith('_')).length > 0) {
        const kbEntries = Object.entries(brainData)
          .filter(([k, v]) => v && !k.startsWith('_'))
          .map(([key, value]) => ({
            tenant_id: tenant.id,
            category: sector,
            question: key.replace(/_/g, ' '),
            answer: value,
          }))
        if (kbEntries.length > 0) {
          await supabase.from('faqs').upsert(kbEntries, { onConflict: 'tenant_id,question' }).catch(() => {})
        }
      }

      await refreshAgents()
      toast.success(`${agentConfig.name} est opérationnel !`)
      onComplete?.()
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Erreur lors de la configuration')
    } finally {
      setSaving(false)
    }
  }

  const isComplete = step === TOTAL_STEPS
  const pageVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-dark-400">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-extrabold text-sm"
            style={{ background: `linear-gradient(135deg, ${SECTOR_COLORS[sector]}, ${SECTOR_COLORS[sector]}aa)` }}>C</div>
          <span className="font-display font-bold text-sm">CERBERUS<span className="text-dark-200 font-light ml-1">AI</span></span>
        </div>
        {!isComplete && <StepBar current={step} steps={STEP_NAMES} />}
        <div className="w-20" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-10 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && <StepRole value={sector} onChange={setSector} />}
            {step === 1 && <StepBrain sector={sector} data={brainData} onChange={setBrainData} />}
            {step === 2 && <StepBehavior sector={sector} config={agentConfig} onChange={setAgentConfig} phone={whatsappPhone} onPhoneChange={setWhatsappPhone} />}
            {isComplete && <StepComplete sector={sector} agentName={agentConfig.name} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-dark-400 flex items-center justify-between">
        <div>
          {step > 0 && !isComplete && (
            <button onClick={handleBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-dark-100 hover:text-dark-50 transition-colors">
              <ArrowLeft size={14} /> Retour
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isComplete ? (
            <>
              {step === 1 && (
                <button onClick={handleNext} className="text-xs text-dark-200 hover:text-dark-100 transition-colors">
                  Passer →
                </button>
              )}
              <button
                onClick={step === TOTAL_STEPS - 1 ? handleFinish : handleNext}
                disabled={!canNext() || saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: SECTOR_COLORS[sector], boxShadow: `0 4px 16px ${SECTOR_COLORS[sector]}30` }}
              >
                {saving ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Configuration...</span>
                ) : step === TOTAL_STEPS - 1 ? (
                  <span className="flex items-center gap-2">Lancer l'agent <Sparkles size={14} /></span>
                ) : (
                  <span className="flex items-center gap-2">Continuer <ArrowRight size={14} /></span>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: SECTOR_COLORS[sector], boxShadow: `0 4px 16px ${SECTOR_COLORS[sector]}30` }}
            >
              Accéder au dashboard <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
