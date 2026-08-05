import axios from 'axios'
import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000, // 60 second timeout para permitir cold starts en Render
})

// ─── Deduplicación de peticiones en vuelo (para el prefetch) ──────────────
const originalGet = api.get.bind(api)
const inFlightGet = new Map<string, Promise<any>>()

api.get = (url: string, config?: any) => {
  // If there's an abort signal, don't deduplicate, to avoid StrictMode race conditions
  if (config?.signal) {
    return originalGet(url, config)
  }

  const key = url + JSON.stringify(config?.params ?? {})
  if (inFlightGet.has(key)) {
    return inFlightGet.get(key)!
  }
  const promise = originalGet(url, config).finally(() => {
    inFlightGet.delete(key)
  })
  inFlightGet.set(key, promise)
  return promise
}

// ─── Token cache ────────────────────────────────────────────────────────────
let cachedToken: string | null = null
let tokenExpiresAt: number = 0

async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken
  const { data } = await supabase.auth.getSession()
  cachedToken = data.session?.access_token ?? null
  // Supabase tokens expire in ~3600s; cache for 55 minutes to be safe
  tokenExpiresAt = Date.now() + 55 * 60 * 1000
  return cachedToken
}

// Escuchar cambios de sesión para limpiar el token
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    cachedToken = null
    tokenExpiresAt = 0
  } else if (session?.access_token) {
    cachedToken = session.access_token
    tokenExpiresAt = Date.now() + 55 * 60 * 1000
  }
})

// ─── In-memory GET cache ─────────────────────────────────────────────────────
const cache = new Map<string, { data: any; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos — suficiente para que el usuario naviegue sin re-fetches

// Inyectar token de Supabase en cada request y manejar la caché
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Si es un GET y está en caché, bypassear la red devolviendo la caché instantáneamente
  if (config.method === 'get' && config.url) {
    const key = config.url + JSON.stringify(config.params ?? {})
    const entry = cache.get(key)
    if (entry && Date.now() < entry.expiresAt) {
      config.adapter = () => Promise.resolve({
        data: entry.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      } as any)
    }
  }

  return config
})

api.interceptors.response.use(
  (res) => {
    const method = res.config.method?.toLowerCase()
    
    // Invalidar caché en cualquier mutación para mantener todo sincronizado
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      cache.clear()
    }
    // Guardar GETs exitosos en caché
    else if (method === 'get' && res.config.url) {
      const key = res.config.url + JSON.stringify(res.config.params ?? {})
      cache.set(key, { data: res.data, expiresAt: Date.now() + CACHE_TTL })
    }
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      cachedToken = null // invalidate local token cache, but don't force sign out
    }
    if (err.code === 'ECONNABORTED' || !err.response) {
      console.warn('[API] No se pudo conectar con la API:', err.message)
    }
    return Promise.reject(err)
  }
)

// Helper to get cached response before making a request
export function getCached(url: string, params?: any): any | null {
  const key = url + JSON.stringify(params ?? {})
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expiresAt) return entry.data
  return null
}
