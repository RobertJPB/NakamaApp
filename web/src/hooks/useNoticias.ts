import { useState, useEffect } from 'react'
import { api } from '../lib/axios'

interface Noticia {
  id: string
  titulo: string
  resumen: string
  urlOrigen: string
  imagenUrl: string
  fuente: string
  fechaPublicacion: string
}

export function useNoticias(limit = 5, variant: 'default' | 'popular' = 'default') {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        setCargando(true)
        const endpoint = variant === 'popular' ? '/api/noticias/popular' : `/api/noticias?limit=${limit}`;
        const { data } = await api.get(endpoint)
        setNoticias(data)
      } catch (err) {
        setError(err as Error)
        console.error('Error al cargar noticias', err)
      } finally {
        setCargando(false)
      }
    }

    fetchNoticias()
  }, [limit, variant])

  return { noticias, cargando, error }
}
