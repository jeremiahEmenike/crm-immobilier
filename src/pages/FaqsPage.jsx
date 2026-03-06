import { useState, useEffect } from 'react'
import { MessageCircleQuestion, Plus, Bot } from 'lucide-react'
import { Modal, Field, EmptyState, ActionButtons, Toggle } from '../components/UI'
import { DocumentUpload } from '../components/MediaUpload'
import { useCRUD, useTenant } from '../hooks/useData'
import { useFormDraft } from '../hooks/useFormDraft'
import { FAQ_CATEGORIES } from '../lib/constants'
import toast from 'react-hot-toast'

const BLANK = { question: '', answer: '', category: 'Général', active: true, documents: [] }

export default function FaqsPage({ data, refresh }) {
  const { faqs } = data
  const { create, update, remove } = useCRUD('faqs')
  const { tenant } = useTenant()
  const { form, setForm, setField, modalState, setModalState, clearDraft, hasDraft } = useFormDraft('faq', BLANK)
  const [modal, setModalRaw] = useState(null)
  const [saving, setSaving] = useState(false)
  const [catFilter, setCatFilter] = useState('Toutes')

  useEffect(() => {
    if (hasDraft) { setModalRaw(modalState); toast('Brouillon restauré', { icon: '📝' }) }
  }, [])

  const setModal = (s) => { setModalRaw(s); setModalState(s) }
  const close = () => { clearDraft(); setModalRaw(null) }
  const set = (k, v) => setField(k, v)

  const handleSave = async () => {
    if (!form.question || !form.answer) return toast.error('Question et réponse requises')
    setSaving(true)
    try {
      const payload = { question: form.question, answer: form.answer, category: form.category, active: form.active, documents: form.documents || [] }
      if (modal === 'add') { await create(payload); toast.success('FAQ ajoutée') }
      else { await update(form.id, payload); toast.success('FAQ mise à jour') }
      await refresh(); clearDraft(); setModalRaw(null)
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette FAQ ?')) return
    setSaving(true)
    try { await remove(form.id); toast.success('Supprimée'); await refresh(); clearDraft(); setModalRaw(null) }
    catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const toggleActive = async (faq, e) => {
    e?.stopPropagation()
    try {
      await update(faq.id, { active: !faq.active })
      await refresh()
    } catch (err) { toast.error(err.message) }
  }

  const list = faqs.filter(fq => catFilter === 'Toutes' || fq.category === catFilter)
  const catCounts = FAQ_CATEGORIES.reduce((a, c) => { a[c] = faqs.filter(f => f.category === c).length; return a }, {})

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="page-title">Gestion des FAQs</h1>
          <p className="page-sub">{faqs.length} FAQ(s) · {faqs.filter(f => f.active).length} active(s) — Embeddings générés automatiquement par le bot</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setForm({ ...BLANK }); setModal('add') }}>
          <Plus size={16} /> Ajouter une FAQ
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setCatFilter('Toutes')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${catFilter === 'Toutes' ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30' : 'bg-dark-500 text-dark-100 border border-dark-400 hover:border-dark-300'}`}>
          Toutes ({faqs.length})
        </button>
        {FAQ_CATEGORIES.filter(c => catCounts[c] > 0).map(c => (
          <button key={c} onClick={() => setCatFilter(catFilter === c ? 'Toutes' : c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${catFilter === c ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-dark-500 text-dark-100 border border-dark-400 hover:border-dark-300'}`}>
            {c} ({catCounts[c]})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={MessageCircleQuestion} title="Aucune FAQ" description="Ajoutez des FAQs pour que le bot puisse répondre automatiquement" />
      ) : (
        <div className="space-y-3">
          {list.map(fq => (
            <div
              key={fq.id}
              className={`card flex gap-5 items-start cursor-pointer hover:border-dark-300 transition-all ${!fq.active ? 'opacity-50' : ''}`}
              onClick={() => { setForm({ ...fq, documents: fq.documents || [] }); setModal('edit') }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="badge bg-purple-500/15 text-purple-400">{fq.category}</span>
                  {!fq.active && <span className="badge bg-dark-200/15 text-dark-200">Désactivée</span>}
                  {fq.documents?.length > 0 && <span className="badge bg-blue-500/15 text-blue-400">{fq.documents.length} doc(s)</span>}
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{fq.question}</h3>
                <p className="text-dark-100 text-[13px] leading-relaxed">
                  {fq.answer.length > 200 ? fq.answer.slice(0, 200) + '...' : fq.answer}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-1" onClick={e => e.stopPropagation()}>
                <Toggle on={fq.active} onToggle={(e) => toggleActive(fq, e)} />
                <span className="text-[10px] text-dark-200">{fq.active ? 'Active' : 'Off'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nouvelle FAQ' : 'Modifier la FAQ'} onClose={close}>
          <Field label="Catégorie"><select className="input" value={form.category} onChange={e => set('category', e.target.value)}>{FAQ_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Question" required><textarea className="input min-h-[60px] resize-y" value={form.question} onChange={e => set('question', e.target.value)} placeholder="Ex: Quels documents faut-il pour louer ?" /></Field>
          <Field label="Réponse" required><textarea className="input min-h-[120px] resize-y" value={form.answer} onChange={e => set('answer', e.target.value)} placeholder="La réponse complète que le bot utilisera..." /></Field>

          <div className="flex items-center gap-3 mb-4">
            <Toggle on={form.active} onToggle={() => set('active', !form.active)} />
            <span className="text-sm text-dark-100">FAQ active — visible par le bot WhatsApp</span>
          </div>

          <Field label="Documents joints">
            <DocumentUpload
              files={form.documents || []}
              onChange={(docs) => set('documents', docs)}
              max={5}
              tenantId={tenant?.id}
            />
          </Field>

          <div className="bg-dark-500 rounded-lg p-3.5 mb-4 flex gap-3 items-start">
            <Bot size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-dark-50 font-medium mb-1">Embedding automatique</p>
              <p className="text-[11px] text-dark-200 leading-relaxed">Le bot génère un embedding vectoriel de cette FAQ pour matcher les questions similaires des prospects sur WhatsApp.</p>
            </div>
          </div>

          <ActionButtons onSave={handleSave} onDelete={handleDelete} onCancel={close} saving={saving} isEdit={modal === 'edit'} />
        </Modal>
      )}
    </div>
  )
}
