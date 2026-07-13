import { useAuthStore } from '../store/authStore'
import { supabase }     from '../lib/supabase'

export function useAuth() {
  const { usuario, cargando, signOut } = useAuthStore()

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signUp = async (email: string, password: string, username: string, nombre: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (data.user) {
      // Registrar en nuestra base de datos
      await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: data.user.id, email, username, nombre }),
      })
    }
  }

  const signInWithGoogle = async () => {
    const redirectTo = import.meta.env.VITE_AUTH_REDIRECT_URL || `${window.location.origin}/auth`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        flowType: 'pkce',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      } as any
    })

    if (error) {
      throw new Error(error.message || 'No se pudo iniciar sesión con Google')
    }

    if (data?.url) {
      window.location.replace(data.url)
      return
    }

    throw new Error('No se pudo iniciar sesión con Google')
  }

  return { usuario, cargando, signIn, signUp, signInWithGoogle, signOut, estaAutenticado: !!usuario }
}
