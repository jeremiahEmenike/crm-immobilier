import { useState, useEffect } from 'react'
import { Building2, Search, Plus, MapPin, RotateCcw } from 'lucide-react'
import { Modal, Field, Badge, EmptyState, ActionButtons } from '../components/UI'
import { MediaUpload } from '../components/MediaUpload'
import { useCRUD, useTenant } from '../hooks/useData'
import { useFormDraft } from '../hooks/useFormDraft'
import { PROPERTY_TYPES, TRANSACTION_TYPES, PROPERTY_STATUSES, label, fmtPrice } from '../lib/constants'
import toast from 'react-hot-toast'

const BLANK = {
  title: '', description: '', price: '', zone: '', property_type: 'Appartement',
  transaction_type: 'sale', surface: '', rooms: '', bathrooms: '', features: '',
  status: 'available', media: [], reference: '', owner_contact: '',
}

export default function PropertiesPage({ data, refresh }) {
  const { properties } = data
  const { create, update, remove } = useCRUD('properties')
  const { tenant } = useTenant()
  const { form, setForm, setField, modalState, setModalState, clearDraft, hasDraft } = useFormDraft('property', BLANK)
  const [modal, setModalRaw] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  // Restore draft on mount
  useEffect(() => {
    if (hasDraft) {
      setModalRaw(modalState)
      toast('Brouillon restauré — vous pouvez continuer', { icon: '📝' })
    }
  }, [])

  const setModal = (state) => {
    setModalRaw(state)
    setModalState(state)
  }

  const set = (k, v) => setField(k, v)

  const openAdd = () => { setForm({ ...BLANK }); setModal('add') }
  const openEdit = (p) => {
    const mediaFiles = (p.images || []).map((url, i) => ({
      id: `existing_${i}`,
      url: typeof url === 'string' ? url : url.url,
      name: `Photo ${i + 1}`,
      type: 'image/jpeg',
    }))
    setForm({
      ...p,
      features: Array.isArray(p.features) ? p.features.join(', ') : (p.features || ''),
      media: mediaFiles,
      owner_contact: typeof p.owner_contact === 'object' ? JSON.stringify(p.owner_contact) : (p.owner_contact || ''),
    })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.title || !form.price || !form.transaction_type) {
      return toast.error('Titre, prix et type de transaction requis')
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        price: parseFloat(form.price),
        zone: form.zone || null,
        property_type: form.property_type || null,
        transaction_type: form.transaction_type,
        surface: form.surface ? parseFloat(form.surface) : null,
        rooms: form.rooms ? parseInt(form.rooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        features: form.features ? form.features.split(',').map(x => x.trim()).filter(Boolean) : null,
        status: form.status,
        images: (form.media || []).map(m => m.url),
        reference: form.reference || null,
        owner_contact: form.owner_contact ? (() => { try { return JSON.parse(form.owner_contact) } catch { return { phone: form.owner_contact } } })() : null,
      }

      if (modal === 'add') {
        await create(payload)
        toast.success('Bien ajouté avec succès')
      } else {
        await update(form.id, payload)
        toast.success('Bien mis à jour')
      }
      await refresh()
      clearDraft()
      setModalRaw(null)
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce bien ?')) return
    setSaving(true)
    try {
      await remove(form.id)
      toast.success('Bien supprimé')
      await refresh()
      clearDraft()
      setModalRaw(null)
    } catch (err) { toast.error(err.message) }
    setSaving(false)
  }

  const list = properties.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !`${p.title} ${p.zone} ${p.property_type}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="page-title">Gestion des biens</h1>
          <p className="page-sub">{properties.length} bien(s) dans votre catalogue</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
          <Plus size={16} /> Ajouter un bien
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-[280px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200" />
          <input className="input pl-9" placeholder="Rechercher un bien..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <EmptyState icon={Building2} title="Aucun bien trouvé" description="Ajoutez votre premier bien pour commencer" action={<button className="btn-primary mt-3" onClick={openAdd}>+ Ajouter un bien</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(p => (
            <div key={p.id} className="card p-0 overflow-hidden cursor-pointer hover:border-dark-300 transition-colors group" onClick={() => openEdit(p)}>
              {/* Image */}
              <div className="h-[140px] bg-dark-500 overflow-hidden relative">
                {p.images?.length > 0 ? (
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={28} className="text-dark-300" />
                  </div>
                )}
                {p.images?.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    +{p.images.length - 1} photos
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge status={p.status} />
                  <span className="text-[11px] text-dark-200">{label(p.transaction_type)} · {p.property_type}</span>
                </div>
                <h3 className="font-semibold text-sm truncate mb-1">{p.title}</h3>
                <div className="flex items-center gap-1 text-dark-100 text-xs mb-3">
                  <MapPin size={12} />
                  {p.zone || '—'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-brand-500 font-display">{fmtPrice(p.price)}</span>
                  <span className="text-[11px] text-dark-200">
                    {p.surface ? `${p.surface}m²` : ''}{p.rooms ? ` · ${p.rooms}p` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Nouveau bien' : 'Modifier le bien'} onClose={() => { clearDraft(); setModalRaw(null) }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Field label="Titre" required><input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Villa Cocotier" /></Field>
            <Field label="Type de bien"><select className="input" value={form.property_type || ''} onChange={e => set('property_type', e.target.value)}>{PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Transaction" required><select className="input" value={form.transaction_type} onChange={e => set('transaction_type', e.target.value)}>{TRANSACTION_TYPES.map(t => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
            <Field label="Prix (FCFA)" required><input className="input" type="number" value={form.price} onChange={e => set('price', e.target.value)} /></Field>
            <Field label="Surface (m²)"><input className="input" type="number" value={form.surface || ''} onChange={e => set('surface', e.target.value)} /></Field>
            <Field label="Pièces"><input className="input" type="number" value={form.rooms || ''} onChange={e => set('rooms', e.target.value)} /></Field>
            <Field label="Salles de bain"><input className="input" type="number" value={form.bathrooms || ''} onChange={e => set('bathrooms', e.target.value)} /></Field>
            <Field label="Zone / Quartier"><input className="input" value={form.zone || ''} onChange={e => set('zone', e.target.value)} placeholder="Tokoin, Lomé" /></Field>
            <Field label="Référence"><input className="input" value={form.reference || ''} onChange={e => set('reference', e.target.value)} placeholder="REF-001" /></Field>
            <Field label="Statut"><select className="input" value={form.status} onChange={e => set('status', e.target.value)}>{PROPERTY_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
          </div>
          <Field label="Contact propriétaire">
            <input className="input" value={form.owner_contact || ''} onChange={e => set('owner_contact', e.target.value)} placeholder="+225 07 XX XX XX XX / 05 XX XX XX XX" />
          </Field>
          <Field label="Caractéristiques (séparées par des virgules)">
            <input className="input" value={form.features || ''} onChange={e => set('features', e.target.value)} placeholder="piscine, garage, jardin, climatisation" />
          </Field>
          <Field label="Description">
            <textarea className="input min-h-[90px] resize-y" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Description détaillée du bien..." />
          </Field>
          <Field label="Photos & Vidéos">
            <MediaUpload
              files={form.media || []}
              onChange={(media) => set('media', media)}
              max={10}
              tenantId={tenant?.id}
            />
          </Field>

          {modal === 'edit' && (
            <div className="bg-dark-500 rounded-lg px-3 py-2 text-[11px] text-dark-200 mb-2">
              ID: <span className="font-mono">{form.id}</span>
            </div>
          )}

          <ActionButtons onSave={handleSave} onDelete={handleDelete} onCancel={() => { clearDraft(); setModalRaw(null) }} saving={saving} isEdit={modal === 'edit'} />
        </Modal>
      )}
    </div>
  )
}
