import { useState } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { Shield, Database, Zap, Save, Pencil, User } from 'lucide-react'
import { fmtDate } from '../lib/constants'
import toast from 'react-hot-toast'

export default function SettingsPage({ data }) {
  const { tenant, logout, authUser, currentUser } = useTenant()
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
      const { error } = await supabase.from('tenants')
        .update({ name: form.name, city: form.city || null, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)
      if (error) throw new Error(error.message)
      tenant.name = form.name; tenant.city = form.city
      toast.success('Paramètres mis à jour'); setEditing(false)
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (!pwForm.password || pwForm.password.length < 6) return toast.error('Min 6 caractères')
    if (pwForm.password !== pwForm.confirm) return toast.error('Mots de passe différents')
    setPwSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.password })
      if (error) throw new Error(error.message)
      toast.success('Mot de passe mis à jour'); setPwForm({ password: '', confirm: '' })
    } catch (err) { toast.error(err.message) }
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
            <h3 className="text-sm font-semibold flex items-center gap-2"><Shield size={16} className="text-brand-500" /> Informations agence</h3>
            {!editing && <button onClick={() => setEditing(true)} className="btn-sm flex items-center gap-1.5"><Pencil size={12} /> Modifier</button>}
          </div>
          {editing ? (
            <div className="space-y-4">
              <div><label className="label">Nom de l'agence *</label><input className="input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input opacity-50 cursor-not-allowed" value={form.email} disabled /><p className="text-[10px] text-dark-200 mt-1">Non modifiable ici</p></div>
              <div><label className="label">Ville</label><input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lomé" /></div>
              <div className="flex gap-3 pt-2">
                <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : <><Save size={14} /> Enregistrer</>}</button>
                <button className="btn-ghost" onClick={() => { setEditing(false); setForm({ name: tenant?.name || '', email: tenant?.email || '', city: tenant?.city || '' }) }}>Annuler</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div><div className="label">Nom</div><div className="text-base font-semibold">{tenant.name}</div></div>
              <div><div className="label">Email</div><div className="text-sm text-dark-100">{tenant.email || '—'}</div></div>
              <div><div className="label">Ville</div><div className="text-sm text-dark-100">{tenant.city || '—'}</div></div>
              <div><div className="label">Inscrit le</div><div className="text-sm text-dark-100">{fmtDate(tenant.created_at)}</div></div>
              <div><div className="label">Tenant ID</div><div className="text-xs text-dark-200 font-mono bg-dark-500 px-3 py-1.5 rounded-lg break-all">{tenant.id}</div></div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Agent Profile */}
          {currentUser && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><User size={16} className="text-blue-400" /> Mon profil</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-dark-200 text-xs">Nom</span><span className="text-sm font-medium">{currentUser.name}</span></div>
                <div className="flex items-center justify-between"><span className="text-dark-200 text-xs">Rôle</span><span className={`badge ${currentUser.role === 'admin' ? 'bg-brand-500/15 text-brand-500' : 'bg-blue-500/15 text-blue-400'}`}>{currentUser.role}</span></div>
                {currentUser.phone && <div className="flex items-center justify-between"><span className="text-dark-200 text-xs">Téléphone</span><span className="text-sm text-dark-100">{currentUser.phone}</span></div>}
                {currentUser.email && <div className="flex items-center justify-between"><span className="text-dark-200 text-xs">Email</span><span className="text-sm text-dark-100">{currentUser.email}</span></div>}
              </div>
            </div>
          )}

          {/* Password */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4">🔒 Mot de passe</h3>
            <div className="space-y-3">
              <div><label className="label">Nouveau</label><input className="input" type="password" value={pwForm.password} onChange={e => setPwForm({ ...pwForm, password: e.target.value })} placeholder="••••••••" /></div>
              <div><label className="label">Confirmer</label><input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handlePasswordChange()} /></div>
              <button className="btn-primary mt-1" onClick={handlePasswordChange} disabled={pwSaving || !pwForm.password}>{pwSaving ? 'Mise à jour...' : 'Mettre à jour'}</button>
            </div>
          </div>

          {/* Stats */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Database size={16} className="text-emerald-400" /> Supabase</h3>
            <div className="flex items-center gap-2 mb-4"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-sm text-emerald-400 font-medium">Connecté</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-dark-500 rounded-lg p-3 text-center"><div className="text-lg font-bold text-brand-500">{properties.length}</div><div className="text-[10px] text-dark-200 uppercase tracking-wider">Biens</div></div>
              <div className="bg-dark-500 rounded-lg p-3 text-center"><div className="text-lg font-bold text-blue-400">{leads.length}</div><div className="text-[10px] text-dark-200 uppercase tracking-wider">Leads</div></div>
              <div className="bg-dark-500 rounded-lg p-3 text-center"><div className="text-lg font-bold text-amber-400">{visits.length}</div><div className="text-[10px] text-dark-200 uppercase tracking-wider">Visites</div></div>
              <div className="bg-dark-500 rounded-lg p-3 text-center"><div className="text-lg font-bold text-purple-400">{faqs.length}</div><div className="text-[10px] text-dark-200 uppercase tracking-wider">FAQs</div></div>
            </div>
          </div>

          {/* Bot */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap size={16} className="text-brand-500" /> Bot WhatsApp</h3>
            <p className="text-xs text-dark-100 leading-relaxed">Le bot lit vos biens, FAQs et disponibilités depuis Supabase pour qualifier les leads et proposer des visites.</p>
          </div>
        </div>
      </div>

      <div className="mt-8"><button className="btn-danger" onClick={logout}>Se déconnecter</button></div>
    </div>
  )
}
