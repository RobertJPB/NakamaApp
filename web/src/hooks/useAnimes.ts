import { useState, useEffect } from 'react'
import { api, getCached } from '../lib/axios'

export interface AnimeItem {
  externalId: string
  titulo: string
  tituloIngles?: string
  imagenUrl?: string
  banner?: string
  descripcion?: string
  episodios?: number
  anio?: number
  puntuacion?: number
  calificacionPromedio?: number | string
  generos?: string[]
  estado?: string
  tipo?: string
}

interface UseAnimesResult {
  animes: AnimeItem[]
  cargando: boolean
  error: string | null
  pagina: number
  setPagina: (p: number) => void
  totalPaginas: number
}

export function useAnimes(): UseAnimesResult {
  const [pagina, setPagina]           = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(3)

  const params = { page: pagina, perPage: 24 }

  // Return cached data immediately if available
  const [animes, setAnimes] = useState<AnimeItem[]>(() => {
    return getCached('/api/animes/populares', params) ?? []
  })
  const [cargando, setCargando] = useState(() => {
    return !getCached('/api/animes/populares', params)
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const cached = getCached('/api/animes/populares', params)

    if (cached) {
      setAnimes(cached)
      setCargando(false)
    } else {
      setCargando(true)
      setError(null)
    }

    if (!cached) {
      // Dejamos que la carga natural ocurra. 
      // El backend tiene caché de 5ms, así que solo tardará si el servidor acaba de reiniciarse.
    }

    // Petición real al backend
    api.get<AnimeItem[]>('/api/animes/populares', { params })
      .then((res) => {
        if (cancelled) return
        setAnimes(res.data)
        setTotalPaginas(pagina < 3 ? 3 : pagina + 1)
        setError(null)
        setCargando(false)
      })
      .catch(() => {
        if (cancelled) return
        if (!cached) {
          setError('No se pudo conectar con la API.')
        }
        setCargando(false)
      })

    return () => { 
      cancelled = true; 
    }
  }, [pagina])

  return { animes, cargando, error, pagina, setPagina, totalPaginas }
}
