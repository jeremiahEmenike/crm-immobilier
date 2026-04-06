-- ============================================================
-- CERBERUS AI — Migration v3.0 : Multi-Agent Platform
-- Run in Supabase SQL Editor (in order)
-- ============================================================

-- ─── 0. Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── 1. Table: agents ───────────────────────────────────────
-- Un tenant peut avoir plusieurs agents IA
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  avatar_url    TEXT,
  sector        VARCHAR(50) NOT NULL DEFAULT 'real_estate',
  language      VARCHAR(10)[] DEFAULT ARRAY['fr'],
  tone          VARCHAR(50) DEFAULT 'professional',
  system_prompt TEXT,
  persona_instructions TEXT,
  model         VARCHAR(50) DEFAULT 'gpt-4.1-mini',
  is_active     BOOLEAN DEFAULT true,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_tenant ON agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_sector ON agents(sector);

-- RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents_tenant_isolation" ON agents
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ─── 2. Table: agent_flows ──────────────────────────────────
-- Flux conversationnels par agent (React Flow graph)
CREATE TABLE IF NOT EXISTS agent_flows (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL,
  description      TEXT,
  flow_graph       JSONB DEFAULT '{"nodes":[],"edges":[],"viewport":{}}',
  variables_schema JSONB DEFAULT '{}',
  is_active        BOOLEAN DEFAULT false,
  version          INTEGER DEFAULT 1,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_flows_agent ON agent_flows(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_flows_tenant ON agent_flows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_flows_active ON agent_flows(agent_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE agent_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_flows_tenant_isolation" ON agent_flows
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ─── 3. Table: lead_sessions ────────────────────────────────
-- Session d'exécution du flow pour chaque lead
CREATE TABLE IF NOT EXISTS lead_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id            UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id           UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  flow_id            UUID NOT NULL REFERENCES agent_flows(id) ON DELETE CASCADE,
  tenant_id          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  current_node_id    VARCHAR(200),
  flow_state         JSONB DEFAULT '{}',
  history            JSONB DEFAULT '[]',
  status             VARCHAR(30) DEFAULT 'active',
  started_at         TIMESTAMPTZ DEFAULT now(),
  last_interaction_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_sessions_lead ON lead_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_sessions_agent ON lead_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_sessions_tenant ON lead_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_sessions_status ON lead_sessions(status) WHERE status = 'active';

-- RLS
ALTER TABLE lead_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_sessions_tenant_isolation" ON lead_sessions
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ─── 4. Table: sector_templates ─────────────────────────────
-- Templates pré-configurés par secteur (seed data)
CREATE TABLE IF NOT EXISTS sector_templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector                VARCHAR(50) NOT NULL,
  name                  VARCHAR(200) NOT NULL,
  description           TEXT,
  default_flow_graph    JSONB DEFAULT '{}',
  default_system_prompt TEXT,
  default_scoring_rules JSONB DEFAULT '{}',
  default_variables     JSONB DEFAULT '{}',
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sector_templates_sector ON sector_templates(sector);

-- sector_templates is read-only for all authenticated users (no tenant isolation needed)
ALTER TABLE sector_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sector_templates_read" ON sector_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 5. Table: integrations ─────────────────────────────────
-- Connexions OAuth/API par tenant
CREATE TABLE IF NOT EXISTS integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id     UUID REFERENCES agents(id) ON DELETE SET NULL,
  type         VARCHAR(100) NOT NULL,
  name         VARCHAR(200) NOT NULL,
  credentials  JSONB DEFAULT '{}',
  config       JSONB DEFAULT '{}',
  status       VARCHAR(30) DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_tenant_isolation" ON integrations
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ─── 6. Table: audit_logs ───────────────────────────────────
-- Traçabilité des actions sensibles
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id),
  agent_id   UUID REFERENCES agents(id),
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(100),
  entity_id  UUID,
  details    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_tenant_isolation" ON audit_logs
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- ─── 7. Alter existing tables for multi-agent ───────────────

-- tenants: add sector + onboarding
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS default_sector VARCHAR(50) DEFAULT 'real_estate';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- leads: link to agent + session
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES lead_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(agent_id);

-- users: add avatar + prefs
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- whatsapp_numbers: link to agent
ALTER TABLE whatsapp_numbers ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

-- conversations: link to agent
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_id);

-- ─── 8. Seed: sector_templates ──────────────────────────────

INSERT INTO sector_templates (sector, name, description, default_system_prompt, default_flow_graph, default_scoring_rules, default_variables)
VALUES
-- Immobilier
('real_estate', 'Qualification Immobilier Standard', 'Flux de qualification leads immobilier avec scoring 4 axes',
 'Tu es un assistant immobilier professionnel. Tu qualifies les prospects en identifiant leur budget, zone préférée, type de bien recherché et urgence. Sois chaleureux et précis.',
 '{"nodes":[{"id":"start-1","type":"start","position":{"x":250,"y":50},"data":{"type":"start","label":"Début","content":"Nouveau message WhatsApp"}},{"id":"msg-1","type":"message","position":{"x":250,"y":180},"data":{"type":"message","label":"Accueil","content":"Bonjour ! Je suis votre assistant immobilier. Comment puis-je vous aider ?"}},{"id":"q-budget","type":"question","position":{"x":250,"y":320},"data":{"type":"question","label":"Budget","content":"Quel est votre budget approximatif ?","variable":"budget"}},{"id":"q-zone","type":"question","position":{"x":250,"y":460},"data":{"type":"question","label":"Zone","content":"Quelle zone vous intéresse ?","variable":"zone"}},{"id":"q-type","type":"question","position":{"x":250,"y":600},"data":{"type":"question","label":"Type bien","content":"Quel type de bien recherchez-vous ?","variable":"property_type"}},{"id":"ai-qualify","type":"ai_response","position":{"x":250,"y":740},"data":{"type":"ai_response","label":"Qualification IA","content":"Qualifier le lead selon ses réponses et proposer des biens correspondants"}},{"id":"end-1","type":"end","position":{"x":250,"y":880},"data":{"type":"end","label":"Fin","content":"Marquer comme Qualified"}}],"edges":[{"id":"e1","source":"start-1","target":"msg-1"},{"id":"e2","source":"msg-1","target":"q-budget"},{"id":"e3","source":"q-budget","target":"q-zone"},{"id":"e4","source":"q-zone","target":"q-type"},{"id":"e5","source":"q-type","target":"ai-qualify"},{"id":"e6","source":"ai-qualify","target":"end-1"}],"viewport":{}}',
 '{"axes":["engagement","ciblage","pret_acheter","qualification"],"max_score":20}',
 '{"budget":"","zone":"","property_type":"","urgency":"","rooms":""}'),

-- E-commerce
('ecommerce', 'Support & Conversion E-commerce', 'Flux de support client et conversion pour boutiques en ligne',
 'Tu es un assistant e-commerce. Tu aides les clients avec leurs commandes, recommandes des produits et relances les paniers abandonnés. Sois réactif et commercial.',
 '{"nodes":[{"id":"start-1","type":"start","position":{"x":250,"y":50},"data":{"type":"start","label":"Début","content":"Nouveau message client"}},{"id":"ai-intent","type":"ai_response","position":{"x":250,"y":180},"data":{"type":"ai_response","label":"Détection intent","content":"Identifier l''intention du client : suivi commande, question produit, réclamation, ou achat"}},{"id":"cond-intent","type":"condition","position":{"x":250,"y":320},"data":{"type":"condition","label":"Type demande","content":"{{intent}} == order_tracking","variable":"intent"}},{"id":"action-order","type":"action","position":{"x":50,"y":460},"data":{"type":"action","label":"Suivi commande","content":"Rechercher la commande dans Shopify et donner le statut"}},{"id":"ai-recommend","type":"ai_response","position":{"x":450,"y":460},"data":{"type":"ai_response","label":"Recommandation","content":"Recommander des produits selon les préférences du client"}},{"id":"end-1","type":"end","position":{"x":250,"y":600},"data":{"type":"end","label":"Fin","content":"Clore la conversation"}}],"edges":[{"id":"e1","source":"start-1","target":"ai-intent"},{"id":"e2","source":"ai-intent","target":"cond-intent"},{"id":"e3","source":"cond-intent","target":"action-order","sourceHandle":"true"},{"id":"e4","source":"cond-intent","target":"ai-recommend","sourceHandle":"false"},{"id":"e5","source":"action-order","target":"end-1"},{"id":"e6","source":"ai-recommend","target":"end-1"}],"viewport":{}}',
 '{"axes":["intent_achat","panier","recurrence","engagement"],"max_score":20}',
 '{"intent":"","order_id":"","cart_value":"","product_interest":""}'),

-- Médical
('medical', 'Prise de RDV & Pré-consultation', 'Flux de prise de rendez-vous et pré-consultation pour cliniques',
 'Tu es un assistant médical professionnel. Tu aides les patients à prendre rendez-vous, recueilles les informations de pré-consultation et gères les rappels. Sois empathique et rassurant.',
 '{"nodes":[{"id":"start-1","type":"start","position":{"x":250,"y":50},"data":{"type":"start","label":"Début","content":"Nouveau message patient"}},{"id":"msg-1","type":"message","position":{"x":250,"y":180},"data":{"type":"message","label":"Accueil","content":"Bonjour ! Je suis l''assistant de la clinique. Comment puis-je vous aider ?"}},{"id":"q-motif","type":"question","position":{"x":250,"y":320},"data":{"type":"question","label":"Motif","content":"Quel est le motif de votre consultation ?","variable":"motif"}},{"id":"q-urgence","type":"question","position":{"x":250,"y":460},"data":{"type":"question","label":"Urgence","content":"Est-ce urgent ? Depuis quand avez-vous ces symptômes ?","variable":"urgence"}},{"id":"integration-cal","type":"integration","position":{"x":250,"y":600},"data":{"type":"integration","label":"Calendrier","content":"Vérifier les créneaux disponibles dans Google Calendar"}},{"id":"ai-confirm","type":"ai_response","position":{"x":250,"y":740},"data":{"type":"ai_response","label":"Confirmation","content":"Confirmer le RDV et donner les instructions de pré-consultation"}},{"id":"end-1","type":"end","position":{"x":250,"y":880},"data":{"type":"end","label":"Fin","content":"RDV confirmé"}}],"edges":[{"id":"e1","source":"start-1","target":"msg-1"},{"id":"e2","source":"msg-1","target":"q-motif"},{"id":"e3","source":"q-motif","target":"q-urgence"},{"id":"e4","source":"q-urgence","target":"integration-cal"},{"id":"e5","source":"integration-cal","target":"ai-confirm"},{"id":"e6","source":"ai-confirm","target":"end-1"}],"viewport":{}}',
 '{"axes":["urgence","completude_infos","assurance","engagement"],"max_score":20}',
 '{"motif":"","urgence":"","assurance":"","medecin_pref":"","allergies":""}'),

-- Restaurant
('restaurant', 'Commandes & Réservations Restaurant', 'Flux de prise de commande et réservation pour restaurants',
 'Tu es un assistant de restaurant. Tu prends les commandes, gères les réservations et informes sur le menu. Sois convivial et efficace.',
 '{"nodes":[{"id":"start-1","type":"start","position":{"x":250,"y":50},"data":{"type":"start","label":"Début","content":"Nouveau message client"}},{"id":"ai-intent","type":"ai_response","position":{"x":250,"y":180},"data":{"type":"ai_response","label":"Détection","content":"Identifier : commande, réservation, ou question menu"}},{"id":"cond-type","type":"condition","position":{"x":250,"y":320},"data":{"type":"condition","label":"Type","content":"{{intent}} == reservation","variable":"intent"}},{"id":"q-date","type":"question","position":{"x":50,"y":460},"data":{"type":"question","label":"Date résa","content":"Pour quelle date et combien de personnes ?","variable":"reservation_date"}},{"id":"q-commande","type":"question","position":{"x":450,"y":460},"data":{"type":"question","label":"Commande","content":"Que souhaitez-vous commander ?","variable":"order_items"}},{"id":"ai-confirm","type":"ai_response","position":{"x":250,"y":600},"data":{"type":"ai_response","label":"Confirmation","content":"Confirmer la commande/réservation avec récapitulatif"}},{"id":"end-1","type":"end","position":{"x":250,"y":740},"data":{"type":"end","label":"Fin","content":"Commande/réservation confirmée"}}],"edges":[{"id":"e1","source":"start-1","target":"ai-intent"},{"id":"e2","source":"ai-intent","target":"cond-type"},{"id":"e3","source":"cond-type","target":"q-date","sourceHandle":"true"},{"id":"e4","source":"cond-type","target":"q-commande","sourceHandle":"false"},{"id":"e5","source":"q-date","target":"ai-confirm"},{"id":"e6","source":"q-commande","target":"ai-confirm"},{"id":"e7","source":"ai-confirm","target":"end-1"}],"viewport":{}}',
 '{"axes":["frequence","taille_commande","fidelite","engagement"],"max_score":20}',
 '{"intent":"","order_items":"","reservation_date":"","party_size":"","special_requests":""}')
ON CONFLICT DO NOTHING;

-- ─── 9. Helper function: auto-create agent on tenant creation ─
CREATE OR REPLACE FUNCTION create_default_agent()
RETURNS TRIGGER AS $$
DECLARE
  tmpl sector_templates%ROWTYPE;
  new_agent_id UUID;
BEGIN
  -- Get template for tenant's sector
  SELECT * INTO tmpl FROM sector_templates
    WHERE sector = COALESCE(NEW.default_sector, 'real_estate') AND is_active = true
    LIMIT 1;

  -- Create default agent
  INSERT INTO agents (tenant_id, name, sector, system_prompt, language, tone)
  VALUES (
    NEW.id,
    CASE NEW.default_sector
      WHEN 'ecommerce' THEN 'Assistant E-commerce'
      WHEN 'medical' THEN 'Dr. Assistant'
      WHEN 'restaurant' THEN 'Assistant Restaurant'
      ELSE 'Ama'
    END,
    COALESCE(NEW.default_sector, 'real_estate'),
    COALESCE(tmpl.default_system_prompt, 'Tu es un assistant IA professionnel.'),
    ARRAY['fr'],
    'professional'
  )
  RETURNING id INTO new_agent_id;

  -- Create default flow from template
  IF tmpl.id IS NOT NULL THEN
    INSERT INTO agent_flows (agent_id, tenant_id, name, flow_graph, variables_schema, is_active, version)
    VALUES (
      new_agent_id,
      NEW.id,
      tmpl.name,
      tmpl.default_flow_graph,
      tmpl.default_variables,
      true,
      1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create agent after tenant insert
DROP TRIGGER IF EXISTS trg_create_default_agent ON tenants;
CREATE TRIGGER trg_create_default_agent
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION create_default_agent();

-- ─── 10. RPC: get_or_create_lead_session ─────────────────────
-- Called by the n8n Flow Engine to load/create a session
CREATE OR REPLACE FUNCTION get_or_create_lead_session(
  p_lead_id  UUID,
  p_agent_id UUID,
  p_tenant_id UUID
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_flow_id UUID;
BEGIN
  -- Check for existing active session
  SELECT id INTO v_session_id
    FROM lead_sessions
    WHERE lead_id = p_lead_id AND agent_id = p_agent_id AND status = 'active'
    LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    UPDATE lead_sessions SET last_interaction_at = now() WHERE id = v_session_id;
    RETURN v_session_id;
  END IF;

  -- Get the active flow for this agent
  SELECT id INTO v_flow_id
    FROM agent_flows
    WHERE agent_id = p_agent_id AND is_active = true
    LIMIT 1;

  IF v_flow_id IS NULL THEN
    RAISE EXCEPTION 'No active flow for agent %', p_agent_id;
  END IF;

  -- Create new session
  INSERT INTO lead_sessions (lead_id, agent_id, flow_id, tenant_id, status)
  VALUES (p_lead_id, p_agent_id, v_flow_id, p_tenant_id, 'active')
  RETURNING id INTO v_session_id;

  -- Link session to lead
  UPDATE leads SET session_id = v_session_id, agent_id = p_agent_id WHERE id = p_lead_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 11. RPC: update_session_state ──────────────────────────
-- Called by the n8n Flow Engine to persist state after each node
CREATE OR REPLACE FUNCTION update_session_state(
  p_session_id    UUID,
  p_node_id       VARCHAR,
  p_flow_state    JSONB,
  p_history_entry JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE lead_sessions
  SET
    current_node_id = p_node_id,
    flow_state = p_flow_state,
    history = COALESCE(history, '[]'::jsonb) || p_history_entry,
    last_interaction_at = now(),
    status = CASE WHEN p_node_id IS NULL THEN 'completed' ELSE status END
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 12. Done ───────────────────────────────────────────────
-- After running this migration:
-- 1. Existing tenants need manual agent creation (run seed_existing_tenants.sql)
-- 2. New tenants will auto-get an agent + flow via the trigger
-- 3. Run the CRM app — the Agent Builder page will manage agents
-- 4. The Flow Engine in n8n calls get_or_create_lead_session + update_session_state
