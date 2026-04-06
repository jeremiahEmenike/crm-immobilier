import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  Handle,
  Position,
  getBezierPath,
  BaseEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { supabase } from '../lib/supabase'
import { useTenant } from '../hooks/useData'
import toast from 'react-hot-toast'
import {
  Play, MessageSquare, HelpCircle, Sparkles, GitBranch,
  Zap, RefreshCw, Clock, Link2, ArrowUpRight, Square,
  Plus, Save, Trash2, ChevronRight, X, Settings,
  Loader2, Eye, EyeOff, Copy, AlertCircle
} from 'lucide-react'

// ─── NODE CONFIGS ─────────────────────────────────────────────
const NODE_TYPES_CONFIG = {
  start:       { label: 'Début',        icon: Play,          color: '#10b981', desc: 'Point d\'entrée du flux' },
  message:     { label: 'Message',      icon: MessageSquare, color: '#3b82f6', desc: 'Envoie un message au lead' },
  question:    { label: 'Question',     icon: HelpCircle,    color: '#5856d6', desc: 'Pose une question, stocke la réponse' },
  ai_response: { label: 'IA',           icon: Sparkles,      color: '#f59e0b', desc: 'Génère une réponse LLM contextuelle' },
  condition:   { label: 'Condition',    icon: GitBranch,     color: '#ef4444', desc: 'Branche if/else sur variables' },
  action:      { label: 'Action',       icon: Zap,           color: '#06b6d4', desc: 'Update lead, notifie agent, API call' },
  loop:        { label: 'Boucle',       icon: RefreshCw,     color: '#ec4899', desc: 'Répète jusqu\'à condition de sortie' },
  delay:       { label: 'Délai',        icon: Clock,         color: '#64748b', desc: 'Pause avant le prochain noeud' },
  integration: { label: 'Intégration', icon: Link2,         color: '#f97316', desc: 'Appel externe : CRM, Calendar, API' },
  sub_flow:    { label: 'Sous-flux',   icon: ArrowUpRight,  color: '#af52de', desc: 'Référence un autre flux' },
  end:         { label: 'Fin',          icon: Square,        color: '#6b7280', desc: 'Fin du flux, statut final' },
}

// ─── BASE NODE COMPONENT ──────────────────────────────────────
function BaseNode({ data, selected, id }) {
  const cfg = NODE_TYPES_CONFIG[data.type] || NODE_TYPES_CONFIG.message
  const Icon = cfg.icon
  const isStart = data.type === 'start'
  const isEnd = data.type === 'end'

  return (
    <div
      className="relative group"
      style={{
        minWidth: 200,
        background: '#ffffff',
        border: `2px solid ${selected ? cfg.color : '#d2d2d7'}`,
        borderRadius: 12,
        boxShadow: selected ? `0 0 0 3px ${cfg.color}22` : '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Input handle */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#d2d2d7', border: `2px solid ${cfg.color}`, width: 10, height: 10 }}
        />
      )}

      {/* Header */}
      <div style={{ background: `${cfg.color}18`, borderRadius: '10px 10px 0 0', padding: '8px 12px' }}
           className="flex items-center gap-2">
        <div style={{ background: cfg.color, borderRadius: 6, padding: 4, display: 'flex' }}>
          <Icon size={12} color="#ffffff" />
        </div>
        <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        {data.label && (
          <div style={{ color: '#1d1d1f', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {data.label}
          </div>
        )}
        {data.content && (
          <div style={{ color: '#86868b', fontSize: 11, lineHeight: 1.5,
                        maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.content}
          </div>
        )}
        {data.variable && (
          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#d2d2d7', borderRadius: 4, padding: '2px 8px' }}>
            <span style={{ color: '#C9A84C', fontSize: 10, fontFamily: 'monospace' }}>
              {`{{${data.variable}}}`}
            </span>
          </div>
        )}
        {data.condition && (
          <div style={{ marginTop: 6, fontSize: 10, color: '#ef4444', fontFamily: 'monospace',
                        background: '#ef444411', borderRadius: 4, padding: '2px 8px' }}>
            {data.condition}
          </div>
        )}
        {data.delay && (
          <div style={{ marginTop: 6, fontSize: 10, color: '#64748b' }}>
            ⏱ {data.delay}
          </div>
        )}
        {!data.label && !data.content && (
          <div style={{ color: '#aeaeb2', fontSize: 11, fontStyle: 'italic' }}>
            Double-clic pour configurer...
          </div>
        )}
      </div>

      {/* Output handle(s) */}
      {!isEnd && (
        <>
          {data.type === 'condition' ? (
            <>
              <Handle type="source" position={Position.Bottom} id="true"
                style={{ background: '#10b981', border: '2px solid #10b981',
                         width: 10, height: 10, left: '30%' }} />
              <Handle type="source" position={Position.Bottom} id="false"
                style={{ background: '#ef4444', border: '2px solid #ef4444',
                         width: 10, height: 10, left: '70%' }} />
            </>
          ) : (
            <Handle type="source" position={Position.Bottom}
              style={{ background: '#d2d2d7', border: `2px solid ${cfg.color}`, width: 10, height: 10 }} />
          )}
        </>
      )}

      {/* Condition labels */}
      {data.type === 'condition' && (
        <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0,
                      display: 'flex', justifyContent: 'space-around', pointerEvents: 'none' }}>
          <span style={{ color: '#10b981', fontSize: 9, fontWeight: 700 }}>OUI</span>
          <span style={{ color: '#ef4444', fontSize: 9, fontWeight: 700 }}>NON</span>
        </div>
      )}
    </div>
  )
}

// Register all node types as the same base component
const nodeTypes = Object.fromEntries(
  Object.keys(NODE_TYPES_CONFIG).map(type => [type, BaseNode])
)

// ─── CUSTOM EDGE ──────────────────────────────────────────────
function CustomEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd }) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <BaseEdge id={id} path={edgePath} markerEnd={markerEnd}
      style={{ stroke: '#aeaeb2', strokeWidth: 2 }} />
  )
}

const edgeTypes = { default: CustomEdge }

// ─── NODE PALETTE ─────────────────────────────────────────────
function NodePalette({ onAdd }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 12,
                  padding: 12, width: 180 }}>
      <div style={{ color: '#86868b', fontSize: 10, fontWeight: 700,
                    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
        Noeuds
      </div>
      {Object.entries(NODE_TYPES_CONFIG).map(([type, cfg]) => {
        const Icon = cfg.icon
        return (
          <button key={type} onClick={() => onAdd(type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: 'transparent', marginBottom: 2, transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ background: `${cfg.color}22`, borderRadius: 5, padding: 4, display: 'flex' }}>
              <Icon size={11} color={cfg.color} />
            </div>
            <span style={{ color: '#1d1d1f', fontSize: 11, fontWeight: 500 }}>{cfg.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── NODE EDITOR PANEL ────────────────────────────────────────
function NodeEditor({ node, onUpdate, onDelete, onClose }) {
  const cfg = NODE_TYPES_CONFIG[node.data.type]
  const [form, setForm] = useState({ ...node.data })

  const handleSave = () => {
    onUpdate(node.id, form)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 16,
        width: 460, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #d2d2d7',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: `${cfg.color}22`, borderRadius: 8, padding: 6, display: 'flex' }}>
              <cfg.icon size={14} color={cfg.color} />
            </div>
            <div>
              <div style={{ color: '#1d1d1f', fontSize: 14, fontWeight: 700 }}>
                Configurer — {cfg.label}
              </div>
              <div style={{ color: '#86868b', fontSize: 11 }}>{cfg.desc}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86868b' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Label */}
          <div>
            <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
              Titre du noeud
            </label>
            <input
              value={form.label || ''}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder={`Ex: ${cfg.label} principal`}
              style={{
                width: '100%', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
                padding: '8px 12px', color: '#1d1d1f', fontSize: 13, outline: 'none'
              }}
            />
          </div>

          {/* Content (message, question, ai_response) */}
          {['message', 'question', 'ai_response', 'start', 'end'].includes(node.data.type) && (
            <div>
              <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                {node.data.type === 'ai_response' ? 'Prompt / Instructions LLM' : 'Contenu du message'}
              </label>
              <textarea
                value={form.content || ''}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={
                  node.data.type === 'ai_response'
                    ? 'Ex: Réponds naturellement en tenant compte du contexte. Ne pose qu\'une seule question.'
                    : node.data.type === 'question'
                    ? 'Ex: Quel est votre budget maximum ?'
                    : 'Ex: Bonjour ! Je suis Ama, votre assistante immobilière 👋'
                }
                rows={4}
                style={{
                  width: '100%', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
                  padding: '8px 12px', color: '#1d1d1f', fontSize: 13, outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {/* Variable (question) */}
          {node.data.type === 'question' && (
            <div>
              <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Stocker dans la variable
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                               color: '#C9A84C', fontSize: 12, fontFamily: 'monospace' }}>{'{{'}
                </span>
                <input
                  value={form.variable || ''}
                  onChange={e => setForm(f => ({ ...f, variable: e.target.value.replace(/\s/g, '_').toLowerCase() }))}
                  placeholder="budget_max"
                  style={{
                    width: '100%', background: '#ffffff', border: '1px solid #C9A84C44', borderRadius: 8,
                    padding: '8px 30px', color: '#C9A84C', fontSize: 13, outline: 'none', fontFamily: 'monospace'
                  }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                               color: '#C9A84C', fontSize: 12, fontFamily: 'monospace' }}>{'}}'}</span>
              </div>
              <div style={{ color: '#aeaeb2', fontSize: 10, marginTop: 4 }}>
                La réponse du lead sera accessible via cette variable dans tout le flux
              </div>
            </div>
          )}

          {/* Condition */}
          {node.data.type === 'condition' && (
            <div>
              <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Expression conditionnelle
              </label>
              <input
                value={form.condition || ''}
                onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                placeholder="Ex: {{budget_max}} > 50000000"
                style={{
                  width: '100%', background: '#ffffff', border: '1px solid #ef444444', borderRadius: 8,
                  padding: '8px 12px', color: '#ef4444', fontSize: 12, outline: 'none', fontFamily: 'monospace'
                }}
              />
              <div style={{ color: '#aeaeb2', fontSize: 10, marginTop: 4 }}>
                Utilise &#123;&#123;variable&#125;&#125; · Sortie verte = vrai, rouge = faux
              </div>
            </div>
          )}

          {/* Action */}
          {node.data.type === 'action' && (
            <div>
              <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Type d'action
              </label>
              <select
                value={form.action_type || ''}
                onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}
                style={{
                  width: '100%', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
                  padding: '8px 12px', color: '#1d1d1f', fontSize: 13, outline: 'none'
                }}
              >
                <option value="">-- Sélectionner --</option>
                <option value="update_lead">Mettre à jour le lead</option>
                <option value="notify_agent">Notifier l'agent</option>
                <option value="book_visit">Réserver une visite</option>
                <option value="match_properties">Matching biens</option>
                <option value="send_followup">Envoyer un follow-up</option>
                <option value="api_call">Appel API externe</option>
                <option value="update_score">Mettre à jour le score</option>
              </select>
            </div>
          )}

          {/* Delay */}
          {node.data.type === 'delay' && (
            <div>
              <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Durée du délai
              </label>
              <input
                value={form.delay || ''}
                onChange={e => setForm(f => ({ ...f, delay: e.target.value }))}
                placeholder="Ex: 2h, 1j, 30min"
                style={{
                  width: '100%', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
                  padding: '8px 12px', color: '#1d1d1f', fontSize: 13, outline: 'none'
                }}
              />
            </div>
          )}

          {/* Integration */}
          {node.data.type === 'integration' && (
            <div>
              <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                Connecteur
              </label>
              <select
                value={form.integration_type || ''}
                onChange={e => setForm(f => ({ ...f, integration_type: e.target.value }))}
                style={{
                  width: '100%', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
                  padding: '8px 12px', color: '#1d1d1f', fontSize: 13, outline: 'none'
                }}
              >
                <option value="">-- Sélectionner --</option>
                <option value="google_calendar">Google Calendar</option>
                <option value="google_sheets">Google Sheets</option>
                <option value="hubspot">HubSpot</option>
                <option value="shopify">Shopify</option>
                <option value="calendly">Calendly</option>
                <option value="stripe">Stripe</option>
                <option value="custom_webhook">Webhook personnalisé</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ color: '#86868b', fontSize: 11, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
              Notes internes (optionnel)
            </label>
            <input
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Remarque pour l'équipe..."
              style={{
                width: '100%', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
                padding: '8px 12px', color: '#86868b', fontSize: 12, outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #d2d2d7',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { onDelete(node.id); onClose() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                     cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
            <Trash2 size={14} /> Supprimer
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ padding: '7px 16px', background: '#d2d2d7', border: 'none', borderRadius: 8,
                       color: '#86868b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={handleSave}
              style={{ padding: '7px 16px', background: '#C9A84C', border: 'none', borderRadius: 8,
                       color: '#ffffff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FLOW SELECTOR ────────────────────────────────────────────
function FlowSelector({ flows, activeFlow, onSelect, onNew, loading }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select
        value={activeFlow?.id || ''}
        onChange={e => onSelect(flows.find(f => f.id === e.target.value))}
        style={{
          background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
          padding: '6px 10px', color: '#1d1d1f', fontSize: 12, outline: 'none', minWidth: 200
        }}
      >
        <option value="" disabled>Sélectionner un flux...</option>
        {flows.map(f => (
          <option key={f.id} value={f.id}>
            {f.name} {f.is_active ? '● ACTIF' : `v${f.version}`}
          </option>
        ))}
      </select>
      <button onClick={onNew}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                 background: '#d2d2d7', border: '1px solid #aeaeb2', borderRadius: 8,
                 color: '#1d1d1f', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        <Plus size={13} /> Nouveau
      </button>
    </div>
  )
}

// ─── DEFAULT FLOW GRAPH ───────────────────────────────────────
const DEFAULT_NODES = [
  { id: 'start-1', type: 'start', position: { x: 340, y: 40 },
    data: { type: 'start', label: 'Nouveau message', content: 'Le flux démarre quand un message WhatsApp arrive' } },
  { id: 'msg-1', type: 'message', position: { x: 280, y: 180 },
    data: { type: 'message', label: 'Message d\'accueil', content: 'Bonjour ! Je suis Ama, votre assistante immobilière 👋 Comment puis-je vous aider ?' } },
  { id: 'q-1', type: 'question', position: { x: 260, y: 340 },
    data: { type: 'question', label: 'Demander l\'intention', content: 'Vous cherchez à acheter, louer ou vendre un bien ?', variable: 'intent' } },
  { id: 'cond-1', type: 'condition', position: { x: 280, y: 510 },
    data: { type: 'condition', label: 'Achat ou location ?', condition: '{{intent}} == "achat"' } },
  { id: 'ai-1', type: 'ai_response', position: { x: 60, y: 680 },
    data: { type: 'ai_response', label: 'Qualification achat', content: 'Collecte zone, budget, type de bien, chambres. Une question à la fois.' } },
  { id: 'ai-2', type: 'ai_response', position: { x: 480, y: 680 },
    data: { type: 'ai_response', label: 'Qualification location', content: 'Collecte zone, loyer max, type de bien, durée. Une question à la fois.' } },
  { id: 'action-1', type: 'action', position: { x: 280, y: 860 },
    data: { type: 'action', label: 'Scorer le lead', action_type: 'update_score' } },
  { id: 'end-1', type: 'end', position: { x: 320, y: 1000 },
    data: { type: 'end', label: 'Fin qualification', content: 'Lead qualifié — pipeline_stage → Qualified' } },
]

const DEFAULT_EDGES = [
  { id: 'e-s-m', source: 'start-1', target: 'msg-1', type: 'default' },
  { id: 'e-m-q', source: 'msg-1', target: 'q-1', type: 'default' },
  { id: 'e-q-c', source: 'q-1', target: 'cond-1', type: 'default' },
  { id: 'e-c-ai1', source: 'cond-1', sourceHandle: 'true', target: 'ai-1', type: 'default' },
  { id: 'e-c-ai2', source: 'cond-1', sourceHandle: 'false', target: 'ai-2', type: 'default' },
  { id: 'e-ai1-a', source: 'ai-1', target: 'action-1', type: 'default' },
  { id: 'e-ai2-a', source: 'ai-2', target: 'action-1', type: 'default' },
  { id: 'e-a-e', source: 'action-1', target: 'end-1', type: 'default' },
]

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function ConversationBuilderPage() {
  const { tenant, activeAgent } = useTenant()

  // Flow state
  const [flows, setFlows] = useState([])
  const [activeFlow, setActiveFlow] = useState(null)
  const agent = activeAgent
  const [loadingFlows, setLoadingFlows] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [showPalette, setShowPalette] = useState(true)
  const [isDirty, setIsDirty] = useState(false)

  const reactFlowWrapper = useRef(null)

  // ─── Load flows for active agent ──────────────────────────
  useEffect(() => {
    if (!activeAgent?.id) {
      setFlows([])
      setActiveFlow(null)
      setLoadingFlows(false)
      return
    }
    loadFlowsForAgent()
  }, [activeAgent?.id])

  const loadFlowsForAgent = async () => {
    setLoadingFlows(true)
    try {
      // Get all flows for this agent
      const { data: flowData } = await supabase
        .from('agent_flows')
        .select('*')
        .eq('agent_id', activeAgent.id)
        .order('created_at', { ascending: false })

      setFlows(flowData || [])

      // Load active flow or first flow
      const active = (flowData || []).find(f => f.is_active) || (flowData || [])[0]
      if (active) loadFlow(active)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingFlows(false)
    }
  }

  const loadFlow = (flow) => {
    setActiveFlow(flow)
    const graph = flow.flow_graph || {}
    const n = (graph.nodes || DEFAULT_NODES).map(node => ({
      ...node,
      data: { ...node.data, type: node.type }
    }))
    setNodes(n)
    setEdges(graph.edges || DEFAULT_EDGES)
    setIsDirty(false)
  }

  // ─── Edge connect ─────────────────────────────────────────
  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type: 'default' }, eds))
    setIsDirty(true)
  }, [setEdges])

  // ─── Add node ─────────────────────────────────────────────
  const addNode = useCallback((type) => {
    const id = `${type}-${Date.now()}`
    const cfg = NODE_TYPES_CONFIG[type]
    const newNode = {
      id,
      type,
      position: { x: 300 + Math.random() * 100, y: 300 + Math.random() * 100 },
      data: { type, label: cfg.label, content: '' }
    }
    setNodes(nds => [...nds, newNode])
    setIsDirty(true)
  }, [setNodes])

  // ─── Update node data ─────────────────────────────────────
  const updateNode = useCallback((nodeId, newData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...newData, type: n.type } } : n))
    setIsDirty(true)
    setSelectedNode(null)
  }, [setNodes])

  // ─── Delete node ──────────────────────────────────────────
  const deleteNode = useCallback((nodeId) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setIsDirty(true)
  }, [setNodes, setEdges])

  // ─── Node double click → open editor ─────────────────────
  const onNodeDoubleClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  // ─── Save flow ────────────────────────────────────────────
  const saveFlow = async () => {
    if (!activeFlow) return
    setSaving(true)
    try {
      const flowGraph = {
        nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target,
                                  sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, type: e.type })),
        viewport: {}
      }
      const { error } = await supabase
        .from('agent_flows')
        .update({ flow_graph: flowGraph, version: (activeFlow.version || 1) + 1, updated_at: new Date().toISOString() })
        .eq('id', activeFlow.id)

      if (error) throw error
      setActiveFlow(f => ({ ...f, flow_graph: flowGraph, version: (f.version || 1) + 1 }))
      setFlows(fs => fs.map(f => f.id === activeFlow.id
        ? { ...f, flow_graph: flowGraph, version: (f.version || 1) + 1 } : f))
      setIsDirty(false)
      toast.success('Flux sauvegardé ✓')
    } catch (err) {
      toast.error('Erreur sauvegarde : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── Activate flow ────────────────────────────────────────
  const activateFlow = async () => {
    if (!activeFlow || !agent) return
    setActivating(true)
    try {
      // Save first
      await saveFlow()
      // Deactivate all flows for this agent
      await supabase.from('agent_flows')
        .update({ is_active: false }).eq('agent_id', agent.id)
      // Activate current
      await supabase.from('agent_flows')
        .update({ is_active: true, published_at: new Date().toISOString() }).eq('id', activeFlow.id)

      setFlows(fs => fs.map(f => ({ ...f, is_active: f.id === activeFlow.id })))
      setActiveFlow(f => ({ ...f, is_active: true, published_at: new Date().toISOString() }))
      toast.success('✅ Flux activé — Ama utilise maintenant ce flux')
    } catch (err) {
      toast.error('Erreur activation : ' + err.message)
    } finally {
      setActivating(false)
    }
  }

  // ─── Create new flow ──────────────────────────────────────
  const createNewFlow = async () => {
    if (!agent) return
    const name = prompt('Nom du nouveau flux :')
    if (!name) return
    try {
      const { data, error } = await supabase.from('agent_flows').insert({
        agent_id: agent.id,
        tenant_id: tenant.id,
        name,
        flow_graph: { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES, viewport: {} },
        variables_schema: {},
        is_active: false,
        version: 1
      }).select().single()

      if (error) throw error
      setFlows(fs => [data, ...fs])
      loadFlow(data)
      toast.success('Nouveau flux créé')
    } catch (err) {
      toast.error('Erreur création : ' + err.message)
    }
  }

  // ─── Nodes/edges changes mark dirty ──────────────────────
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    if (changes.some(c => c.type === 'position' && c.dragging === false)) setIsDirty(true)
  }, [onNodesChange])

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes)
    if (changes.length > 0) setIsDirty(true)
  }, [onEdgesChange])

  // ─── RENDER ───────────────────────────────────────────────
  if (loadingFlows) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={24} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: '#86868b', fontSize: 13 }}>Chargement du Conversation Builder...</span>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '60vh', gap: 12 }}>
        <AlertCircle size={40} style={{ color: '#86868b' }} />
        <div style={{ color: '#1d1d1f', fontSize: 16, fontWeight: 600 }}>Aucun agent trouvé</div>
        <div style={{ color: '#86868b', fontSize: 13 }}>
          Créez un agent dans l'Agent Builder pour accéder au Conversation Builder.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{ padding: '0 0 16px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#1d1d1f', fontSize: 20, fontWeight: 800, margin: 0 }}>
            Conversation Builder
          </h1>
          <div style={{ color: '#86868b', fontSize: 12, marginTop: 2 }}>
            Agent <span style={{ color: '#C9A84C', fontWeight: 600 }}>{agent.name}</span>
            {activeFlow?.is_active && (
              <span style={{ marginLeft: 8, color: '#10b981', fontSize: 11,
                             background: '#10b98122', borderRadius: 4, padding: '1px 6px' }}>
                ● ACTIF
              </span>
            )}
            {isDirty && (
              <span style={{ marginLeft: 8, color: '#f59e0b', fontSize: 11,
                             background: '#f59e0b22', borderRadius: 4, padding: '1px 6px' }}>
                ● Non sauvegardé
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <FlowSelector
            flows={flows}
            activeFlow={activeFlow}
            onSelect={loadFlow}
            onNew={createNewFlow}
            loading={loadingFlows}
          />
          <button onClick={saveFlow} disabled={saving || !isDirty}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: isDirty ? '#d2d2d7' : '#ffffff', border: '1px solid #aeaeb2',
              borderRadius: 8, color: isDirty ? '#1d1d1f' : '#aeaeb2',
              fontSize: 12, fontWeight: 600, cursor: isDirty ? 'pointer' : 'default'
            }}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
            Sauvegarder
          </button>
          <button onClick={activateFlow} disabled={activating || activeFlow?.is_active}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: activeFlow?.is_active ? '#10b98122' : '#C9A84C',
              border: 'none', borderRadius: 8,
              color: activeFlow?.is_active ? '#10b981' : '#ffffff',
              fontSize: 12, fontWeight: 700, cursor: activeFlow?.is_active ? 'default' : 'pointer'
            }}>
            {activating
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Play size={13} />}
            {activeFlow?.is_active ? 'Flux actif' : 'Activer'}
          </button>
          <button onClick={() => setShowPalette(p => !p)}
            style={{ padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7',
                     borderRadius: 8, color: '#86868b', cursor: 'pointer', display: 'flex' }}>
            {showPalette ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden',
                    border: '1px solid #d2d2d7', background: '#f5f5f7' }}
           ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{ type: 'default', markerEnd: { type: 'arrowclosed', color: '#aeaeb2' } }}
          style={{ background: '#f5f5f7' }}
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="#e8e8ed" gap={20} size={1} />
          <Controls
            style={{ background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8 }}
            showInteractive={false}
          />
          <MiniMap
            style={{ background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8 }}
            nodeColor={node => NODE_TYPES_CONFIG[node.type]?.color || '#d2d2d7'}
            maskColor="rgba(245,245,247,0.7)"
          />

          {/* Palette panel */}
          {showPalette && (
            <Panel position="top-left" style={{ marginTop: 8, marginLeft: 8 }}>
              <NodePalette onAdd={addNode} />
            </Panel>
          )}

          {/* Help hint */}
          <Panel position="bottom-left" style={{ marginBottom: 8, marginLeft: 8 }}>
            <div style={{ background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 8,
                          padding: '6px 10px', color: '#aeaeb2', fontSize: 10 }}>
              Double-clic sur un noeud pour le configurer · Glisser pour connecter
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* ── Node Editor Modal ── */}
      {selectedNode && (
        <NodeEditor
          node={selectedNode}
          onUpdate={updateNode}
          onDelete={deleteNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
