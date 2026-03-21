import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTenant } from '../hooks/useData'
import { supabase } from '../lib/supabase'
import { MessageSquare, Search, Bot, User, Phone, ArrowLeft, Loader2, Zap } from 'lucide-react'
import { Badge } from '../components/UI'
import { fmtDate, fmtTime } from '../lib/constants'

// ─── Time helpers ────────────────────────
function timeAgo(d) {
  if (!d) return ''
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`
  return fmtDate(d)
}

function msgTime(d) {
  if (!d) return ''
  return fmtTime(d)
}

function dateSeparator(d) {
  if (!d) return ''
  const today = new Date()
  const date = new Date(d)
  const diffDays = Math.floor((today - date) / 86400000)
  if (diffDays === 0) return 'Aujourd\'hui'
  if (diffDays === 1) return 'Hier'
  return fmtDate(d)
}

// ─── Component ───────────────────────────
export default function ConversationsPage() {
  const { tenant } = useTenant()
  const [threads, setThreads] = useState([])
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  // ─── Load thread list (leads with messages) ──
  const loadThreads = useCallback(async () => {
    if (!tenant) return
    setLoading(true)

    try {
      const { data: rawMessages } = await supabase
        .from('messages')
        .select('lead_id, role, content, created_at')
        .eq('tenant_id', tenant.id)
        .not('lead_id', 'is', null)
        .order('created_at', { ascending: false })

      if (!rawMessages || rawMessages.length === 0) {
        setThreads([])
        setLoading(false)
        return
      }

      const grouped = {}
      for (const m of rawMessages) {
        if (!m.lead_id) continue
        if (!grouped[m.lead_id]) {
          grouped[m.lead_id] = { lead_id: m.lead_id, last_message: m.content, last_role: m.role, last_at: m.created_at, msg_count: 0 }
        }
        grouped[m.lead_id].msg_count++
      }

      const leadIds = Object.keys(grouped)
      if (leadIds.length === 0) {
        setThreads([])
        setLoading(false)
        return
      }

      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, phone, score, classification, pipeline_stage, language')
        .in('id', leadIds)

      const leadMap = {}
      for (const l of (leads || [])) { leadMap[l.id] = l }

      const threadList = Object.values(grouped).map(t => ({
        ...t,
        lead_name: leadMap[t.lead_id]?.name || null,
        lead_phone: leadMap[t.lead_id]?.phone || null,
        score: leadMap[t.lead_id]?.score || 0,
        classification: leadMap[t.lead_id]?.classification || null,
        pipeline_stage: leadMap[t.lead_id]?.pipeline_stage || null,
        language: leadMap[t.lead_id]?.language || 'fr',
      })).sort((a, b) => new Date(b.last_at) - new Date(a.last_at))

      setThreads(threadList)
    } catch (err) {
      console.error('loadThreads error:', err)
      setThreads([])
    }

    setLoading(false)
  }, [tenant])

  useEffect(() => { loadThreads() }, [loadThreads])

  // ─── Load messages for selected lead ──────
  const loadMessages = useCallback(async (leadId) => {
    if (!tenant || !leadId) return
    setMsgLoading(true)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('lead_id', leadId)
      .neq('role', 'tool_context')
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setMsgLoading(false)

    // Scroll to bottom
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [tenant])

  useEffect(() => {
    if (selectedLeadId) loadMessages(selectedLeadId)
  }, [selectedLeadId, loadMessages])

  // ─── Realtime subscription ────────────────
  useEffect(() => {
    if (!tenant) return

    const channel = supabase
      .channel(`msgs-${tenant.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `tenant_id=eq.${tenant.id}`,
      }, (payload) => {
        const newMsg = payload.new

        // Update thread list
        setThreads(prev => {
          const existing = prev.find(t => t.lead_id === newMsg.lead_id)
          if (existing) {
            return prev.map(t => t.lead_id === newMsg.lead_id
              ? { ...t, last_message: newMsg.content, last_role: newMsg.role, last_at: newMsg.created_at, msg_count: t.msg_count + 1 }
              : t
            ).sort((a, b) => new Date(b.last_at) - new Date(a.last_at))
          }
          return prev
        })

        // If this lead is selected, add to messages
        if (newMsg.lead_id === selectedLeadId && newMsg.role !== 'tool_context') {
          setMessages(prev => [...prev, newMsg])
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [tenant, selectedLeadId])

  // ─── Filter threads ────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return threads
    const q = search.toLowerCase()
    return threads.filter(t =>
      (t.lead_name || '').toLowerCase().includes(q) ||
      (t.lead_phone || '').includes(q) ||
      (t.last_message || '').toLowerCase().includes(q)
    )
  }, [threads, search])

  // ─── Selected thread info ──────────────────
  const selectedThread = threads.find(t => t.lead_id === selectedLeadId)

  // ─── Group messages by date ────────────────
  const groupedMessages = useMemo(() => {
    const groups = []
    let currentDate = null
    for (const msg of messages) {
      const d = new Date(msg.created_at).toDateString()
      if (d !== currentDate) {
        currentDate = d
        groups.push({ type: 'date', date: msg.created_at })
      }
      groups.push({ type: 'msg', ...msg })
    }
    return groups
  }, [messages])

  // ─── Render ────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={22} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Conversations</h1>
      <p className="page-sub">Échanges WhatsApp entre Ama et vos prospects</p>

      <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        <div className="flex h-full">

          {/* ── Thread List (left) ──────────── */}
          <div className={`w-full sm:w-[320px] flex-shrink-0 border-r border-dark-400/60 flex flex-col
            ${selectedLeadId ? 'hidden sm:flex' : 'flex'}`}>

            {/* Search */}
            <div className="p-3 border-b border-dark-400/60">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200" />
                <input
                  className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-400 rounded-lg 
                           text-[12px] text-dark-50 placeholder:text-dark-300 outline-none
                           focus:border-brand-500/40"
                  placeholder="Rechercher un lead..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Thread items */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <MessageSquare size={24} className="text-dark-300 mx-auto mb-3" />
                  <p className="text-dark-200 text-[12px]">Aucune conversation</p>
                </div>
              ) : (
                filtered.map(t => (
                  <div
                    key={t.lead_id}
                    onClick={() => setSelectedLeadId(t.lead_id)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-dark-400/20
                      ${selectedLeadId === t.lead_id ? 'bg-brand-500/10' : 'hover:bg-dark-500/40'}`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-dark-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-bold text-dark-100">
                        {(t.lead_name || t.lead_phone || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-dark-50 truncate">
                          {t.lead_name || t.lead_phone || 'Lead inconnu'}
                        </span>
                        <span className="text-[10px] text-dark-300 flex-shrink-0 ml-2">
                          {timeAgo(t.last_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {t.last_role === 'assistant' && <Bot size={11} className="text-brand-500 flex-shrink-0" />}
                        <p className="text-[11px] text-dark-200 truncate">
                          {t.last_message?.slice(0, 60) || '...'}
                        </p>
                      </div>
                      {t.classification && (
                        <div className="mt-1">
                          <Badge status={t.pipeline_stage} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Chat Area (right) ──────────── */}
          <div className={`flex-1 flex flex-col ${!selectedLeadId ? 'hidden sm:flex' : 'flex'}`}>

            {!selectedLeadId ? (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-dark-500 flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-dark-300" />
                </div>
                <p className="text-dark-200 text-[13px]">Sélectionnez une conversation</p>
                <p className="text-dark-300 text-[11px] mt-1">Les échanges WhatsApp d'Ama apparaîtront ici</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-400/60 bg-dark-700/50">
                  <button
                    onClick={() => setSelectedLeadId(null)}
                    className="sm:hidden p-1.5 rounded-lg hover:bg-dark-500 text-dark-200"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="w-9 h-9 rounded-full bg-dark-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] font-bold text-dark-100">
                      {(selectedThread?.lead_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-dark-50 truncate">
                      {selectedThread?.lead_name || 'Lead'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-dark-200">
                      {selectedThread?.lead_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={9} /> {selectedThread.lead_phone}
                        </span>
                      )}
                      {selectedThread?.score > 0 && (
                        <span>Score {selectedThread.score}/20</span>
                      )}
                      {selectedThread?.language && (
                        <span className="uppercase">{selectedThread.language}</span>
                      )}
                    </div>
                  </div>

                  {selectedThread?.pipeline_stage && (
                    <Badge status={selectedThread.pipeline_stage} />
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(201,168,76,0.02) 0%, transparent 70%)' }}>
                  {msgLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={18} className="text-brand-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {groupedMessages.map((item, i) => {
                        if (item.type === 'date') {
                          return (
                            <div key={`d-${i}`} className="flex justify-center my-4">
                              <span className="bg-dark-500 text-dark-200 text-[10px] px-3 py-1 rounded-full">
                                {dateSeparator(item.date)}
                              </span>
                            </div>
                          )
                        }

                        const isUser = item.role === 'user'
                        return (
                          <div
                            key={item.id}
                            className={`flex mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                                isUser
                                  ? 'bg-brand-500/15 border border-brand-500/20 rounded-br-md'
                                  : 'bg-dark-500 border border-dark-400/40 rounded-bl-md'
                              }`}
                            >
                              {/* Sender label */}
                              <div className={`text-[9px] font-semibold mb-0.5 ${
                                isUser ? 'text-brand-500' : 'text-blue-400'
                              }`}>
                                {isUser ? (selectedThread?.lead_name || 'Lead') : 'Ama'}
                              </div>

                              {/* Content */}
                              <p className="text-[12.5px] text-dark-50 leading-relaxed whitespace-pre-wrap break-words">
                                {item.content}
                              </p>

                              {/* Time */}
                              <div className={`text-[9px] mt-1 ${isUser ? 'text-brand-500/50' : 'text-dark-300'} text-right`}>
                                {msgTime(item.created_at)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>

                {/* Read-only footer */}
                <div className="px-4 py-3 border-t border-dark-400/60 bg-dark-700/30">
                  <div className="flex items-center gap-2 text-dark-300">
                    <Zap size={14} className="text-brand-500" />
                    <span className="text-[11px]">
                      Conversation gérée par Ama — lecture seule
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
