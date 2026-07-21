import { useState, useEffect } from 'react'
import { api } from '../lib/axios'

export interface AnimeItem {
  anilistId: number
  titulo: string
  tituloIngles?: string
  imagenUrl?: string
  banner?: string
  descripcion?: string
  episodios?: number
  anio?: number
  puntuacion?: number
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
  const [animes, setAnimes]           = useState<AnimeItem[]>([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [pagina, setPagina]           = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(3)

  useEffect(() => {
    let cancelled = false
    setCargando(true)
    setError(null)

    api
      .get<AnimeItem[]>(`/api/animes/populares`, { params: { page: pagina, perPage: 21 } })
      .then((res) => {
        if (cancelled) return
        const data = res.data
        setAnimes(data)
        // AniList always has more pages; we fix a visible window of 3
        setTotalPaginas(pagina < 3 ? 3 : pagina + 1)
      })
      .catch(() => {
        if (cancelled) return
        setError('No se pudo conectar con la API. Mostrando datos de ejemplo.')
      })
      .finally(() => {
        if (!cancelled) setCargando(false)
      })

    return () => { cancelled = true }
  }, [pagina])

  return { animes, cargando, error, pagina, setPagina, totalPaginas }
}
