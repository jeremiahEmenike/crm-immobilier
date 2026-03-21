import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ─── Tenant Context ────────────────────────
const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null) // users table record
  const [authLoading, setAuthLoading] = useState(true)

  // Listen to auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user)
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name
        loadTenant(session.user, name)
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user)
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name
        loadTenant(session.user, name)
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      } else {
        setAuthUser(null)
        setTenant(null)
        setCurrentUser(null)
        setAuthLoading(false)
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
      const { data: byEmail } = await supabase
        .from('tenants')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (byEmail) {
        foundTenant = byEmail
      }

      // Step 2: Check users.auth_user_id → tenant
      if (!foundTenant) {
        const { data: userByAuth } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', authUid)
          .maybeSingle()

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
        const { data: userByEmail } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('email', email)
          .maybeSingle()

        if (userByEmail) {
          const { data: t } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', userByEmail.tenant_id)
            .single()
          if (t) foundTenant = t
        }
      }

      // Step 4: No match anywhere → create new tenant (legitimate new agency)
      if (!foundTenant) {
        const name = userName || email.split('@')[0]
        const { data: newTenant, error } = await supabase
          .from('tenants')
          .insert({ name, email, city: 'Lomé' })
          .select()
          .single()

        if (error) {
          console.error('Error creating tenant:', error)
          setTenant(null)
          setAuthLoading(false)
          return
        }
        foundTenant = newTenant
      }

      setTenant(foundTenant)
      await loadOrCreateUser(foundTenant.id, authUid, email, userName)
    } catch (err) {
      console.error('loadTenant error:', err)
      setTenant(null)
    }
    setAuthLoading(false)
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
      options: {
        redirectTo: window.location.origin,
      }
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
  }

  return (
    <TenantContext.Provider value={{
      tenant, authUser, currentUser, authLoading,
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
