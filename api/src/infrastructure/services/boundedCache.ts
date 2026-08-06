interface CacheEntrada<V> {
  data: V
  ts: number
}

/**
 * Caché en memoria con límite de entradas y TTL.
 * Evita que los Maps de resultados crezcan sin control en un servidor de larga duración.
 */
export function crearCacheAcotada<K, V>(maxEntradas: number, ttlMs: number) {
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
