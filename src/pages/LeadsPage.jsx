import { useState, useEffect } from 'react'
import { Users, Search, Plus } from 'lucide-react'
import { Modal, Field, Badge, EmptyState, ActionButtons } from '../components/UI'
import { useCRUD } from '../hooks/useData'
import { useFormDraft } from '../hooks/useFormDraft'
import { PIPELINE_STAGES, label, fmtPrice, fmtDate } from '../lib/constants'
import toast from 'react-hot-toast'

const BLANK = { name: '', phone: '', property_type: '', zone: '', budget_max: '', pipeline_stage: 'New', rooms: '', intent: '', timeline: '', last_ai_summary: '' }

export default function LeadsPage({ data, refresh }) {
  const { leads } = data
  const { create, update, remove } = useCRUD('leads')
  const { form, setForm, setField, modalState, setModalState, clearDraft, hasDraft } = useFormDraft('lead', BLANK)
  const [modal, setModalRaw] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')

  useEffect(() => {
    if (hasDraft) { setModalRaw(modalState); toast('Brouillon restauré', { icon: '📝' }) }
  }, [])

  const setModal = (s) => { setModalRaw(s); setModalState(s) }
  const close = () => { clearDraft(); setModalRaw(null) }
  const set = (k, v) => setField(k, v)

  const handleSave = async () => {
    if (!form.phone) return toast.error('Téléphone requis')
    setSaving(true)
    try {
      const payload = {
        name: form.name || null, phone: form.phone, property_type: form.property_type || null,
        zone: form.zone || null, budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
        pipeline_stage: form.pipeline_stage, rooms: form.rooms ? parseInt(form.rooms) : null,
        intent: form.intent || null, timeline: form.timeline || null, last_ai_summary: form.last_ai_summary || null,
      }
      if (modal === 'add') { await create(payload); toast.success('Lead ajouté') }
      else { await update(form.id, payload); toast.success('Lead mis à jour') }
      await refresh(); clearDraft(); setModalRaw(null)
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce lead ?')) return
    setSaving(true)
    try { await remove(form.id); toast.success('Supprimé'); await refresh(); clearDraft(); setModalRaw(null) }
    catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const list = leads.filter(l => {
    if (stageFilter !== 'all' && l.pipeline_stage !== stageFilter) return false
    if (search && !`${l.name} ${l.phone}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stageCounts = PIPELINE_STAGES.reduce((a, s) => { a[s] = leads.filter(l => l.pipeline_stage === s).length; return a }, {})

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div><h1 className="page-title">Gestion des leads</h1><p className="page-sub">{leads.length} lead(s) dans le pipeline</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setForm({ ...BLANK }); setModal('add') }}><Plus size={16} /> Ajouter un lead</button>
      </div>

      {/* Pipeline pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setStageFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${stageFilter === 'all' ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30' : 'bg-dark-500 text-dark-100 border border-dark-400 hover:border-dark-300'}`}>
          Tous ({leads.length})
        </button>
        {PIPELINE_STAGES.filter(s => stageCounts[s] > 0).map(s => (
          <button key={s} onClick={() => setStageFilter(stageFilter === s ? 'all' : s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${stageFilter === s ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30' : 'bg-dark-500 text-dark-100 border border-dark-400 hover:border-dark-300'}`}>
            {label(s)} ({stageCounts[s]})
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-[300px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200" />
          <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {list.length === 0 ? <EmptyState icon={Users} title="Aucun lead" /> : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead><tr>{['Nom', 'Téléphone', 'Zone', 'Budget', 'Recherche', 'Stage', 'Score', 'Date', ''].map((h, i) => <th key={i} className="table-head">{h}</th>)}</tr></thead>
            <tbody>
              {list.map(l => (
                <tr key={l.id} className="hover:bg-dark-500/30 cursor-pointer transition-colors" onClick={() => { setForm({ ...l }); setModal('edit') }}>
                  <td className="table-cell-main">{l.name || '—'}</td>
                  <td className="table-cell">{l.phone}</td>
                  <td className="table-cell">{l.zone || '—'}</td>
                  <td className="table-cell text-brand-500">{l.budget_max ? fmtPrice(l.budget_max) : '—'}</td>
                  <td className="table-cell">{l.property_type || '—'}</td>
                  <td className="table-cell"><Badge status={l.pipeline_stage} /></td>
                  <td className="table-cell font-semibold">{l.score ?? 0}</td>
                  <td className="table-cell text-dark-200 text-xs">{fmtDate(l.created_at)}</td>
                  <td className="table-cell"><button className="btn-sm">Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nouveau lead' : 'Modifier le lead'} onClose={close}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Nom"><input className="input" value={form.name || ''} onChange={e => set('name', e.target.value)} /></Field>
            <Field label="Téléphone" required><input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+228 90 XX" /></Field>
            <Field label="Type recherché"><input className="input" value={form.property_type || ''} onChange={e => set('property_type', e.target.value)} placeholder="Villa, Appartement..." /></Field>
            <Field label="Zone"><input className="input" value={form.zone || ''} onChange={e => set('zone', e.target.value)} /></Field>
            <Field label="Budget max (FCFA)"><input className="input" type="number" value={form.budget_max || ''} onChange={e => set('budget_max', e.target.value)} /></Field>
            <Field label="Pièces"><input className="input" type="number" value={form.rooms || ''} onChange={e => set('rooms', e.target.value)} /></Field>
            <Field label="Intent"><input className="input" value={form.intent || ''} onChange={e => set('intent', e.target.value)} placeholder="achat, location..." /></Field>
            <Field label="Timeline"><input className="input" value={form.timeline || ''} onChange={e => set('timeline', e.target.value)} placeholder="immédiat, 3 mois..." /></Field>
          </div>
          <Field label="Pipeline stage"><select className="input" value={form.pipeline_stage} onChange={e => set('pipeline_stage', e.target.value)}>{PIPELINE_STAGES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
          <Field label="Notes / Résumé IA"><textarea className="input min-h-[80px] resize-y" value={form.last_ai_summary || ''} onChange={e => set('last_ai_summary', e.target.value)} /></Field>
          <ActionButtons onSave={handleSave} onDelete={handleDelete} onCancel={close} saving={saving} isEdit={modal === 'edit'} />
        </Modal>
      )}
    </div>
  )
}
