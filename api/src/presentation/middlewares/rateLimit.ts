import rateLimit from 'express-rate-limit'

const mensaje = (error: string) => ({ error })

export const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite por IP (aumentado para desarrollo)
  message: mensaje('Demasiadas peticiones. Intente nuevamente en 15 minutos.'),
  standardHeaders: true,
  legacyHeaders: false,
})

// Límite estricto para el proxy de imágenes: evita que una IP abuse del reenvío
// de imágenes de terceros (Kitsu/AniList/MAL) y agote ancho de banda.
export const limiterProxyImagen = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  message: mensaje('Demasiadas solicitudes de imágenes. Intente nuevamente en un minuto.'),
  standardHeaders: true,
  legacyHeaders: false,
})
