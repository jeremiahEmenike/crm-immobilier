import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { Clock, Plus, Trash2, Loader2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────
const DAYS = [
  { num: 1, label: 'Lundi',    short: 'Lun' },
  { num: 2, label: 'Mardi',    short: 'Mar' },
  { num: 3, label: 'Mercredi', short: 'Mer' },
  { num: 4, label: 'Jeudi',    short: 'Jeu' },
  { num: 5, label: 'Vendredi', short: 'Ven' },
  { num: 6, label: 'Samedi',   short: 'Sam' },
  { num: 0, label: 'Dimanche', short: 'Dim' },
]

const fmtTime = (t) => {
  if (!t) return ''
  // Handle "09:00:00" → "09:00"
  return t.slice(0, 5)
}

// ─── Main Component ──────────────────────
export default function AvailabilityEditor() {
  const { tenant, currentUser } = useTenant()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(null)

  // ─── Load slots for current user ───────
  const load = useCallback(async () => {
    if (!tenant || !currentUser) return
    setLoading(true)
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', currentUser.id)
      .order('day_of_week')
      .order('start_time')

    if (error) {
      toast.error('Erreur chargement disponibilités')
      console.error(error)
    }
    setSlots(data || [])
    setLoading(false)
  }, [tenant, currentUser])

  useEffect(() => { load() }, [load])

  // ─── Helpers ───────────────────────────
  const daySlots = (dayNum) => slots.filter(s => s.day_of_week === dayNum && s.is_active !== false)

  const addSlot = async (dayNum) => {
    const existing = daySlots(dayNum)
    let start = '08:00', end = '12:00'
    if (existing.length > 0) {
      const last = existing[existing.length - 1]
      const lastEnd = fmtTime(last.end_time)
      start = lastEnd === '12:00' ? '14:00' : lastEnd
      const h = parseInt(start.split(':')[0])
      end = `${String(Math.min(h + 4, 23)).padStart(2, '0')}:00`
    }

    setSaving(true)
    const { error } = await supabase.from('availability').insert({
      tenant_id: tenant.id,
      user_id: currentUser.id,
      day_of_week: dayNum,
      start_time: start,
      end_time: end,
      is_active: true,
    })
    if (error) {
      if (error.code === '23505') toast.error('Ce créneau existe déjà')
      else toast.error(error.message)
    } else {
      toast.success('Créneau ajouté')
    }
    await load()
    setSaving(false)
  }

  const updateSlot = async (id, field, value) => {
    const { error } = await supabase
      .from('availability')
      .update({ [field]: value })
      .eq('id', id)
    if (error) toast.error(error.message)
    else await load()
  }

  const removeSlot = async (id) => {
    const { error } = await supabase.from('availability').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Créneau supprimé'); await load() }
  }

  // ─── Copy day ──────────────────────────
  const copyDay = (fromDay) => {
    setCopied(fromDay)
    toast('Cliquez sur un jour cible', { icon: '📋' })
  }

  const pasteDay = async (toDay) => {
    if (copied === null || copied === toDay) { setCopied(null); return }
    const source = daySlots(copied)
    if (source.length === 0) { toast.error('Aucun créneau à copier'); setCopied(null); return }

    setSaving(true)
    // Remove existing slots for target day
    await supabase
      .from('availability')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('user_id', currentUser.id)
      .eq('day_of_week', toDay)

    // Insert copied
    const inserts = source.map(s => ({
      tenant_id: tenant.id,
      user_id: currentUser.id,
      day_of_week: toDay,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: true,
    }))
    const { error } = await supabase.from('availability').insert(inserts)
    if (error) toast.error(error.message)
    else toast.success(`Créneaux copiés vers ${DAYS.find(d => d.num === toDay)?.label}`)
    setCopied(null)
    await load()
    setSaving(false)
  }

  // ─── Default schedule ──────────────────
  const applyDefaults = async () => {
    if (!confirm('Remplacer tous vos créneaux par les horaires standard (Lun-Ven 9h-17h) ?')) return
    setSaving(true)
    await supabase
      .from('availability')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('user_id', currentUser.id)

    const inserts = []
    for (let d = 1; d <= 5; d++) {
      inserts.push({
        tenant_id: tenant.id,
        user_id: currentUser.id,
        day_of_week: d,
        start_time: '09:00',
        end_time: '12:00',
        is_active: true,
      })
      inserts.push({
        tenant_id: tenant.id,
        user_id: currentUser.id,
        day_of_week: d,
        start_time: '14:00',
        end_time: '17:00',
        is_active: true,
      })
    }

    const { error } = await supabase.from('availability').insert(inserts)
    if (error) toast.error(error.message)
    else toast.success('Horaires par défaut appliqués')
    await load()
    setSaving(false)
  }

  // ─── Render ─────────────────────────────
  if (!currentUser) {
    return (
      <div className="card p-5">
        <p className="text-dark-200 text-sm text-center py-4">
          Impossible de charger votre profil utilisateur. Rechargez la page.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock size={16} className="text-brand-500" />
          Mes horaires de visite
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-dark-200">{currentUser.name} · {currentUser.role}</span>
          <button className="btn-sm text-[11px]" onClick={applyDefaults} disabled={saving}>
            Horaires par défaut
          </button>
        </div>
      </div>

      {slots.length === 0 && (
        <div className="text-center py-6">
          <p className="text-dark-200 text-sm mb-3">Aucun créneau défini</p>
          <p className="text-dark-300 text-xs mb-4">
            Le bot Ama ne pourra pas proposer de visites tant que vos disponibilités ne sont pas configurées.
          </p>
          <button className="btn-primary text-sm" onClick={applyDefaults}>
            Appliquer les horaires standard
          </button>
        </div>
      )}

      <div className="space-y-1">
        {DAYS.map((day) => {
          const ds = daySlots(day.num)
          const isTarget = copied !== null && copied !== day.num

          return (
            <div
              key={day.num}
              className={`flex items-start gap-3 py-2.5 border-b border-dark-400/40 last:border-0 ${
                isTarget ? 'bg-brand-500/5 rounded-lg px-2 -mx-2 cursor-pointer' : ''
              }`}
              onClick={isTarget ? () => pasteDay(day.num) : undefined}
            >
              {/* Day label */}
              <div className="w-[70px] flex-shrink-0 pt-1.5">
                <span className="text-[13px] font-medium text-dark-50">{day.short}</span>
              </div>

              {/* Slots */}
              <div className="flex-1">
                {ds.length === 0 ? (
                  <span className="text-[12px] text-dark-300 italic pt-1.5 inline-block">Fermé</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ds.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-1.5 bg-dark-500 rounded-lg px-2 py-1">
                        <input
                          type="time"
                          className="bg-transparent text-[12px] text-dark-50 w-[70px] outline-none"
                          value={fmtTime(slot.start_time)}
                          onChange={(e) => updateSlot(slot.id, 'start_time', e.target.value)}
                        />
                        <span className="text-dark-300 text-[11px]">→</span>
                        <input
                          type="time"
                          className="bg-transparent text-[12px] text-dark-50 w-[70px] outline-none"
                          value={fmtTime(slot.end_time)}
                          onChange={(e) => updateSlot(slot.id, 'end_time', e.target.value)}
                        />
                        <button
                          onClick={() => removeSlot(slot.id)}
                          className="p-0.5 rounded hover:bg-red-500/20 text-dark-300 hover:text-red-400 transition-colors ml-0.5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 pt-1">
                <button
                  onClick={() => addSlot(day.num)}
                  className="p-1.5 rounded-lg hover:bg-dark-500 text-dark-200 hover:text-brand-500 transition-colors"
                  title="Ajouter un créneau"
                >
                  <Plus size={14} />
                </button>
                {ds.length > 0 && (
                  <button
                    onClick={() => copyDay(day.num)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      copied === day.num
                        ? 'bg-brand-500/20 text-brand-500'
                        : 'hover:bg-dark-500 text-dark-200 hover:text-dark-100'
                    }`}
                    title="Copier vers un autre jour"
                  >
                    {copied === day.num ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {copied !== null && (
        <div className="mt-3 text-[11px] text-brand-500 bg-brand-500/10 px-3 py-2 rounded-lg">
          Cliquez sur un jour pour y coller les créneaux de {DAYS.find(d => d.num === copied)?.label}.
          <button className="ml-2 underline" onClick={() => setCopied(null)}>Annuler</button>
        </div>
      )}
    </div>
  )
}
