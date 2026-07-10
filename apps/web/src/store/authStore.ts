import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface AuthState {
  usuario:    any | null
  cargando:   boolean
  setUsuario: (usuario: any | null) => void
  signOut:    () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario:  null,
  cargando: true,

  setUsuario: (usuario) => set({ usuario, cargando: false }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ usuario: null })
  },
}))
