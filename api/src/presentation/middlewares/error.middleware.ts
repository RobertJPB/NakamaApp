import { Request, Response, NextFunction } from 'express'
import { logger } from '../../config/logger'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn({ err }, err.message)
    return res.status(err.statusCode).json({ error: err.message })
  }

  logger.error({ err }, 'Error interno del servidor')
  res.status(500).json({ error: 'Error interno del servidor' })
}
