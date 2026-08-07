import { Request, Response, NextFunction } from 'express'
import { IPlantillaRepository } from '../../domain/repositories/IPlantillaRepository'

export class PlantillaController {
  constructor(private readonly plantillaRepo: IPlantillaRepository) {}

  listar = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const plantillas = await this.plantillaRepo.listar()
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

      const plantilla = await this.plantillaRepo.crear({ nombre, datos, usuarioId })

      res.status(201).json(plantilla)
    } catch (err) {
      next(err)
    }
  }
}
