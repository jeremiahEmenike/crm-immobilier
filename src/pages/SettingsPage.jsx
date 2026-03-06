import { useState } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { Shield, Database, Zap, Save, Pencil } from 'lucide-react'
import { fmtDate } from '../lib/constants'
import toast from 'react-hot-toast'

export default function SettingsPage({ data }) {
  const { tenant, logout, authUser } = useTenant()
  const { properties, leads, visits, faqs } = data

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: tenant?.name || '', email: tenant?.email || '', city: tenant?.city || '' })
  const [saving, setSaving] = useState(false)

  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)

  const set = (k, v) => setForm({ ...form, [k]: v })

  const handleSave = async () => {
    if (!form.name) return toast.error("Le nom de l'agence est requis")
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ name: form.name, city: form.city || null, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)

      if (error) throw new Error(error.message)

      // Update local state
      tenant.name = form.name
      tenant.city = form.city

      toast.success('Paramètres mis à jour')
      setEditing(false)
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (!pwForm.password || pwForm.password.length < 6) return toast.error('Le mot de passe doit faire au moins 6 caractères')
    if (pwForm.password !== pwForm.confirm) return toast.error('Les mots de passe ne correspondent pas')
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.password })
      if (error) throw new Error(error.message)
      toast.success('Mot de passe mis à jour')
      setPwForm({ password: '', confirm: '' })
    } catch (err) {
      toast.error(err.message)
    }
    setPwSaving(false)
  }

  return (
    <div>
      <h1 className="page-title">Paramètres</h1>
      <p className="page-sub">Configuration de votre agence</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Agency Info */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield size={16} className="text-brand-500" /> Informations agence
            </h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-sm flex items-center gap-1.5">
                <Pencil size={12} /> Modifier
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="label">Nom de l'agence *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Eko Immo" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input opacity-50 cursor-not-allowed" value={form.email} disabled />
                <p className="text-[10px] text-dark-200 mt-1">L'email ne peut pas être modifié ici</p>
              </div>
              <div>
                <label className="label">Ville</label>
                <input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lomé" />
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
                <button className="btn-ghost" onClick={() => { setEditing(false); setForm({ name: tenant?.name || '', email: tenant?.email || '', city: tenant?.city || '' }) }}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="label">Nom de l'agence</div>
                <div className="text-base font-semibold">{tenant.name}</div>
              </div>
              <div>
                <div className="label">Email</div>
                <div className="text-sm text-dark-100">{tenant.email}</div>
              </div>
              <div>
                <div className="label">Ville</div>
                <div className="text-sm text-dark-100">{tenant.city || '—'}</div>
              </div>
              <div>
                <div className="label">Inscrit le</div>
                <div className="text-sm text-dark-100">{fmtDate(tenant.created_at)}</div>
              </div>
              <div>
                <div className="label">Tenant ID</div>
                <div className="text-xs text-dark-200 font-mono bg-dark-500 px-3 py-1.5 rounded-lg break-all">{tenant.id}</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Change Password */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              🔒 Changer le mot de passe
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label">Nouveau mot de passe</label>
                <input className="input" type="password" value={pwForm.password} onChange={e => setPwForm({ ...pwForm, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Confirmer</label>
                <input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handlePasswordChange()} />
              </div>
              {pwForm.password && pwForm.confirm && pwForm.password !== pwForm.confirm && (
                <p className="text-[11px] text-red-400">Les mots de passe ne correspondent pas</p>
              )}
              <button className="btn-primary mt-1" onClick={handlePasswordChange} disabled={pwSaving || !pwForm.password}>
                {pwSaving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </div>
          </div>

          {/* Supabase Status */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Database size={16} className="text-emerald-400" /> Supabase
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-400 font-medium">Connecté</span>
            </div>
            <div className="text-xs text-dark-200 font-mono bg-dark-500 px-3 py-2 rounded-lg break-all">
              {import.meta.env.VITE_SUPABASE_URL}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-dark-500 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-brand-500">{properties.length}</div>
                <div className="text-[10px] text-dark-200 uppercase tracking-wider">Biens</div>
              </div>
              <div className="bg-dark-500 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{leads.length}</div>
                <div className="text-[10px] text-dark-200 uppercase tracking-wider">Leads</div>
              </div>
              <div className="bg-dark-500 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-amber-400">{visits.length}</div>
                <div className="text-[10px] text-dark-200 uppercase tracking-wider">Visites</div>
              </div>
              <div className="bg-dark-500 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-400">{faqs.length}</div>
                <div className="text-[10px] text-dark-200 uppercase tracking-wider">FAQs</div>
              </div>
            </div>
          </div>

          {/* Bot info */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap size={16} className="text-brand-500" /> Bot WhatsApp
            </h3>
            <p className="text-xs text-dark-100 leading-relaxed mb-3">
              Le bot lit vos biens, descriptions et FAQs depuis Supabase et génère automatiquement les embeddings pour le property matching et les réponses FAQ.
            </p>
            <div className="text-[11px] text-dark-200">Embeddings générés pour :</div>
            <ul className="text-[11px] text-dark-100 mt-1 space-y-0.5">
              <li>• Biens (titre + description + caractéristiques + zone)</li>
              <li>• FAQs (catégorie + question + réponse)</li>
              <li>• Descriptions (incluses dans l'embedding du bien)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button className="btn-danger" onClick={logout}>Se déconnecter</button>
      </div>
    </div>
  )
}
