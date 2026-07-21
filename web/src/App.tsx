import React, { useEffect } from 'react'
import { AppRouter }      from './router'
import { useAuthStore }   from './store/authStore'
import { supabase }       from './lib/supabase'
import { api }            from './lib/axios'
import './styles/variables.css'

const App: React.FC = () => {
  const setUsuario = useAuthStore(s => s.setUsuario)

  useEffect(() => {
    const syncUsuario = async (sessionUser: any | null) => {
      if (!sessionUser) {
        setUsuario(null)
        return
      }

      try {
        const { data: backendUser } = await api.get('/api/usuarios/me')
        const merged = {
          ...sessionUser,
          ...backendUser,
          user_metadata: {
            ...sessionUser.user_metadata,
            username: backendUser.username,
            nombre: backendUser.nombreDisplay,
            avatar: backendUser.avatarUrl,
          }
        }
        setUsuario(merged)
      } catch (err) {
        console.error('Error syncing user profile:', err)
        setUsuario(sessionUser)
      }
    }

    // Sincronizar sesión de Supabase con el store global
    supabase.auth.getSession().then(({ data }) => {
      syncUsuario(data.session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => syncUsuario(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [setUsuario])

  return <AppRouter />
}

export default App
