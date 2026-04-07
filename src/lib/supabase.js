import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fboiysthyauuaehcflvo.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZib2l5c3RoeWF1dWFlaGNmbHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDQ5NjcsImV4cCI6MjA4NTc4MDk2N30.C-EU6AtM3iCTKAJrIPZTCX6ZqpERDj_ooTJ9DeZSilw'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
