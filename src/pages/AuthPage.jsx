import { useState } from 'react'
import { useTenant } from '../hooks/useData'
import { Zap, ArrowRight, Mail, Lock, User, MapPin, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const { login, signup, loginWithGoogle, resetPassword } = useTenant()
  const [mode, setMode] = useState('login') // login | signup | forgot
  const [form, setForm] = useState({ name: '', email: '', password: '', city: 'Lomé' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm({ ...form, [k]: v })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        if (!form.email || !form.password) throw new Error('Email et mot de passe requis')
        await login(form.email, form.password)
        toast.success('Bienvenue !')
      } else if (mode === 'signup') {
        if (!form.name || !form.email || !form.password) throw new Error('Tous les champs sont requis')
        if (form.password.length < 6) throw new Error('Le mot de passe doit faire au moins 6 caractères')
        await signup(form)
        toast.success('Compte créé ! Vérifiez votre email pour confirmer.')
      } else if (mode === 'forgot') {
        if (!form.email) throw new Error('Entrez votre email')
        await resetPassword(form.email)
        toast.success('Lien de réinitialisation envoyé par email')
        setMode('login')
      }
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Zap size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold tracking-[3px] text-brand-500 uppercase">Cerberus</div>
              <div className="text-[10px] text-dark-200 tracking-[2px] uppercase">CRM Immobilier</div>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display">
            {mode === 'login' ? 'Connexion' : mode === 'signup' ? 'Créer un compte' : 'Mot de passe oublié'}
          </h1>
          <p className="text-dark-100 text-sm mt-2">
            {mode === 'login' ? 'Accédez à votre espace de gestion' : mode === 'signup' ? 'Inscrivez votre agence immobilière' : 'Recevez un lien de réinitialisation'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
          {/* Google OAuth */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full py-2.5 px-4 rounded-lg border border-dark-400 bg-dark-500 hover:bg-dark-400/50 
                           text-sm font-medium text-dark-50 flex items-center justify-center gap-3 transition-colors mb-5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </button>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-400" /></div>
                <div className="relative flex justify-center"><span className="px-3 bg-dark-600 text-xs text-dark-200">ou</span></div>
              </div>
            </>
          )}

          {/* Back arrow for forgot */}
          {mode === 'forgot' && (
            <button type="button" onClick={() => setMode('login')} className="flex items-center gap-2 text-sm text-dark-100 hover:text-dark-50 mb-5 transition-colors">
              <ArrowLeft size={16} /> Retour à la connexion
            </button>
          )}

          {/* Name field (signup only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="label">Nom de l'agence</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200" />
                <input className="input pl-9" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Eko Immo" required />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200" />
              <input className="input pl-9" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@agence.com" required />
            </div>
          </div>

          {/* Password (not for forgot) */}
          {mode !== 'forgot' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Mot de passe</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[11px] text-brand-500 hover:text-brand-400 transition-colors">
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200" />
                <input className="input pl-9" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              {mode === 'signup' && <p className="text-[11px] text-dark-200 mt-1.5">Minimum 6 caractères</p>}
            </div>
          )}

          {/* City (signup only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="label">Ville</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200" />
                <input className="input pl-9" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lomé" />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle login/signup */}
        {mode !== 'forgot' && (
          <p className="text-center mt-5 text-sm text-dark-100">
            {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-brand-500 font-semibold hover:text-brand-400 transition-colors"
            >
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        )}

        <p className="text-center mt-6 text-[11px] text-dark-200">
          Powered by Cerberus AI Automation · 2026
        </p>
      </div>
    </div>
  )
}
