import { Request, Response, NextFunction } from 'express'
import { prisma } from '../../infrastructure/database/prisma/client'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { AppError } from '../middlewares/error.middleware'

export class ReporteController {
  crearReporte = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tipo, referenciaId } = req.body
      const usuarioId = (req as any).usuarioId

      if (!tipo || !referenciaId) {
        res.status(400).json({ error: 'Faltan datos para el reporte' })
        return
      }

      // En un entorno de producción, aquí guardaríamos el reporte en la base de datos
      // y notificaríamos a los moderadores. Por ahora, solo lo registraremos en consola.
      console.log(`NUEVO REPORTE [${tipo}]: ID Referencia = ${referenciaId}, Reportado por = ${usuarioId}`)

      res.status(201).json({ mensaje: 'Reporte recibido exitosamente' })
    } catch (error) {
      console.error('Error al crear reporte:', error)
      res.status(500).json({ error: 'Error interno al procesar el reporte' })
    }
  }
}
