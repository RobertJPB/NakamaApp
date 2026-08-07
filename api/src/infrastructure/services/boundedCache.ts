interface CacheEntrada<V> {
  data: V
  ts: number
}

export interface ICache<K, V> {
  get(key: K): V | undefined
  set(key: K, data: V): void
  delete(key: K): void
}

/**
 * Caché en memoria con límite de entradas y TTL.
 * Evita que los Maps de resultados crezcan sin control en un servidor de larga duración.
 */
export function crearCacheEnMemoria<K, V>(maxEntradas: number, ttlMs: number): ICache<K, V> {
  const mapa = new Map<K, CacheEntrada<V>>()

  return {
    get(key: K): V | undefined {
      const entrada = mapa.get(key)
      if (!entrada) return undefined
      if (Date.now() - entrada.ts > ttlMs) {
        mapa.delete(key)
        return undefined
      }
      return entrada.data
    },

    set(key: K, data: V): void {
      if (mapa.size >= maxEntradas) {
        const masAntigua = mapa.keys().next().value
        if (masAntigua !== undefined) mapa.delete(masAntigua)
      }
      mapa.set(key, { data, ts: Date.now() })
    },

    delete(key: K): void {
      mapa.delete(key)
    },
  }
}

/** Alias de compatibilidad: caché en memoria sin respaldo Redis. */
export function crearCacheAcotada<K, V>(maxEntradas: number, ttlMs: number): ICache<K, V> {
  return crearCacheEnMemoria<K, V>(maxEntradas, ttlMs)
}
