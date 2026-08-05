import React, { useEffect } from 'react'
import { AppRouter }      from './router'
import { useAuthStore }   from './store/authStore'
import { supabase }       from './lib/supabase'
import { api }            from './lib/axios'
import './styles/variables.css'

// ─── Cache warm-up: fire API calls immediately on module load ─────────────────
// These run before React even renders — by the time the user sees the UI,
// data is already in cache or very close to arriving.
const warmUp = () => {
  const urls = [
    // HomePage (useAnimes hook uses params object, but cache key includes them)
    '/api/animes/populares',
    // DescubrirPage categories (exact URL strings)
    '/api/animes/populares?page=2',
    '/api/animes/populares?genero=Action',
    '/api/animes/populares?genero=Romance',
    '/api/animes/populares?anio=1998',
    // Feed
    '/api/feed',
  ]
  urls.forEach(url => api.get(url).catch(() => {}))
  
  // Ranking (requires specific params to match cache key)
  api.get('/api/ranking', { params: { limit: 100 } }).catch(() => {})
}
warmUp()

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

        // Warm up user-specific data
        const userUrls = [
          `/api/biblioteca/${backendUser.id}`,
          `/api/biblioteca/${backendUser.id}/stats`,
          `/api/biblioteca/${backendUser.id}/columnas`,
          `/api/usuarios/${backendUser.username}`
        ]
        userUrls.forEach(url => api.get(url).catch(() => {}))

      } catch (err) {
        console.error('Error syncing user profile:', err)
        // Fallback robusto para evitar que RequireProfile mande al usuario a /perfil/editar por error de conexión
        if (sessionUser?.user_metadata) {
          const fbName = sessionUser.user_metadata.nombre || sessionUser.user_metadata.full_name || null
          setUsuario({
            ...sessionUser,
            username: sessionUser.user_metadata.username || null,
            nombreDisplay: fbName,
            avatarUrl: sessionUser.user_metadata.avatar || null
          })
        } else {
          setUsuario(sessionUser)
        }
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
