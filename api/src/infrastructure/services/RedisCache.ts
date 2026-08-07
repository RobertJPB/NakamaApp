import Redis from 'ioredis'
import { env } from '../../config/env'
import { crearCacheEnMemoria, ICache } from './boundedCache'

/**
 * Caché con respaldo opcional en Redis.
 * - Sin REDIS_URL: comportamiento idéntico a la caché en memoria (nada cambia).
 * - Con REDIS_URL: la caché en memoria sigue respondiendo de forma síncrona
 *   (sin latencia extra por request) y replica escrituras/lecturas a Redis en
 *   segundo plano para que varias instancias compartan resultados.
 *
 * Si Redis no está disponible (conexión fallida o caída), se desactiva en
 * silencio y se continúa solo con la memoria: nunca bloquea ni rompe requests.
 */
export function crearCacheConRespaldoRedis<K, V>(maxEntradas: number, ttlMs: number): ICache<K, V> {
  const memoria = crearCacheEnMemoria<K, V>(maxEntradas, ttlMs)
  const prefijo = 'nakama:cache:'
  const llave = (key: K): string => prefijo + String(key)

  let clienteRedis: Redis | null = null
  let redisHabilitado = Boolean(env.REDIS_URL)
  let conectando: Promise<void> | null = null

  async function conectar(): Promise<void> {
    try {
      const cliente = new Redis(env.REDIS_URL!, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 3000,
      })
      cliente.on('error', () => {
        redisHabilitado = false
        clienteRedis = null
      })
      await cliente.connect()
      clienteRedis = cliente
    } catch {
      redisHabilitado = false
      clienteRedis = null
    }
  }

  function redis(): Redis | null {
    if (!redisHabilitado) return null
    if (!clienteRedis && !conectando) conectando = conectar()
    return clienteRedis
  }

  return {
    get(key: K): V | undefined {
      const valor = memoria.get(key)
      if (valor !== undefined) return valor

      const r = redis()
      if (r) {
        r.get(llave(key))
          .then((raw) => {
            if (raw) {
              try {
                memoria.set(key, JSON.parse(raw) as V)
              } catch {
                /* dato corrupto en Redis: se ignora */
              }
            }
          })
          .catch(() => undefined)
      }
      return valor
    },

    set(key: K, data: V): void {
      memoria.set(key, data)
      const r = redis()
      if (r) {
        r.set(llave(key), JSON.stringify(data), 'EX', Math.max(1, Math.ceil(ttlMs / 1000))).catch(
          () => undefined
        )
      }
    },

    delete(key: K): void {
      memoria.delete(key)
      const r = redis()
      if (r) {
        r.del(llave(key)).catch(() => undefined)
      }
    },
  }
}
