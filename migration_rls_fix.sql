-- ============================================================
-- CERBERUS AI — RLS Fix: Auth bootstrap + tenant isolation
--
-- PROBLEM: tenants/users tables have RLS enabled but no policies
-- that allow the initial auth flow (lookup by email, create user record).
-- This causes loadTenant() to fail silently → tenant is null → redirect loop.
--
-- Run in Supabase SQL Editor
-- ============================================================

-- ─── 1. TENANTS TABLE ─────────────────────────────────────
-- The auth flow needs to: SELECT by email, INSERT for new signups,
-- UPDATE for settings changes.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_select_own" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_own" ON tenants;
DROP POLICY IF EXISTS "tenants_update_own" ON tenants;
DROP POLICY IF EXISTS "tenants_delete_own" ON tenants;

-- SELECT: user can find their tenant by email (bootstrap) OR via users linkage (normal)
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (
    email = (auth.jwt() ->> 'email')
    OR id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- INSERT: authenticated user can create a tenant matching their email
CREATE POLICY "tenants_insert_own" ON tenants
  FOR INSERT WITH CHECK (
    email = (auth.jwt() ->> 'email')
  );

-- UPDATE: only through users table linkage (user must be linked first)
CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE USING (
    id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- DELETE: only through users table linkage
CREATE POLICY "tenants_delete_own" ON tenants
  FOR DELETE USING (
    id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );


-- ─── 2. USERS TABLE ──────────────────────────────────────
-- The auth flow needs to: SELECT by auth_user_id or email (bootstrap),
-- INSERT own record, UPDATE own record (link auth_user_id).

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;

-- SELECT: bootstrap by auth_uid or email + see all tenant members after linked
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (
    auth_user_id = auth.uid()
    OR email = (auth.jwt() ->> 'email')
    OR tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- INSERT: can create own user record (auth_user_id must match)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (
    auth_user_id = auth.uid()
  );

-- UPDATE: can update own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (
    auth_user_id = auth.uid()
  );

-- DELETE: can delete own record
CREATE POLICY "users_delete_own" ON users
  FOR DELETE USING (
    auth_user_id = auth.uid()
  );


-- ─── 3. DATA TABLES: standard tenant isolation ───────────
-- These are queried AFTER tenant is loaded, so the users linkage works.

-- Properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "properties_tenant_isolation" ON properties;
CREATE POLICY "properties_tenant_isolation" ON properties
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_tenant_isolation" ON leads;
CREATE POLICY "leads_tenant_isolation" ON leads
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- Visits
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "visits_tenant_isolation" ON visits;
CREATE POLICY "visits_tenant_isolation" ON visits
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- FAQs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faqs_tenant_isolation" ON faqs;
CREATE POLICY "faqs_tenant_isolation" ON faqs
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_tenant_isolation" ON conversations;
CREATE POLICY "conversations_tenant_isolation" ON conversations
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
  );

-- WhatsApp Numbers (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_numbers') THEN
    ALTER TABLE whatsapp_numbers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "whatsapp_numbers_tenant_isolation" ON whatsapp_numbers;
    CREATE POLICY "whatsapp_numbers_tenant_isolation" ON whatsapp_numbers
      FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
      );
  END IF;
END $$;


-- ============================================================
-- HOW IT WORKS:
--
-- 1. User logs in → auth.uid() and auth.jwt()->>'email' are set
-- 2. loadTenant() queries tenants WHERE email = auth.jwt()->>'email' → ALLOWED by tenants_select_own
-- 3. If no tenant found, INSERT into tenants → ALLOWED by tenants_insert_own (email match)
-- 4. loadOrCreateUser() queries users WHERE auth_user_id = auth.uid() → ALLOWED by users_select_own
-- 5. If no user found, INSERT into users → ALLOWED by users_insert_own (auth_user_id match)
-- 6. Now the subquery (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()) works
-- 7. All data table queries with tenant_id isolation work correctly
-- ============================================================
