import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/axios'

export type EstadoLista = 'viendo' | 'completado' | 'pendiente' | 'en_pausa' | 'abandonado'

export function useBiblioteca(usuarioId: string | null) {
  const [lista,    setLista]    = useState<any[]>([])
  const [stats,    setStats]    = useState<any>(null)
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(() => {
    if (!usuarioId) return
    setCargando(true)
    Promise.all([
      api.get(`/api/biblioteca/${usuarioId}`),
      api.get(`/api/biblioteca/${usuarioId}/stats`),
    ])
      .then(([lista, stats]) => {
        setLista(lista.data.lista ?? [])
        setStats(stats.data.stats ?? {})
      })
      .finally(() => setCargando(false))
  }, [usuarioId])

  useEffect(() => { cargar() }, [cargar])

  const agregar = async (animeId: string, estado: EstadoLista) => {
    await api.post('/api/biblioteca', { animeId, estado })
    cargar()
  }

  const actualizar = async (animeId: string, datos: any) => {
    await api.put(`/api/biblioteca/${animeId}`, datos)
    cargar()
  }

  const eliminar = async (animeId: string) => {
    await api.delete(`/api/biblioteca/${animeId}`)
    cargar()
  }

  return { lista, stats, cargando, agregar, actualizar, eliminar }
}
