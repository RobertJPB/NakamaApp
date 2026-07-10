import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export interface AuthRequest extends Request {
  userId?: string
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token requerido' })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ error: 'Token inválido o expirado' })

  req.userId = data.user.id
  next()
}

export const authOpcional = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    if (data.user) req.userId = data.user.id
  }
  next()
}
