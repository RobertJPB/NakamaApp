import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/axios'

export function useBiblioteca(usuarioId: string | null) {
  const [lista,    setLista]    = useState<any[]>([])
  const [stats,    setStats]    = useState<any>(null)
  const [columnas, setColumnas] = useState<any[]>([])
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(() => {
    if (!usuarioId) return
    setCargando(true)
    Promise.all([
      api.get(`/api/biblioteca/${usuarioId}`),
      api.get(`/api/biblioteca/${usuarioId}/stats`),
      api.get(`/api/biblioteca/${usuarioId}/columnas`),
    ])
      .then(([listaRes, statsRes, columnasRes]) => {
        setLista(listaRes.data.lista ?? [])
        setStats(statsRes.data.stats ?? {})
        setColumnas(columnasRes.data.columnas ?? [])
      })
      .finally(() => setCargando(false))
  }, [usuarioId])

  useEffect(() => { cargar() }, [cargar])

  const agregar = async (animeId: string, estado: string) => {
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

  const toggleFavorito = async (animeId: string) => {
    const res = await api.post(`/api/biblioteca/${animeId}/favorito`)
    cargar()
    return res.data.esFavorito
  }

  const crearLista = async (data: string | { nombre: string; descripcion?: string; imagenUrl?: string }) => {
    if (!usuarioId) return
    const body = typeof data === 'string' ? { nombre: data } : data
    await api.post('/api/biblioteca/columnas', body)
    cargar()
  }

  return { lista, stats, columnas, cargando, agregar, actualizar, eliminar, toggleFavorito, crearLista }
}
