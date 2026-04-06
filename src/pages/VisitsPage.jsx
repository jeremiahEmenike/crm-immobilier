import { useState, useEffect } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Modal, Field, Badge, EmptyState, ActionButtons } from '../components/UI'
import { useCRUD } from '../hooks/useData'
import { useFormDraft } from '../hooks/useFormDraft'
import { VISIT_STATUSES, label, fmtDate, fmtTime } from '../lib/constants'
import toast from 'react-hot-toast'

const BLANK = { lead_id: '', property_id: '', scheduled_at: '', status: 'scheduled' }

export default function VisitsPage({ data, refresh }) {
  const { visits, leads, properties } = data
  const { create, update, remove } = useCRUD('visits')
  const { form, setForm, setField, modalState, setModalState, clearDraft, hasDraft } = useFormDraft('visit', BLANK)
  const [modal, setModalRaw] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (hasDraft) { setModalRaw(modalState); toast('Brouillon restauré', { icon: '📝' }) }
  }, [])

  const setModal = (s) => { setModalRaw(s); setModalState(s) }
  const close = () => { clearDraft(); setModalRaw(null) }
  const set = (k, v) => setField(k, v)

  const handleSave = async () => {
    if (!form.scheduled_at) return toast.error('Date requise')
    setSaving(true)
    try {
      const payload = { lead_id: form.lead_id || null, property_id: form.property_id || null, scheduled_at: form.scheduled_at, status: form.status }
      if (modal === 'add') { await create(payload); toast.success('Visite planifiée') }
      else { await update(form.id, payload); toast.success('Visite mise à jour') }
      await refresh(); clearDraft(); setModalRaw(null)
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ?')) return
    setSaving(true)
    try { await remove(form.id); toast.success('Supprimé'); await refresh(); clearDraft(); setModalRaw(null) }
    catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div><h1 className="page-title">Visites & RDV</h1><p className="page-sub">{visits.length} visite(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setForm({ ...BLANK }); setModal('add') }}>
          <Plus size={16} /> Planifier
        </button>
      </div>

      {visits.length === 0 ? <EmptyState icon={CalendarDays} title="Aucune visite planifiée" description="Planifiez une visite pour un lead" /> : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead><tr>{['Date', 'Heure', 'Lead', 'Bien', 'Statut', ''].map((h, i) => <th key={i} className="table-head">{h}</th>)}</tr></thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id} className="hover:bg-dark-500/30 cursor-pointer transition-colors" onClick={() => { setForm({ ...v, scheduled_at: v.scheduled_at?.slice(0, 16) || '' }); setModal('edit') }}>
                  <td className="table-cell-main">{fmtDate(v.scheduled_at)}</td>
                  <td className="table-cell">{fmtTime(v.scheduled_at)}</td>
                  <td className="table-cell">{leads.find(l => l.id === v.lead_id)?.name || '—'}</td>
                  <td className="table-cell">{properties.find(p => p.id === v.property_id)?.title || '—'}</td>
                  <td className="table-cell"><Badge status={v.status} /></td>
                  <td className="table-cell"><button className="btn-sm">Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Planifier une visite' : 'Modifier'} onClose={close}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Date et heure" required><input className="input" type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} /></Field>
            <Field label="Statut"><select className="input" value={form.status} onChange={e => set('status', e.target.value)}>{VISIT_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
            <Field label="Lead">
              <select className="input" value={form.lead_id || ''} onChange={e => set('lead_id', e.target.value || null)}>
                <option value="">— Sélectionner —</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
              </select>
            </Field>
            <Field label="Bien">
              <select className="input" value={form.property_id || ''} onChange={e => set('property_id', e.target.value || null)}>
                <option value="">— Sélectionner —</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>
          </div>
          <ActionButtons onSave={handleSave} onDelete={handleDelete} onCancel={close} saving={saving} isEdit={modal === 'edit'} />
        </Modal>
      )}
    </div>
  )
}
