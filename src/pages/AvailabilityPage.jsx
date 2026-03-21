import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { Clock, Plus, Trash2, Loader2, Copy, Check, Sparkles, RotateCcw, Bot } from 'lucide-react'
import { Modal, Field } from '../components/UI'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────
// ISODOW-1 convention (matches get_available_slots SQL function)
// 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
const DAYS = [
  { num: 0, short: 'Lun', full: 'Lundi' },
  { num: 1, short: 'Mar', full: 'Mardi' },
  { num: 2, short: 'Mer', full: 'Mercredi' },
  { num: 3, short: 'Jeu', full: 'Jeudi' },
  { num: 4, short: 'Ven', full: 'Vendredi' },
  { num: 5, short: 'Sam', full: 'Samedi' },
  { num: 6, short: 'Dim', full: 'Dimanche' },
]

// Convert JS getDay() (0=Sun) to ISODOW-1 (0=Mon)
const jsToIsodow = (jsDay) => (jsDay + 6) % 7

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7h → 19h

const fmtTime = (t) => t?.slice(0, 5) || ''
const timeToMinutes = (t) => {
  const [h, m] = fmtTime(t).split(':').map(Number)
  return h * 60 + (m || 0)
}
const minutesToTime = (m) => {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// ─── Color per slot (rotating soft palette) ──
const SLOT_COLORS = [
  { bg: 'bg-brand-500/20', border: 'border-brand-500/40', text: 'text-brand-400' },
  { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
]

// ─── Component ────────────────────────────
export default function AvailabilityPage() {
  const { tenant, currentUser } = useTenant()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null) // { day, start_time, end_time } or null
  const [form, setForm] = useState({ start_time: '09:00', end_time: '12:00' })
  const [copied, setCopied] = useState(null)
  const [hoveredDay, setHoveredDay] = useState(null)

  // ─── Load ──────────────────────────────
  const load = useCallback(async () => {
    if (!tenant || !currentUser) return
    setLoading(true)
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time')
    setSlots(data || [])
    setLoading(false)
  }, [tenant, currentUser])

  useEffect(() => { load() }, [load])

  const daySlots = (dayNum) => slots.filter(s => s.day_of_week === dayNum)
  const totalHours = useMemo(() => {
    let mins = 0
    slots.forEach(s => { mins += timeToMinutes(s.end_time) - timeToMinutes(s.start_time) })
    return (mins / 60).toFixed(1)
  }, [slots])

  // ─── Grid geometry ─────────────────────
  const GRID_START = 7 * 60  // 7:00
  const GRID_END = 20 * 60   // 20:00
  const GRID_RANGE = GRID_END - GRID_START

  const slotStyle = (slot) => {
    const start = Math.max(timeToMinutes(slot.start_time), GRID_START)
    const end = Math.min(timeToMinutes(slot.end_time), GRID_END)
    const top = ((start - GRID_START) / GRID_RANGE) * 100
    const height = ((end - start) / GRID_RANGE) * 100
    return { top: `${top}%`, height: `${Math.max(height, 2)}%` }
  }

  // ─── Add slot ──────────────────────────
  const openAdd = (dayNum) => {
    const existing = daySlots(dayNum)
    let start = '09:00', end = '12:00'
    if (existing.length > 0) {
      const last = existing[existing.length - 1]
      const lastEnd = fmtTime(last.end_time)
      start = lastEnd === '12:00' ? '14:00' : lastEnd
      const h = parseInt(start.split(':')[0])
      end = `${String(Math.min(h + 3, 20)).padStart(2, '0')}:00`
    }
    setForm({ start_time: start, end_time: end })
    setModal({ day: dayNum })
  }

  const saveSlot = async () => {
    if (form.start_time >= form.end_time) return toast.error('L\'heure de fin doit être après le début')
    setSaving(true)
    const { error } = await supabase.from('availability').insert({
      tenant_id: tenant.id,
      user_id: currentUser.id,
      day_of_week: modal.day,
      start_time: form.start_time,
      end_time: form.end_time,
      is_active: true,
    })
    if (error) {
      if (error.code === '23505') toast.error('Ce créneau existe déjà')
      else toast.error(error.message)
    } else {
      toast.success('Créneau ajouté')
    }
    setModal(null)
    await load()
    setSaving(false)
  }

  const removeSlot = async (id, e) => {
    e?.stopPropagation()
    setSaving(true)
    await supabase.from('availability').delete().eq('id', id)
    toast.success('Supprimé')
    await load()
    setSaving(false)
  }

  // ─── Copy day ──────────────────────────
  const startCopy = (dayNum, e) => {
    e?.stopPropagation()
    setCopied(dayNum)
    toast('Cliquez sur un jour cible', { icon: '📋', duration: 3000 })
  }

  const pasteDay = async (toDay) => {
    if (copied === null || copied === toDay) { setCopied(null); return }
    const source = daySlots(copied)
    if (!source.length) { toast.error('Rien à copier'); setCopied(null); return }

    setSaving(true)
    await supabase.from('availability').delete()
      .eq('tenant_id', tenant.id).eq('user_id', currentUser.id).eq('day_of_week', toDay)
    const inserts = source.map(s => ({
      tenant_id: tenant.id, user_id: currentUser.id,
      day_of_week: toDay, start_time: s.start_time, end_time: s.end_time, is_active: true,
    }))
    await supabase.from('availability').insert(inserts)
    toast.success(`Copié vers ${DAYS.find(d => d.num === toDay)?.full}`)
    setCopied(null)
    await load()
    setSaving(false)
  }

  // ─── Defaults ──────────────────────────
  const applyDefaults = async () => {
    if (!confirm('Appliquer les horaires standard (Lun-Ven 9h-12h / 14h-17h) ? Cela remplacera tous vos créneaux.')) return
    setSaving(true)
    await supabase.from('availability').delete()
      .eq('tenant_id', tenant.id).eq('user_id', currentUser.id)
    const inserts = []
    for (let d = 0; d <= 4; d++) {  // 0=Mon, 1=Tue, ..., 4=Fri
      inserts.push({ tenant_id: tenant.id, user_id: currentUser.id, day_of_week: d, start_time: '09:00', end_time: '12:00', is_active: true })
      inserts.push({ tenant_id: tenant.id, user_id: currentUser.id, day_of_week: d, start_time: '14:00', end_time: '17:00', is_active: true })
    }
    await supabase.from('availability').insert(inserts)
    toast.success('Horaires standard appliqués')
    await load()
    setSaving(false)
  }

  // ─── Bot preview ───────────────────────
  const botPreview = useMemo(() => {
    if (!slots.length) return null
    const today = new Date()
    const previews = []
    for (let i = 1; i <= 14 && previews.length < 3; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dow = jsToIsodow(d.getDay())
      const ds = daySlots(dow)
      if (ds.length > 0) {
        const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
        ds.forEach(s => {
          if (previews.length < 3) {
            previews.push(`${dayLabel} de ${fmtTime(s.start_time)} à ${fmtTime(s.end_time)}`)
          }
        })
      }
    }
    return previews
  }, [slots])

  // ─── Render ─────────────────────────────
  if (!currentUser) {
    return (
      <div>
        <h1 className="page-title">Disponibilités</h1>
        <p className="page-sub">Profil utilisateur non trouvé. Rechargez la page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={22} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="page-title">Disponibilités</h1>
          <p className="page-sub">
            Créneaux de visite de <span className="text-brand-500 font-medium">{currentUser.name}</span>
            {slots.length > 0 && (
              <span className="text-dark-200"> · {totalHours}h/semaine · {slots.length} créneau(x)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-sm flex items-center gap-1.5 text-[11px]" onClick={applyDefaults} disabled={saving}>
            <RotateCcw size={12} /> Standard
          </button>
        </div>
      </div>

      {/* Empty state */}
      {slots.length === 0 && (
        <div className="card p-8 text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-brand-500" />
          </div>
          <h3 className="text-base font-semibold mb-2">Aucune disponibilité configurée</h3>
          <p className="text-dark-200 text-sm max-w-sm mx-auto mb-5">
            Le bot Ama ne peut pas proposer de visites sans créneaux. Commencez par les horaires standard ou ajoutez manuellement.
          </p>
          <button className="btn-primary" onClick={applyDefaults}>
            <Sparkles size={14} className="inline mr-1.5 -mt-0.5" />
            Appliquer Lun-Ven 9h-17h
          </button>
        </div>
      )}

      {/* Copy banner */}
      {copied !== null && (
        <div className="mb-4 text-[12px] text-brand-500 bg-brand-500/10 border border-brand-500/20 px-4 py-2.5 rounded-xl flex items-center justify-between">
          <span>Cliquez sur un jour pour y coller les créneaux de <strong>{DAYS.find(d => d.num === copied)?.full}</strong></span>
          <button className="underline text-[11px]" onClick={() => setCopied(null)}>Annuler</button>
        </div>
      )}

      {/* ── Weekly Grid ────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="flex">
          {/* Time axis */}
          <div className="w-[52px] flex-shrink-0 border-r border-dark-400/60 pt-10">
            {HOURS.map(h => (
              <div key={h} className="h-[52px] flex items-start justify-end pr-2">
                <span className="text-[10px] text-dark-200 -mt-1.5 font-mono">{String(h).padStart(2, '0')}h</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7">
            {DAYS.map((day, di) => {
              const ds = daySlots(day.num)
              const isToday = jsToIsodow(new Date().getDay()) === day.num
              const isCopyTarget = copied !== null && copied !== day.num
              const colorIdx = di % SLOT_COLORS.length

              return (
                <div
                  key={day.num}
                  className={`border-r border-dark-400/30 last:border-r-0 transition-colors ${
                    isCopyTarget ? 'bg-brand-500/5 cursor-pointer' : ''
                  } ${hoveredDay === day.num ? 'bg-dark-500/30' : ''}`}
                  onClick={isCopyTarget ? () => pasteDay(day.num) : undefined}
                  onMouseEnter={() => setHoveredDay(day.num)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Day header */}
                  <div className={`h-10 flex items-center justify-between px-1.5 border-b border-dark-400/60 ${
                    isToday ? 'bg-brand-500/10' : ''
                  }`}>
                    <div className="flex items-center gap-1 pl-0.5">
                      <span className={`text-[12px] font-semibold ${isToday ? 'text-brand-500' : 'text-dark-100'}`}>
                        {day.short}
                      </span>
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                    </div>
                    {!isCopyTarget && (
                      <button
                        onClick={() => openAdd(day.num)}
                        className="w-6 h-6 rounded-md bg-dark-500/80 border border-dark-400/60 text-dark-200 
                                   hover:bg-brand-500/20 hover:border-brand-500/40 hover:text-brand-500
                                   flex items-center justify-center transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>

                  {/* Time grid */}
                  <div className="relative" style={{ height: `${HOURS.length * 52}px` }}>
                    {/* Hour lines */}
                    {HOURS.map((h, i) => (
                      <div key={h} className="absolute w-full border-b border-dark-400/15" style={{ top: `${i * 52}px`, height: '52px' }} />
                    ))}

                    {/* Slot blocks */}
                    {ds.map((slot, si) => {
                      const style = slotStyle(slot)
                      const c = SLOT_COLORS[(colorIdx + si) % SLOT_COLORS.length]
                      const duration = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time)
                      const isShort = duration <= 90

                      return (
                        <div
                          key={slot.id}
                          className={`absolute left-1 right-1 rounded-lg border ${c.bg} ${c.border} 
                                     flex flex-col justify-center px-1.5 group cursor-default
                                     hover:brightness-110 transition-all`}
                          style={style}
                        >
                          <div className={`${c.text} font-semibold leading-tight ${isShort ? 'text-[9px]' : 'text-[10px]'}`}>
                            {fmtTime(slot.start_time)}
                          </div>
                          {!isShort && (
                            <div className={`${c.text} text-[9px] opacity-70 leading-tight`}>
                              {fmtTime(slot.end_time)}
                            </div>
                          )}
                          {/* Delete button on hover */}
                          <button
                            onClick={(e) => removeSlot(slot.id, e)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white 
                                       flex items-center justify-center opacity-0 group-hover:opacity-100 
                                       transition-opacity shadow-lg"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )
                    })}


                  </div>

                  {/* Day footer — copy action */}
                  {ds.length > 0 && copied === null && (
                    <div className="h-8 flex items-center justify-center border-t border-dark-400/30">
                      <button
                        onClick={(e) => startCopy(day.num, e)}
                        className="text-[10px] text-dark-300 hover:text-dark-100 flex items-center gap-1 transition-colors"
                      >
                        <Copy size={10} /> Copier
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Bot Preview ────────────────────── */}
      {botPreview && botPreview.length > 0 && (
        <div className="mt-5 card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center">
              <Bot size={14} className="text-brand-500" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-dark-50">Ce que Ama propose aux prospects</div>
              <div className="text-[10px] text-dark-200">Aperçu basé sur vos disponibilités</div>
            </div>
          </div>
          <div className="bg-dark-900 rounded-xl p-4 border border-dark-400/40">
            <div className="text-[12px] text-dark-100 leading-relaxed">
              <span className="text-brand-500 font-medium">Ama :</span> Voici les prochains créneaux disponibles pour une visite :
            </div>
            <div className="mt-2 space-y-1.5">
              {botPreview.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-brand-500 text-[11px] font-bold">{i + 1}.</span>
                  <span className="text-[12px] text-dark-50">{p}</span>
                </div>
              ))}
            </div>
            <div className="text-[12px] text-dark-100 mt-2.5">
              Quel créneau vous conviendrait le mieux ?
            </div>
          </div>
        </div>
      )}

      {/* ── Add Slot Modal ─────────────────── */}
      {modal && (
        <Modal
          title={`Ajouter un créneau — ${DAYS.find(d => d.num === modal.day)?.full}`}
          onClose={() => setModal(null)}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Début" required>
              <input
                className="input"
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </Field>
            <Field label="Fin" required>
              <input
                className="input"
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </Field>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mt-3 mb-5">
            {[
              { label: 'Matin', s: '09:00', e: '12:00' },
              { label: 'Après-midi', s: '14:00', e: '17:00' },
              { label: 'Journée', s: '09:00', e: '17:00' },
              { label: 'Soir', s: '17:00', e: '19:00' },
            ].map(p => (
              <button
                key={p.label}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                  form.start_time === p.s && form.end_time === p.e
                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-500'
                    : 'bg-dark-500 border-dark-400 text-dark-200 hover:border-dark-300'
                }`}
                onClick={() => setForm({ start_time: p.s, end_time: p.e })}
              >
                {p.label} ({p.s}–{p.e})
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-400">
            <button className="btn-primary" onClick={saveSlot} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
            <button className="btn-ghost" onClick={() => setModal(null)}>
              Annuler
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
