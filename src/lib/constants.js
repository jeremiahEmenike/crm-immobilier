// ─── Property Constants ────────────────────
export const PROPERTY_TYPES = ['Appartement', 'Maison', 'Villa', 'Terrain', 'Bureau', 'Commerce', 'Autre']
export const TRANSACTION_TYPES = ['sale', 'rent']
export const PROPERTY_STATUSES = ['available', 'reserved', 'sold', 'rented']

// ─── Lead Constants ────────────────────────
export const PIPELINE_STAGES = ['New', 'Contacted', 'Qualified', 'Matched', 'Visit_Scheduled', 'Won', 'Lost', 'Nurturing']
export const LEAD_SOURCES = ['WhatsApp', 'Site web', 'Téléphone', 'Recommandation', 'Réseaux sociaux', 'Autre']

// ─── Visit Constants ───────────────────────
export const VISIT_STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled']

// ─── FAQ Constants ─────────────────────────
export const FAQ_CATEGORIES = ['Général', 'Paiement', 'Visite', 'Documents', 'Location', 'Vente', 'Processus', 'Autre']

// ─── Label Maps ────────────────────────────
const LABELS = {
  available: 'Disponible', reserved: 'Réservé', sold: 'Vendu', rented: 'Loué',
  sale: 'Vente', rent: 'Location',
  New: 'Nouveau', Contacted: 'Contacté', Qualified: 'Qualifié', Matched: 'Matché',
  Visit_Scheduled: 'Visite planifiée', Won: 'Converti', Lost: 'Perdu', Nurturing: 'Nurturing',
  scheduled: 'Planifié', confirmed: 'Confirmé', completed: 'Effectué', cancelled: 'Annulé',
}

export const label = (key) => LABELS[key] || key

// ─── Status Colors (Tailwind classes) ──────
const STATUS_COLORS = {
  available: 'bg-emerald-500/15 text-emerald-400',
  reserved: 'bg-amber-500/15 text-amber-400',
  sold: 'bg-brand-500/15 text-brand-500',
  rented: 'bg-blue-500/15 text-blue-400',
  New: 'bg-blue-500/15 text-blue-400',
  Contacted: 'bg-dark-100/15 text-dark-100',
  Qualified: 'bg-amber-500/15 text-amber-400',
  Matched: 'bg-brand-500/15 text-brand-500',
  Visit_Scheduled: 'bg-purple-500/15 text-purple-400',
  Won: 'bg-emerald-500/15 text-emerald-400',
  Lost: 'bg-red-500/15 text-red-400',
  Nurturing: 'bg-blue-500/15 text-blue-400',
  scheduled: 'bg-blue-500/15 text-blue-400',
  confirmed: 'bg-amber-500/15 text-amber-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

export const statusColor = (key) => STATUS_COLORS[key] || 'bg-dark-200/15 text-dark-200'

// ─── Formatters ────────────────────────────
export const fmtPrice = (n) => {
  if (!n) return '—'
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const fmtTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  return `${fmtDate(d)} · ${fmtTime(d)}`
}
