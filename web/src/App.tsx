import React, { useEffect } from 'react'
import { AppRouter }      from './router'
import { useAuthStore }   from './store/authStore'
import { supabase }       from './lib/supabase'
import './styles/variables.css'

const App: React.FC = () => {
  const setUsuario = useAuthStore(s => s.setUsuario)

  useEffect(() => {
    // Sincronizar sesión de Supabase con el store global
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUsuario(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [setUsuario])

  return <AppRouter />
}

export default App
