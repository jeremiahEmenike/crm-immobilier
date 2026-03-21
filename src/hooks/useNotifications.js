import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications(tenantId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef(null)

  // ─── Load initial notifications ────────
  const load = useCallback(async () => {
    if (!tenantId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(30)

    const items = data || []
    setNotifications(items)
    setUnreadCount(items.filter(n => !n.is_read).length)
    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  // ─── Realtime subscription ─────────────
  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel(`notif-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newNotif = payload.new
          setNotifications(prev => [newNotif, ...prev].slice(0, 30))
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  // ─── Mark one as read ──────────────────
  const markRead = useCallback(async (id) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // ─── Mark all as read ─────────────────
  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [tenantId])

  // ─── Clear all ─────────────────────────
  const clearAll = useCallback(async () => {
    await supabase
      .from('notifications')
      .delete()
      .eq('tenant_id', tenantId)

    setNotifications([])
    setUnreadCount(0)
  }, [tenantId])

  return { notifications, unreadCount, loading, markRead, markAllRead, clearAll, refresh: load }
}
