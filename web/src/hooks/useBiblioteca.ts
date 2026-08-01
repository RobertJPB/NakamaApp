import { useState, useEffect, useCallback } from 'react'
import { api, getCached } from '../lib/axios'

export function useBiblioteca(usuarioId: string | null) {
  const [lista,    setLista]    = useState<any[]>(() => {
    if (!usuarioId) return []
    return getCached(`/api/biblioteca/${usuarioId}`)?.lista ?? []
  })
  const [stats,    setStats]    = useState<any>(() => {
    if (!usuarioId) return null
    return getCached(`/api/biblioteca/${usuarioId}/stats`)?.stats ?? null
  })
  const [columnas, setColumnas] = useState<any[]>(() => {
    if (!usuarioId) return []
    return getCached(`/api/biblioteca/${usuarioId}/columnas`)?.columnas ?? []
  })
  const [cargando, setCargando] = useState(() => {
    if (!usuarioId) return false
    // Only show loading if nothing is cached
    return !getCached(`/api/biblioteca/${usuarioId}`)
  })

  const cargar = useCallback(() => {
    if (!usuarioId) return
    setCargando(true)
    const timeout = setTimeout(() => setCargando(false), 5000)
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
      .finally(() => {
        setCargando(false)
        clearTimeout(timeout)
      })
  }, [usuarioId])

  useEffect(() => { cargar() }, [cargar])

  const agregar = async (animeId: string, estado: string, propietarioId?: string) => {
    await api.post('/api/biblioteca', { animeId, estado, propietarioId })
    cargar()
  }

  const actualizar = async (animeId: string, datos: any, propietarioId?: string) => {
    await api.put(`/api/biblioteca/${animeId}`, { ...datos, propietarioId })
    cargar()
  }

  const eliminar = async (animeId: string, propietarioId?: string, estado?: string) => {
    await api.delete(`/api/biblioteca/${animeId}`, { data: { propietarioId, estado } })
    cargar()
  }

  const toggleFavorito = async (animeId: string) => {
    const res = await api.post(`/api/biblioteca/${animeId}/favorito`)
    cargar()
    return res.data.esFavorito
  }

  const crearLista = async (datos: { nombre: string; descripcion?: string; imagenUrl?: string }) => {
    await api.post('/api/biblioteca/columnas', datos)
    cargar()
  }

  const editarLista = async (columnaId: string, datos: { nombre?: string; descripcion?: string; imagenUrl?: string; esPrivada?: boolean }) => {
    await api.put(`/api/biblioteca/columnas/${columnaId}`, datos)
    cargar()
  }

  return { lista, columnas, stats, cargando, agregar, actualizar, eliminar, toggleFavorito, crearLista, editarLista }
}
