import { useState, useEffect, useCallback, useRef } from 'react'
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

export function useAnimeDetalle(externalId: string | null, initialData?: any) {
  const [detalle,  setDetalle]  = useState<any | null>(
    initialData ? { anime: initialData, personajes: [], generos: [], stats: {} } : null
  )
  const [cargando, setCargando] = useState(!initialData)
  const [isFetching, setIsFetching] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const fetchDetalle = () => {
    if (!externalId) return
    
    // Evitar recarga visual (skeleton) si ya tenemos datos
    setDetalle((prev: any) => {
      if (!prev) setCargando(true)
      return prev
    })
    
    setIsFetching(true)
    
    api.get(`/api/animes/${externalId}`)
      .then(({ data }) => setDetalle(data))
      .catch(() => setError('No se pudo cargar el anime'))
      .finally(() => {
        setCargando(false)
        setIsFetching(false)
      })
  }

  useEffect(() => {
    fetchDetalle()
  }, [externalId])

  return { detalle, cargando, isFetching, error, recargar: fetchDetalle }
}

export function prefetchAnimeDetalle(externalId: string) {
  // Petición silenciosa para llenar la caché de axios antes de que el usuario haga clic
  api.get(`/api/animes/${externalId}`).catch(() => {})
}

// Prefetch de detalles cuando una tarjeta está a punto de entrar al viewport (cubre touch/móvil,
// donde no hay hover). Cada elemento debe llevar `data-external-id` y ref={refForCard}.
// maxPrefetch limita las peticiones totales por página para no saturar el backend.
export function usePrefetchAnimeDetalleOnView(maxPrefetch = 12) {
  const observers = useRef(new Map<Element, IntersectionObserver>())
  const prefetched = useRef(new Set<string>())
  const limit = useRef(maxPrefetch)

  const refForCard = useCallback((el: Element | null) => {
    if (!el) return
    const externalId = el.getAttribute('data-external-id')
    if (!externalId || prefetched.current.has(externalId)) return
    if (prefetched.current.size >= limit.current) return

    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && prefetched.current.size < limit.current) {
        prefetched.current.add(externalId)
        prefetchAnimeDetalle(externalId)
        io.disconnect()
        observers.current.delete(el)
      }
    }, { rootMargin: '600px 0px', threshold: 0.01 })

    observers.current.set(el, io)
    io.observe(el)
  }, [])

  useEffect(() => {
    const obs = observers.current
    return () => obs.forEach(o => o.disconnect())
  }, [])

  return refForCard
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
