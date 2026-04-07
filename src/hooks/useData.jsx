import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── Tenant + Agent Context ────────────────
const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null) // users table record
  const [authLoading, setAuthLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [activeAgent, setActiveAgent] = useState(null)
  const loadingRef = useRef(false) // prevent double loadTenant calls

  // Listen to auth state
  useEffect(() => {
    const handleAuth = async (session) => {
      if (session?.user) {
        // Skip if already loading tenant for this session (prevents race condition)
        if (loadingRef.current) return
        loadingRef.current = true

        setAuthUser(session.user)
        setAuthLoading(true)
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name
        await loadTenant(session.user, name)

        loadingRef.current = false
        // Clean OAuth hash from URL
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      } else {
        loadingRef.current = false
        setAuthUser(null)
        setTenant(null)
        setCurrentUser(null)
        setAuthLoading(false)
      }
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session)
    })

    // Auth state changes (sign-in, sign-out — skip token refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return
      if (event === 'SIGNED_OUT') {
        handleAuth(null)
      } else {
        handleAuth(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ─── get_or_create_tenant: deduplication logic ────
  // 1. Check tenants by email
  // 2. Check users by auth_user_id → follow tenant_id
  // 3. Check users by email → follow tenant_id
  // 4. Only create new tenant if ALL checks fail
const loadTenant = async (authUserObj, userName) => {
  const email = authUserObj.email
  const authUid = authUserObj.id
  let foundTenant = null

  try {
    // Step 1: Direct match on tenants.email
    const { data: byEmail, error: emailErr } = await supabase
      .from('tenants')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    if (emailErr) console.error('RLS: tenants select by email failed:', emailErr.message)
    if (byEmail) foundTenant = byEmail

    // Step 2: Check users.auth_user_id → tenant
    if (!foundTenant) {
      const { data: userByAuth, error: authErr } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', authUid)
        .maybeSingle()
      if (authErr) console.error('RLS: users select by auth_user_id failed:', authErr.message)
      if (userByAuth) {
        const { data: t } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userByAuth.tenant_id)
          .single()
        if (t) foundTenant = t
      }
    }

    // Step 3: Check users.email → tenant
    if (!foundTenant) {
      const { data: userByEmail, error: userEmailErr } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('email', email)
        .maybeSingle()
      if (userEmailErr) console.error('RLS: users select by email failed:', userEmailErr.message)
      if (userByEmail) {
        const { data: t } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userByEmail.tenant_id)
          .single()
        if (t) foundTenant = t
      }
    }

    // Step 4: No match → create new tenant
    if (!foundTenant) {
      const name = userName || email.split('@')[0]
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({ name, email, city: 'Lomé' })
        .select()
        .single()

      if (tenantError) {
        console.error("Supabase insert tenant error:", tenantError)
        console.error("Full error object:", JSON.stringify(tenantError, null, 2))
        setTenant(null)
        setAuthLoading(false)
        return
      }
      foundTenant = newTenant   // ← CRUCIAL : assigner le nouveau tenant
    }

    // Maintenant, foundTenant existe toujours
    setTenant(foundTenant)
    await loadOrCreateUser(foundTenant.id, authUid, email, userName)
    await loadAgents(foundTenant.id)

  } catch (err) {
    console.error('loadTenant error:', err)
    setTenant(null)
  }
  setAuthLoading(false)
}

  // ─── Load agents for tenant ─────────────────────
  const loadAgents = async (tenantId) => {
    try {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })

      const agentList = data || []
      setAgents(agentList)
      // Auto-select first active agent
      const active = agentList.find(a => a.is_active) || agentList[0]
      if (active) setActiveAgent(active)
    } catch (err) {
      console.error('loadAgents error:', err)
    }
  }

  const refreshAgents = async () => {
    if (tenant?.id) await loadAgents(tenant.id)
  }

  // ─── Bridge: find or create users record for CRM user ────
  const loadOrCreateUser = async (tenantId, authUid, email, name) => {
    try {
      // 1. Try by auth_user_id first (fastest, unique)
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUid)
        .single()

      if (user) {
        setCurrentUser(user)
        return
      }

      // 2. Try by email within tenant
      const { data: byEmail } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('email', email)
        .single()

      if (byEmail) {
        // Link auth_user_id for future fast lookups
        await supabase.from('users').update({ auth_user_id: authUid }).eq('id', byEmail.id)
        setCurrentUser({ ...byEmail, auth_user_id: authUid })
        return
      }

      // 3. No user found — create one (admin role for first user of tenant)
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      const role = count === 0 ? 'admin' : 'agent'

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          tenant_id: tenantId,
          auth_user_id: authUid,
          email,
          name: name || email.split('@')[0],
          role,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        setCurrentUser(null)
      } else {
        setCurrentUser(newUser)
      }
    } catch (err) {
      console.error('loadOrCreateUser error:', err)
      setCurrentUser(null)
    }
  }

  // Email + Password login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  }

  // Email + Password signup
  const signup = async ({ name, email, password, city }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, city } }
    })
    if (authError) throw new Error(authError.message)

    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', email)
      .single()

    if (!existing) {
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({ name, email, city: city || 'Lomé' })
      if (tenantError) throw new Error(tenantError.message)
    }

    return authData
  }

  // Google OAuth
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw new Error(error.message)
  }

  // Password reset
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    })
    if (error) throw new Error(error.message)
  }

  // Logout
  const logout = async () => {
    await supabase.auth.signOut()
    setTenant(null)
    setAuthUser(null)
    setCurrentUser(null)
    setAgents([])
    setActiveAgent(null)
  }

  return (
    <TenantContext.Provider value={{
      tenant, authUser, currentUser, authLoading,
      agents, activeAgent, setActiveAgent, refreshAgents,
      login, signup, loginWithGoogle, resetPassword, logout
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => useContext(TenantContext)

// ─── Data Hook ─────────────────────────────
export function useCRMData() {
  const { tenant } = useTenant()
  const [data, setData] = useState({ properties: [], leads: [], visits: [], faqs: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!tenant) return
    setLoading(true)
    setError(null)

    try {
      const [properties, leads, visits, faqs] = await Promise.all([
        supabase.from('properties').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
        supabase.from('leads').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
        supabase.from('visits').select('*').eq('tenant_id', tenant.id).order('scheduled_at', { ascending: false }),
        supabase.from('faqs').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
      ])

      setData({
        properties: properties.data || [],
        leads: leads.data || [],
        visits: visits.data || [],
        faqs: faqs.data || [],
      })
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }, [tenant])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, error, refresh }
}

// ─── CRUD Helpers ──────────────────────────
export function useCRUD(table) {
  const { tenant } = useTenant()

  const create = async (payload) => {
    const { data, error } = await supabase
      .from(table)
      .insert({ ...payload, tenant_id: tenant.id })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  const update = async (id, payload) => {
    const { data, error } = await supabase
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  const remove = async (id) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  return { create, update, remove }
}
