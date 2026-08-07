import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { AppError } from '../../presentation/middlewares/error.middleware'

const DOMINIOS_PERMITIDOS = [
  'anilist.co',
  'media.kitsu.io',
  'media.kitsu.app',
  's3.amazonaws.com',
  'cdn.myanimelist.net',
  'ramenparados.com',
  'pfps.gg',
  'ui-avatars.com',
]

const TAMANO_MAX_IMAGEN = 10 * 1024 * 1024 // 10 MB
const TIMEOUT_MS = 8000

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function hostPermitido(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return DOMINIOS_PERMITIDOS.some((dominio) => host === dominio || host.endsWith(`.${dominio}`))
}

function esIpPrivada(ip: string): boolean {
  const version = isIP(ip)

  if (version === 4) {
    const [a, b, c] = ip.split('.').map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true // link-local
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a === 192 && b === 0 && c === 0) return true // IETF reservado
    if (a >= 224) return true // multicast y reservado
    return false
  }

  if (version === 6) {
    const lower = ip.toLowerCase()
    if (lower === '::' || lower === '::1') return true
    if (lower.startsWith('::ffff:')) {
      return esIpPrivada(lower.replace('::ffff:', '').split('%')[0])
    }
    if (/^fc|^fd/.test(lower)) return true // ULA fc00::/7
    if (/^fe[89ab]/.test(lower)) return true // link-local fe80::/10
    if (lower.startsWith('64:ff9b:')) return true // NAT64
    return false
  }

  return true
}

async function validarUrl(url: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new AppError('URL inválida', 400)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError('Solo se permiten URLs http/https', 400)
  }

  if (!hostPermitido(parsed.hostname)) {
    throw new AppError('Dominio no permitido', 403)
  }

  try {
    const direcciones = await lookup(parsed.hostname, { all: true, verbatim: true })
    if (direcciones.some((d) => esIpPrivada(d.address))) {
      throw new AppError('La URL apunta a una dirección privada', 403)
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('No se pudo resolver el dominio', 403)
  }

  return parsed
}

export async function obtenerImagenProtegida(
  url: string
): Promise<{ buffer: Buffer; contentType: string | null }> {
  const urlValida = await validarUrl(url)

  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  try {
    const respuesta = await fetch(urlValida.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      signal: controlador.signal,
      redirect: 'follow',
    })

    // Tras las redirecciones el host puede cambiar (p.ej. media.kitsu.io → s3.amazonaws.com)
    await validarUrl(respuesta.url)

    if (!respuesta.ok) {
      throw new AppError(`El servidor remoto respondió con el estado ${respuesta.status}`, 502)
    }

    const longitudDeclarada = Number(respuesta.headers.get('content-length') || '0')
    if (longitudDeclarada > TAMANO_MAX_IMAGEN) {
      throw new AppError('La imagen excede el tamaño permitido', 413)
    }

    if (!respuesta.body) {
      throw new AppError('El servidor remoto no devolvió contenido', 502)
    }

    const lector = respuesta.body.getReader()
    const fragmentos: Uint8Array[] = []
    let total = 0

    for (;;) {
      const { done, value } = await lector.read()
      if (done) break
      total += value.byteLength
      if (total > TAMANO_MAX_IMAGEN) {
        await lector.cancel().catch(() => {})
        throw new AppError('La imagen excede el tamaño permitido', 413)
      }
      fragmentos.push(value)
    }

    return {
      buffer: Buffer.concat(fragmentos),
      contentType: respuesta.headers.get('content-type'),
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError('Tiempo de espera agotado', 504)
    }
    throw new AppError('No se pudo cargar la imagen', 502)
  } finally {
    clearTimeout(temporizador)
  }
}
