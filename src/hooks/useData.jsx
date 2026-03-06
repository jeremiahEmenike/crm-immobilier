import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ─── Tenant Context ────────────────────────
const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Listen to auth state
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user)
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name
        loadTenant(session.user.email, name)
      } else {
        setAuthLoading(false)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user)
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name
        loadTenant(session.user.email, name)
        // Clean URL hash after OAuth callback
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname)
        }
      } else {
        setAuthUser(null)
        setTenant(null)
        setAuthLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadTenant = async (email, userName) => {
    try {
      // Try to find existing tenant
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('email', email)
        .single()
      
      if (data) {
        setTenant(data)
      } else {
        // Auto-create tenant for Google OAuth users
        const name = userName || email.split('@')[0]
        const { data: newTenant, error } = await supabase
          .from('tenants')
          .insert({ name, email, city: 'Lomé' })
          .select()
          .single()
        
        if (error) {
          console.error('Error creating tenant:', error)
          setTenant(null)
        } else {
          setTenant(newTenant)
        }
      }
    } catch {
      // .single() throws if no row found — auto-create
      try {
        const name = userName || email.split('@')[0]
        const { data: newTenant } = await supabase
          .from('tenants')
          .insert({ name, email, city: 'Lomé' })
          .select()
          .single()
        setTenant(newTenant)
      } catch {
        setTenant(null)
      }
    }
    setAuthLoading(false)
  }

  // Email + Password login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  }

  // Email + Password signup
  const signup = async ({ name, email, password, city }) => {
    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, city } }
    })
    if (authError) throw new Error(authError.message)

    // 2. Create tenant record
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
  }

  return (
    <TenantContext.Provider value={{ tenant, authUser, authLoading, login, signup, loginWithGoogle, resetPassword, logout }}>
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
