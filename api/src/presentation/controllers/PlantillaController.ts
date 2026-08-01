import { Request, Response, NextFunction } from 'express'
import { prisma } from '../../infrastructure/database/prisma/client'

export class PlantillaController {
  
  listar = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plantillas = await prisma.plantillaTierList.findMany({
        orderBy: { creadoEn: 'desc' },
        include: {
          usuario: {
            select: {
              username: true,
              nombreDisplay: true,
              avatarUrl: true
            }
          }
        },
        take: 50 // limit to recent 50
      })
      res.json(plantillas)
    } catch (err) {
      next(err)
    }
  }

  crear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre, datos } = req.body
      const usuarioId = (req as any).userId

      if (!usuarioId) {
        return res.status(401).json({ error: 'No autorizado' })
      }

      if (!nombre || !datos) {
        return res.status(400).json({ error: 'Nombre y datos son requeridos' })
      }

      const plantilla = await prisma.plantillaTierList.create({
        data: {
          nombre,
          datos,
          usuarioId
        },
        include: {
          usuario: {
            select: {
              username: true,
              nombreDisplay: true,
              avatarUrl: true
            }
          }
        }
      })

      res.status(201).json(plantilla)
    } catch (err) {
      next(err)
    }
  }
}
