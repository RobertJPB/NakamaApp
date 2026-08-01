import { useState, useEffect, useRef } from 'react'
import { api, getCached } from '../lib/axios'

/**
 * Stale-While-Revalidate data fetching hook.
 * - Returns cached data IMMEDIATELY (no loading flash on repeat visits)
 * - Fetches fresh data in the background and updates when ready
 * - Shows cargando=true ONLY on the very first fetch (no cached data)
 */
export function useApiQuery<T>(
  url: string | null,
  params?: Record<string, any>,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled !== false

  const getInitialData = (): T | null => {
    if (!url || !enabled) return null
    return getCached(url, params) as T | null
  }

  const [data, setData]       = useState<T | null>(getInitialData)
  const [cargando, setCargando] = useState<boolean>(() => !getInitialData() && !!url && enabled)
  const [error, setError]     = useState<string | null>(null)
  const urlRef                = useRef(url)

  useEffect(() => {
    if (!url || !enabled) return
    urlRef.current = url

    const cached = getCached(url, params)

    // If we have cached data, show it immediately but still revalidate silently
    if (cached) {
      setData(cached as T)
      setCargando(false)
    } else {
      setCargando(true)
    }

    let cancelled = false
    api.get<T>(url, { params })
      .then(res => {
        if (!cancelled && urlRef.current === url) {
          setData(res.data)
          setError(null)
        }
      })
      .catch(err => {
        if (!cancelled && !cached) {
          setError(err.message ?? 'Error al cargar los datos')
        }
      })
      .finally(() => {
        if (!cancelled) setCargando(false)
      })

    return () => { cancelled = true }
  }, [url, JSON.stringify(params), enabled])

  return { data, cargando, error }
}
