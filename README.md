# Cerberus CRM — Gestion Immobilière

CRM multi-tenant connecté à Supabase pour agences immobilières.  
Produit de Cerberus AI Automation.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS** — design system custom
- **Supabase** — PostgreSQL + pgvector + RLS
- **Framer Motion** — animations
- **Lucide Icons** — iconographie
- **react-hot-toast** — notifications

## Setup

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer Supabase (déjà fait dans .env)
# Modifier .env si besoin

# 3. Lancer en dev
npm run dev

# 4. Build production
npm run build
```

## Déploiement Vercel

```bash
# Option 1 — CLI
npm i -g vercel
vercel

# Option 2 — Dashboard
# Push sur GitHub → Connecter à Vercel → Auto-deploy
```

## Structure

```
src/
├── components/     # UI partagés (Modal, Badge, Layout)
├── hooks/          # useData, useTenant, useCRUD
├── lib/            # Supabase client, constants
├── pages/          # Dashboard, Properties, Leads, Visits, FAQs, Settings
├── App.jsx         # Router principal
└── main.jsx        # Entry point
```

## Architecture

- **Multi-tenant** : chaque agence = 1 tenant isolé dans Supabase (RLS)
- **Bot WhatsApp** : lit les données via Supabase, génère les embeddings
- **Embeddings** : biens + descriptions + FAQs (vector 1536, pgvector)

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon |
