import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { Phone, Plus, Trash2, Wifi, WifiOff, Loader2, AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Send, FileText, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const FB_APP_ID = '2073311963469724'
const FB_SDK_VERSION = 'v22.0'
const GRAPH_API = 'https://graph.facebook.com/' + FB_SDK_VERSION

// ─── Facebook SDK Loader ────────────────────────
function loadFacebookSDK() {
  return new Promise((resolve) => {
    if (window.FB) { resolve(window.FB); return }
    window.fbAsyncInit = function () {
      window.FB.init({ appId: FB_APP_ID, cookie: true, xfbml: true, version: FB_SDK_VERSION })
      resolve(window.FB)
    }
    if (document.getElementById('facebook-jssdk')) { resolve(window.FB); return }
    const s = document.createElement('script')
    s.id = 'facebook-jssdk'
    s.src = 'https://connect.facebook.net/en_US/sdk.js'
    s.async = true; s.defer = true
    document.body.appendChild(s)
  })
}

// ─── Embedded Signup ────────────────────────────
async function launchEmbeddedSignup(onSuccess) {
  const FB = await loadFacebookSDK()
  if (!FB) { toast.error("Impossible de charger le SDK Facebook"); return }
  FB.login((r) => {
    if (r.authResponse) { onSuccess(r.authResponse) }
    else { toast.error("Connexion annulée") }
  }, {
    config_id: '',
    response_type: 'code',
    override_default_response_type: true,
    extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
  })
}

// ─── Status Badge ───────────────────────────────
function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600">
      <Wifi size={11} /> Connecté
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500">
      <WifiOff size={11} /> Déconnecté
    </span>
  )
}

// ─── Tab Button ─────────────────────────────────
function Tab({ active, icon: Icon, label, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-150
        ${active
          ? 'text-brand-500 bg-brand-500/10 border border-brand-500/20'
          : 'text-dark-200 hover:text-dark-100 hover:bg-dark-500 border border-transparent'
        }`}
    >
      <Icon size={15} />
      {label}
      {count != null && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-brand-500/20 text-brand-500' : 'bg-dark-400 text-dark-200'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 1 — NUMBERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function NumberCard({ number, agents, onDelete, onToggle, deleting }) {
  const agent = agents.find(a => a.id === number.agent_id)
  return (
    <div className="card p-5 hover:border-dark-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Phone size={20} className="text-emerald-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold">{number.display_phone_number || 'N/A'}</span>
              <StatusBadge active={number.is_active} />
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-dark-200">
              {number.label && <span>{number.label}</span>}
              {number.label && <span className="text-dark-300">·</span>}
              <span className="font-mono text-[11px]">ID: {number.phone_number_id}</span>
            </div>
            {agent && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-500 text-[11px] font-medium">
                🤖 {agent.name}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onToggle(number)} className="btn-sm text-[11px]">
            {number.is_active ? 'Désactiver' : 'Activer'}
          </button>
          <button
            onClick={() => onDelete(number)}
            disabled={deleting === number.id}
            className="p-2 rounded-lg text-dark-200 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            {deleting === number.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
      {(number.waba_id || number.business_id) && (
        <div className="mt-4 pt-3 border-t border-dark-400/60 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-dark-200">
          {number.waba_id && <span>WABA: <span className="font-mono">{number.waba_id}</span></span>}
          {number.business_id && <span>Business: <span className="font-mono">{number.business_id}</span></span>}
        </div>
      )}
    </div>
  )
}

function ManualAddModal({ onClose, onAdd, saving }) {
  const [form, setForm] = useState({ phone_number_id: '', display_phone_number: '', label: 'Principal', waba_id: '', access_token: '' })
  const set = (k, v) => setForm({ ...form, [k]: v })
  const submit = () => {
    if (!form.phone_number_id) return toast.error("Phone Number ID requis")
    if (!form.display_phone_number) return toast.error("Numéro affiché requis")
    onAdd(form)
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1">Ajouter un numéro manuellement</h3>
        <p className="text-dark-200 text-xs mb-5">Entrez les informations depuis votre dashboard Meta.</p>
        <div className="space-y-4">
          <div><label className="label">Phone Number ID *</label><input className="input" value={form.phone_number_id} onChange={e => set('phone_number_id', e.target.value)} placeholder="ex: 927720083764890" /><p className="text-[10px] text-dark-200 mt-1">Meta Business → WhatsApp → Configuration</p></div>
          <div><label className="label">Numéro affiché *</label><input className="input" value={form.display_phone_number} onChange={e => set('display_phone_number', e.target.value)} placeholder="ex: +228 92 42 46 65" /></div>
          <div><label className="label">Label</label><input className="input" value={form.label} onChange={e => set('label', e.target.value)} placeholder="ex: Principal, Support" /></div>
          <div><label className="label">WABA ID</label><input className="input" value={form.waba_id} onChange={e => set('waba_id', e.target.value)} placeholder="WhatsApp Business Account ID" /></div>
          <div><label className="label">Access Token</label><input className="input" type="password" value={form.access_token} onChange={e => set('access_token', e.target.value)} placeholder="Token d'accès" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex items-center gap-2" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Enregistrement...</> : <><Plus size={14} /> Ajouter</>}
          </button>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

function NumbersTab({ numbers, agents, loading, onAdd, onDelete, onToggle, deleting, onEmbeddedSignup }) {
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAdd = async (form) => {
    setSaving(true)
    await onAdd(form)
    setSaving(false)
    setShowModal(false)
  }

  return (
    <>
      <div className="card p-4 mb-5 border-brand-500/20 bg-brand-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle size={16} className="text-brand-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">Connexion WhatsApp Business</p>
            <p className="text-xs text-dark-200 leading-relaxed">
              Connectez votre numéro via Embedded Signup ou ajoutez-le manuellement avec le Phone Number ID.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={onEmbeddedSignup} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90" style={{ background: '#1877F2' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Connecter avec Facebook
              </button>
              <button onClick={() => setShowModal(true)} className="btn-ghost text-[12px] flex items-center gap-1.5">
                <Plus size={13} /> Ajouter manuellement
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="text-brand-500 animate-spin" /></div>}

      {!loading && numbers.length === 0 && (
        <div className="card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-5"><Phone size={28} className="text-emerald-500" /></div>
          <h3 className="text-lg font-bold mb-2">Aucun numéro connecté</h3>
          <p className="text-dark-200 text-sm max-w-md mx-auto mb-6">Connectez votre premier numéro WhatsApp Business pour activer votre agent IA.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2"><Plus size={16} /> Ajouter un numéro</button>
        </div>
      )}

      {!loading && numbers.length > 0 && (
        <div className="space-y-3">
          {numbers.map(n => <NumberCard key={n.id} number={n} agents={agents} onDelete={onDelete} onToggle={onToggle} deleting={deleting} />)}
          <div className="flex items-center gap-4 pt-3 text-xs text-dark-200">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> {numbers.filter(n => n.is_active).length} actif{numbers.filter(n => n.is_active).length > 1 ? 's' : ''}</span>
            <span>{numbers.length} numéro{numbers.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {showModal && <ManualAddModal onClose={() => setShowModal(false)} onAdd={handleAdd} saving={saving} />}
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 2 — SEND TEST MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SendTestTab({ numbers }) {
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [recipientPhone, setRecipientPhone] = useState('')
  const [messageText, setMessageText] = useState('Bonjour ! Ceci est un message de test envoyé depuis Cerberus AI. 🤖')
  const [accessToken, setAccessToken] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const active = numbers.find(n => n.is_active)
    if (active) {
      setSelectedNumber(active)
      if (active.access_token) setAccessToken(active.access_token)
    }
  }, [numbers])

  const handleSend = async () => {
    if (!selectedNumber) return toast.error("Sélectionnez un numéro")
    if (!recipientPhone) return toast.error("Entrez le numéro du destinataire")
    if (!messageText.trim()) return toast.error("Entrez un message")
    if (!accessToken) return toast.error("Access Token requis")

    const cleanPhone = recipientPhone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')
    setSending(true)
    setResult(null)

    try {
      const response = await fetch(`${GRAPH_API}/${selectedNumber.phone_number_id}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: messageText },
        }),
      })
      const data = await response.json()

      if (response.ok && data.messages?.[0]?.id) {
        setResult({ success: true, messageId: data.messages[0].id, timestamp: new Date().toISOString() })
        toast.success('Message envoyé !')
      } else {
        setResult({ success: false, error: data.error?.message || JSON.stringify(data) })
        toast.error('Erreur: ' + (data.error?.message || 'Échec'))
      }
    } catch (err) {
      setResult({ success: false, error: err.message })
      toast.error('Erreur réseau: ' + err.message)
    }
    setSending(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="card p-4 mb-5 border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Send size={14} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-0.5">Envoyer un message test</p>
            <p className="text-xs text-dark-200 leading-relaxed">
              Envoyez un message via l'API WhatsApp Business pour la vidéo App Review Meta.
              Le destinataire doit avoir envoyé un message au numéro dans les dernières 24h.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Numéro expéditeur</label>
          <select className="input" value={selectedNumber?.id || ''} onChange={e => {
            const n = numbers.find(n => n.id === e.target.value)
            setSelectedNumber(n)
            if (n?.access_token) setAccessToken(n.access_token)
          }}>
            <option value="">-- Choisir --</option>
            {numbers.map(n => <option key={n.id} value={n.id}>{n.display_phone_number} ({n.label || 'Sans label'})</option>)}
          </select>
        </div>

        <div>
          <label className="label">Access Token</label>
          <input className="input" type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Token Meta" />
          <p className="text-[10px] text-dark-200 mt-1">Meta Developers → App → WhatsApp → Configuration → Token temporaire</p>
        </div>

        <div>
          <label className="label">Numéro destinataire</label>
          <input className="input" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="ex: 22892424665" />
        </div>

        <div>
          <label className="label">Message</label>
          <textarea className="input min-h-[100px] resize-y" value={messageText} onChange={e => setMessageText(e.target.value)} />
          <p className="text-[10px] text-dark-200 mt-1">{messageText.length} caractères</p>
        </div>

        <button className="btn-primary flex items-center gap-2 w-full justify-center" onClick={handleSend} disabled={sending}>
          {sending ? <><Loader2 size={16} className="animate-spin" /> Envoi...</> : <><Send size={16} /> Envoyer le message</>}
        </button>

        {result && (
          <div className={`p-4 rounded-xl border text-sm ${result.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            {result.success ? (
              <div>
                <div className="flex items-center gap-2 font-semibold text-emerald-600 mb-2"><CheckCircle2 size={16} /> Message envoyé !</div>
                <div className="text-xs text-dark-200 space-y-1">
                  <div>Message ID: <span className="font-mono bg-dark-500 px-2 py-0.5 rounded">{result.messageId}</span></div>
                  <div>Destinataire: {recipientPhone}</div>
                  <div>Expéditeur: {selectedNumber?.display_phone_number}</div>
                  <div>Heure: {new Date(result.timestamp).toLocaleTimeString('fr-FR')}</div>
                </div>
                <p className="text-xs text-emerald-600 mt-3 font-medium">
                  ✅ Ouvrez WhatsApp sur le téléphone destinataire pour vérifier la réception.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 font-semibold text-red-500 mb-2"><AlertCircle size={16} /> Erreur</div>
                <div className="text-xs font-mono bg-dark-500 p-3 rounded-lg overflow-x-auto text-dark-200">{result.error}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 3 — MESSAGE TEMPLATES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TEMPLATE_CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utilitaire' },
  { value: 'AUTHENTICATION', label: 'Authentification' },
]

const TEMPLATE_LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en_US', label: 'Anglais (US)' },
  { value: 'en', label: 'Anglais' },
]

function TemplatesTab({ numbers }) {
  const [wabaId, setWabaId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [templates, setTemplates] = useState([])
  const [loadingTpl, setLoadingTpl] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState(null)

  const [form, setForm] = useState({
    name: 'cerberus_welcome',
    category: 'MARKETING',
    language: 'fr',
    headerText: '',
    bodyText: 'Bonjour {{1}} ! 👋\n\nMerci de nous avoir contacté. Nous avons trouvé des biens qui correspondent à vos critères dans la zone {{2}}.\n\nNotre conseiller va vous recontacter très bientôt.',
    footerText: 'Cerberus AI - Votre assistant immobilier',
    buttonText: '',
  })
  const set = (k, v) => setForm({ ...form, [k]: v })

  useEffect(() => {
    const n = numbers.find(n => n.waba_id)
    if (n?.waba_id) setWabaId(n.waba_id)
    if (n?.access_token) setAccessToken(n.access_token)
  }, [numbers])

  const fetchTemplates = async () => {
    if (!wabaId || !accessToken) return toast.error("WABA ID et Token requis")
    setLoadingTpl(true)
    try {
      const res = await fetch(`${GRAPH_API}/${wabaId}/message_templates?limit=20`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.data) { setTemplates(data.data); toast.success(`${data.data.length} template(s)`) }
      else toast.error(data.error?.message || 'Erreur')
    } catch (err) { toast.error(err.message) }
    setLoadingTpl(false)
  }

  const handleCreate = async () => {
    if (!wabaId || !accessToken) return toast.error("WABA ID et Token requis")
    if (!form.name || !form.bodyText) return toast.error("Nom et corps requis")

    const cleanName = form.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    setCreating(true)
    setCreateResult(null)

    const components = []
    if (form.headerText.trim()) components.push({ type: 'HEADER', format: 'TEXT', text: form.headerText })

    const bodyComponent = { type: 'BODY', text: form.bodyText }
    const vars = form.bodyText.match(/\{\{\d+\}\}/g)
    if (vars) {
      bodyComponent.example = { body_text: [vars.map((_, i) => `exemple_${i + 1}`)] }
    }
    components.push(bodyComponent)

    if (form.footerText.trim()) components.push({ type: 'FOOTER', text: form.footerText })
    if (form.buttonText.trim()) components.push({ type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: form.buttonText }] })

    try {
      const res = await fetch(`${GRAPH_API}/${wabaId}/message_templates`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, category: form.category, language: form.language, components }),
      })
      const data = await res.json()

      if (res.ok && data.id) {
        setCreateResult({ success: true, id: data.id, status: data.status, name: cleanName })
        toast.success('Template créé !')
        fetchTemplates()
      } else {
        setCreateResult({ success: false, error: data.error?.message || JSON.stringify(data) })
        toast.error(data.error?.message || 'Échec')
      }
    } catch (err) {
      setCreateResult({ success: false, error: err.message })
      toast.error(err.message)
    }
    setCreating(false)
  }

  const stColor = (s) => {
    if (s === 'APPROVED') return 'bg-emerald-500/10 text-emerald-600'
    if (s === 'PENDING') return 'bg-amber-500/10 text-amber-600'
    if (s === 'REJECTED') return 'bg-red-500/10 text-red-500'
    return 'bg-dark-400 text-dark-200'
  }

  return (
    <div>
      <div className="card p-4 mb-5 border-purple-500/20 bg-purple-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText size={14} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-0.5">Message Templates</p>
            <p className="text-xs text-dark-200 leading-relaxed">
              Créez des templates approuvés par Meta pour envoyer des messages en dehors de la fenêtre de 24h.
              Cette fonctionnalité utilise la permission <span className="font-mono text-brand-500">whatsapp_business_management</span>.
            </p>
          </div>
        </div>
      </div>

      {/* API Config */}
      <div className="card p-5 mb-5">
        <h3 className="text-sm font-semibold mb-4">Configuration API</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">WABA ID</label>
            <input className="input" value={wabaId} onChange={e => setWabaId(e.target.value)} placeholder="WhatsApp Business Account ID" />
          </div>
          <div>
            <label className="label">Access Token</label>
            <input className="input" type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Token Meta" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-primary flex items-center gap-2 text-[12px]" onClick={fetchTemplates} disabled={loadingTpl}>
            {loadingTpl ? <><Loader2 size={14} className="animate-spin" /> Chargement...</> : <><RefreshCw size={14} /> Charger templates</>}
          </button>
          <button className="btn-ghost flex items-center gap-2 text-[12px]" onClick={() => { setShowCreate(!showCreate); setCreateResult(null) }}>
            <Plus size={14} /> {showCreate ? 'Annuler' : 'Créer un template'}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 mb-5 border-brand-500/20">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Plus size={15} className="text-brand-500" /> Nouveau template
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label">Nom *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="cerberus_welcome" />
              <p className="text-[10px] text-dark-200 mt-1">Minuscules et underscores</p>
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {TEMPLATE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Langue</label>
              <select className="input" value={form.language} onChange={e => set('language', e.target.value)}>
                {TEMPLATE_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">En-tête (optionnel)</label>
              <input className="input" value={form.headerText} onChange={e => set('headerText', e.target.value)} placeholder="Nouvelles propriétés !" />
            </div>
            <div>
              <label className="label">Corps du message *</label>
              <textarea className="input min-h-[120px] resize-y" value={form.bodyText} onChange={e => set('bodyText', e.target.value)} />
              <p className="text-[10px] text-dark-200 mt-1">Variables: {'{{1}}'}, {'{{2}}'} — {form.bodyText.length} car.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Pied de page</label>
                <input className="input" value={form.footerText} onChange={e => set('footerText', e.target.value)} placeholder="Cerberus AI" />
              </div>
              <div>
                <label className="label">Bouton Quick Reply</label>
                <input className="input" value={form.buttonText} onChange={e => set('buttonText', e.target.value)} placeholder="En savoir plus" />
              </div>
            </div>
          </div>

          {/* WhatsApp Preview */}
          <div className="mt-5 p-4 rounded-xl bg-dark-800 border border-dark-400/60">
            <p className="text-[10px] text-dark-200 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5"><Eye size={11} /> Aperçu WhatsApp</p>
            <div className="rounded-lg p-4 max-w-sm" style={{ background: '#e5ddd5' }}>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                {form.headerText && <p className="text-sm font-bold text-gray-900 mb-1">{form.headerText}</p>}
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{form.bodyText || 'Corps...'}</p>
                {form.footerText && <p className="text-[11px] text-gray-400 mt-2">{form.footerText}</p>}
                <p className="text-[10px] text-gray-400 text-right mt-1">14:32 ✓✓</p>
              </div>
              {form.buttonText && (
                <div className="bg-white rounded-lg p-2 mt-1 shadow-sm text-center">
                  <span className="text-sm text-blue-500 font-medium">{form.buttonText}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button className="btn-primary flex items-center gap-2" onClick={handleCreate} disabled={creating}>
              {creating ? <><Loader2 size={14} className="animate-spin" /> Création...</> : <><Send size={14} /> Créer le template</>}
            </button>
          </div>

          {createResult && (
            <div className={`mt-4 p-4 rounded-xl border text-sm ${createResult.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              {createResult.success ? (
                <div>
                  <div className="flex items-center gap-2 font-semibold text-emerald-600 mb-2"><CheckCircle2 size={16} /> Template créé !</div>
                  <div className="text-xs text-dark-200 space-y-1">
                    <div>Nom: <span className="font-mono bg-dark-500 px-2 py-0.5 rounded">{createResult.name}</span></div>
                    <div>ID: <span className="font-mono bg-dark-500 px-2 py-0.5 rounded">{createResult.id}</span></div>
                    <div>Statut: <span className={`badge ${stColor(createResult.status)}`}>{createResult.status}</span></div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 font-semibold text-red-500 mb-2"><AlertCircle size={16} /> Erreur</div>
                  <div className="text-xs font-mono bg-dark-500 p-3 rounded-lg overflow-x-auto text-dark-200">{createResult.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Templates list */}
      {templates.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-dark-400/60">
            <h3 className="text-sm font-semibold">{templates.length} template{templates.length > 1 ? 's' : ''}</h3>
          </div>
          <div className="divide-y divide-dark-400/60">
            {templates.map(t => (
              <div key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-dark-500/30 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className={`badge text-[10px] ${stColor(t.status)}`}>{t.status}</span>
                    <span className="text-[10px] text-dark-200 bg-dark-500 px-2 py-0.5 rounded">{t.category}</span>
                  </div>
                  <p className="text-xs text-dark-200 mt-1 truncate">
                    {t.components?.find(c => c.type === 'BODY')?.text || '—'}
                  </p>
                </div>
                <span className="text-[10px] text-dark-300 flex-shrink-0">{t.language}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function WhatsAppNumbersPage() {
  const { tenant, agents } = useTenant()
  const [numbers, setNumbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [tab, setTab] = useState('numbers')

  const loadNumbers = useCallback(async () => {
    if (!tenant) return
    setLoading(true)
    const { data, error } = await supabase
      .from('whatsapp_numbers').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
    if (error) console.error(error)
    setNumbers(data || [])
    setLoading(false)
  }, [tenant])

  useEffect(() => { loadNumbers() }, [loadNumbers])

  const handleAdd = async (form) => {
    try {
      const { error } = await supabase.from('whatsapp_numbers').insert({
        tenant_id: tenant.id, phone_number_id: form.phone_number_id,
        display_phone_number: form.display_phone_number, label: form.label || 'Principal',
        waba_id: form.waba_id || null, access_token: form.access_token || null, is_active: true,
      })
      if (error) throw new Error(error.message)
      toast.success('Numéro ajouté !')
      loadNumbers()
    } catch (err) { toast.error(err.message) }
  }

  const handleToggle = async (num) => {
    const { error } = await supabase.from('whatsapp_numbers').update({ is_active: !num.is_active }).eq('id', num.id)
    if (error) return toast.error(error.message)
    toast.success(num.is_active ? 'Désactivé' : 'Activé')
    loadNumbers()
  }

  const handleDelete = async (num) => {
    if (!confirm(`Supprimer ${num.display_phone_number} ?`)) return
    setDeleting(num.id)
    const { error } = await supabase.from('whatsapp_numbers').delete().eq('id', num.id)
    if (error) toast.error(error.message)
    else { toast.success('Supprimé'); loadNumbers() }
    setDeleting(null)
  }

  const handleEmbeddedSignup = async () => {
    toast('Lancement...', { icon: '📱' })
    try {
      await launchEmbeddedSignup((auth) => { console.log('FB Auth:', auth); toast.success('Connexion initiée !') })
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div>
      <h1 className="page-title">WhatsApp Business</h1>
      <p className="page-sub">Gérez vos numéros, envoyez des messages et créez des templates</p>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Tab active={tab === 'numbers'} icon={Phone} label="Numéros" count={numbers.length} onClick={() => setTab('numbers')} />
        <Tab active={tab === 'send'} icon={Send} label="Envoyer un message" onClick={() => setTab('send')} />
        <Tab active={tab === 'templates'} icon={FileText} label="Templates" onClick={() => setTab('templates')} />
      </div>

      {tab === 'numbers' && (
        <NumbersTab numbers={numbers} agents={agents} loading={loading} onAdd={handleAdd}
          onDelete={handleDelete} onToggle={handleToggle} deleting={deleting} onEmbeddedSignup={handleEmbeddedSignup} />
      )}
      {tab === 'send' && <SendTestTab numbers={numbers} />}
      {tab === 'templates' && <TemplatesTab numbers={numbers} />}
    </div>
  )
}
