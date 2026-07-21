import { useState, useEffect } from 'react'
import { api } from '../lib/axios'

export function useAnimePopulares(pagina = 1) {
  const [animes,   setAnimes]   = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    setCargando(true)
    api.get(`/api/animes/populares?page=${pagina}`)
      .then(({ data }) => setAnimes(data))
      .catch(() => setError('No se pudo cargar los animes'))
      .finally(() => setCargando(false))
  }, [pagina])

  return { animes, cargando, error }
}

export function useAnimeDetalle(anilistId: number | null) {
  const [detalle,  setDetalle]  = useState<any | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const fetchDetalle = () => {
    if (!anilistId) return
    setCargando(true)
    api.get(`/api/animes/${anilistId}`)
      .then(({ data }) => setDetalle(data))
      .catch(() => setError('No se pudo cargar el anime'))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    fetchDetalle()
  }, [anilistId])

  return { detalle, cargando, error, recargar: fetchDetalle }
}

export function useBusqueda(query: string) {
  const [resultados, setResultados] = useState<any[]>([])
  const [cargando,   setCargando]   = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResultados([]); return }
    const timeout = setTimeout(() => {
      setCargando(true)
      api.get(`/api/animes?busqueda=${encodeURIComponent(query)}`)
        .then(({ data }) => setResultados(data.animes ?? []))
        .finally(() => setCargando(false))
    }, 400)
    return () => clearTimeout(timeout)
  }, [query])

  return { resultados, cargando }
}
