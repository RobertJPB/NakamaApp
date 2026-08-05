import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '../database/prisma/client'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export interface AuthRequest extends Request {
  userId?: string
}

interface CacheEntry {
  userId: string;
  expiresAt: number;
}
const authCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

function getCachedUserId(token: string): string | null {
  const entry = authCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    authCache.delete(token);
    return null;
  }
  return entry.userId;
}

function setCachedUserId(token: string, userId: string) {
  authCache.set(token, {
    userId,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  // Limpieza simple periódica (cada 1000 accesos para evitar fugas lentas)
  if (authCache.size > 5000) {
    const now = Date.now();
    for (const [key, val] of authCache.entries()) {
      if (now > val.expiresAt) {
        authCache.delete(key);
      }
    }
  }
}

async function asegurarUsuarioDB(user: any) {
  if (!user) return

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { id: user.id }
  })

  if (!usuarioExistente) {
    // Generar un username limpio y único
    let baseUsername = user.user_metadata?.username || user.user_metadata?.name || user.email?.split('@')[0] || 'user'
    baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (baseUsername.length < 3) {
      baseUsername = 'user_' + baseUsername
    }
    baseUsername = baseUsername.substring(0, 45)

    let username = baseUsername
    let counter = 1
    while (true) {
      const colision = await prisma.usuario.findUnique({
        where: { username }
      })
      if (!colision) break
      username = `${baseUsername}_${counter}`
      counter++
    }

    const nombreDisplay = user.user_metadata?.full_name || user.user_metadata?.name || username

    try {
      await prisma.usuario.create({
        data: {
          id: user.id,
          email: user.email || `${user.id}@placeholder.com`,
          username,
          nombreDisplay,
          avatarUrl: null, // No importar avatar de Google por defecto
        }
      })
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Ignorar colisión de ID o username.
        // Ocurre por race conditions cuando el frontend envía múltiples peticiones simultáneas
      } else {
        throw e
      }
    }
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  try {
    const cachedId = getCachedUserId(token);
    if (cachedId) {
      req.userId = cachedId;
      return next();
    }

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return res.status(401).json({ error: 'Token inválido o expirado' })

    await asegurarUsuarioDB(data.user)

    setCachedUserId(token, data.user.id);
    req.userId = data.user.id
    next()
  } catch (err) {
    next(err)
  }
}

export const authOpcional = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    try {
      const cachedId = getCachedUserId(token);
      if (cachedId) {
        req.userId = cachedId;
        return next();
      }

      const { data } = await supabase.auth.getUser(token)
      if (data.user) {
        await asegurarUsuarioDB(data.user)
        setCachedUserId(token, data.user.id);
        req.userId = data.user.id
      }
    } catch (e) {
      // Ignorar errores en auth opcional
    }
  }
  next()
}

