import { useEffect } from 'react'
import { X } from 'lucide-react'
import { label, statusColor } from '../lib/constants'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Badge ─────────────────────────────────
export function Badge({ status, className = '' }) {
  return (
    <span className={`badge ${statusColor(status)} ${className}`}>
      {label(status)}
    </span>
  )
}

// ─── Stat Card ─────────────────────────────
export function StatCard({ label: lbl, value, color = 'text-dark-50', icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-dark-200 uppercase tracking-[1.5px] font-semibold">{lbl}</span>
        {Icon && <Icon size={16} className="text-dark-200" />}
      </div>
      <div className={`text-[28px] font-bold tracking-tight font-display ${color}`}>{value}</div>
    </div>
  )
}

// ─── Modal ─────────────────────────────────
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-box"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-display">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-dark-500 text-dark-100 hover:text-dark-50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Form Field ────────────────────────────
export function Field({ label: lbl, required, children, className = '' }) {
  return (
    <div className={`mb-3.5 ${className}`}>
      <label className="label">
        {lbl} {required && <span className="text-brand-500">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Empty State ───────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state flex flex-col items-center gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-dark-500 flex items-center justify-center mb-1">
          <Icon size={20} className="text-dark-200" />
        </div>
      )}
      <p className="text-dark-50 font-medium text-sm">{title || 'Aucune donnée'}</p>
      {description && <p className="text-dark-200 text-xs max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ─── Toggle ────────────────────────────────
export function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 flex-shrink-0 ${
        on ? 'bg-emerald-500' : 'bg-dark-400'
      }`}
    >
      <div
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-all duration-200 ${
          on ? 'left-5' : 'left-[2px]'
        }`}
      />
    </button>
  )
}

// ─── Action Buttons Row ────────────────────
export function ActionButtons({ onSave, onDelete, onCancel, saving, isEdit }) {
  return (
    <div className="flex gap-3 mt-6 pt-5 border-t border-dark-400">
      <button className="btn-primary" onClick={onSave} disabled={saving}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
      {isEdit && (
        <button className="btn-danger" onClick={onDelete} disabled={saving}>
          Supprimer
        </button>
      )}
      <button className="btn-ghost" onClick={onCancel}>
        Annuler
      </button>
    </div>
  )
}
