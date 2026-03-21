import { useState, useRef, useEffect } from 'react'
import { Bell, Flame, CalendarCheck, UserCheck, Building2, Info, CheckCheck, Trash2, X } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Type config ─────────────────────────
const TYPE_CONFIG = {
  hot_lead: {
    icon: Flame,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    accent: 'border-l-red-500',
  },
  visit_booked: {
    icon: CalendarCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    accent: 'border-l-emerald-500',
  },
  visit_reminder: {
    icon: CalendarCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    accent: 'border-l-amber-400',
  },
  lead_qualified: {
    icon: UserCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    accent: 'border-l-blue-400',
  },
  property_matched: {
    icon: Building2,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    accent: 'border-l-purple-400',
  },
  system: {
    icon: Info,
    color: 'text-dark-100',
    bg: 'bg-dark-500',
    accent: 'border-l-dark-300',
  },
}

const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.system

// ─── Time ago ────────────────────────────
function timeAgo(dateStr) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Component ───────────────────────────
export default function NotificationBell({ tenantId }) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications(tenantId)
  const [open, setOpen] = useState(false)
  const [animate, setAnimate] = useState(false)
  const panelRef = useRef(null)
  const prevCount = useRef(unreadCount)

  // Animate bell on new notification
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      setAnimate(true)
      const t = setTimeout(() => setAnimate(false), 600)
      return () => clearTimeout(t)
    }
    prevCount.current = unreadCount
  }, [unreadCount])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleClick = (notif) => {
    if (!notif.is_read) markRead(notif.id)
    // Could navigate based on type/metadata here
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell Button ──────────────── */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition-colors ${
          open ? 'bg-dark-500 text-brand-500' : 'hover:bg-dark-500/60 text-dark-100 hover:text-dark-50'
        }`}
      >
        <Bell
          size={18}
          className={animate ? 'animate-wiggle' : ''}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 
                         bg-red-500 text-white text-[10px] font-bold rounded-full 
                         flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ───────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] 
                       bg-dark-600 border border-dark-400 rounded-xl shadow-2xl shadow-black/40 
                       overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-400/60">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-dark-50">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-md hover:bg-dark-500 text-dark-200 hover:text-emerald-400 transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => { clearAll(); setOpen(false) }}
                    className="p-1.5 rounded-md hover:bg-dark-500 text-dark-200 hover:text-red-400 transition-colors"
                    title="Tout supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md hover:bg-dark-500 text-dark-200 hover:text-dark-50 transition-colors lg:hidden"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={24} className="text-dark-300 mx-auto mb-3" />
                  <p className="text-dark-200 text-[12px]">Aucune notification</p>
                  <p className="text-dark-300 text-[11px] mt-1">Les alertes du bot apparaîtront ici</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = getConfig(notif.type)
                  const Icon = config.icon

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`flex gap-3 px-4 py-3 border-b border-dark-400/30 cursor-pointer
                                 transition-colors hover:bg-dark-500/40 border-l-[3px]
                                 ${notif.is_read ? 'border-l-transparent opacity-60' : config.accent}`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={15} className={config.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[12px] font-semibold leading-tight ${
                            notif.is_read ? 'text-dark-100' : 'text-dark-50'
                          }`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-dark-300 flex-shrink-0 mt-0.5">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        {notif.body && (
                          <p className="text-[11px] text-dark-200 mt-0.5 leading-relaxed line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                      </div>

                      {/* Unread dot */}
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
