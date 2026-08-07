import { Request, Response, NextFunction } from 'express'
import { container } from '../../infrastructure/container'
import fs from 'fs'
import path from 'path'

export class RankingController {
  global = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 100

      // Intentar primero en modo dev (tsx) -> api/src/infrastructure/data
      let filePath = path.join(__dirname, '../../infrastructure/data/mal-ranking.json')

      if (!fs.existsSync(filePath)) {
        // Fallback para produccion (node dist/...) -> __dirname = api/dist/presentation/controllers
        // Subimos 3 niveles: presentation, dist, api
        filePath = path.join(__dirname, '../../../src/infrastructure/data/mal-ranking.json')
      }

      if (!fs.existsSync(filePath)) {
        // Fallback robusto basado en CWD si se corre desde api/ o root/
        filePath = path.join(process.cwd(), 'src/infrastructure/data/mal-ranking.json')
        if (!fs.existsSync(filePath)) {
          filePath = path.join(process.cwd(), 'api/src/infrastructure/data/mal-ranking.json')
        }
      }

      if (!fs.existsSync(filePath)) {
        console.error(`Ranking file not found. Tried multiple paths.`)
        return res.json([])
      }

      const fileData = fs.readFileSync(filePath, 'utf-8')
      const allResults = JSON.parse(fileData)

      const results = allResults.slice(0, limit)

      res.json(results)
    } catch (err) {
      next(err)
    }
  }

  temporada = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const resultado = await container.obtenerRanking.execute({ tipo: 'temporada' })
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  masVistos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100
      const resultado = await container.obtenerRanking.execute({ tipo: 'mas-vistos', limit })
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  masGustados = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100
      const resultado = await container.obtenerRanking.execute({ tipo: 'mas-gustados', limit })
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }
}
