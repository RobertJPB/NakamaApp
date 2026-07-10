import { Response, NextFunction }  from 'express'
import { AuthRequest }             from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }               from '../../infrastructure/container'
import { AppError }                from '../middlewares/error.middleware'

/**
 * SRP: solo maneja HTTP (parsear request, llamar caso de uso, devolver response)
 * DIP: usa el container, no instancia nada directamente
 */
export class ResenaController {

  porAnime = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { animeId } = req.params
      const page  = Number(req.query.page)  || 1
      const limit = Number(req.query.limit) || 20
      // TODO: conectar con repo cuando Prisma esté configurado
      res.json({ animeId, page, limit, resenas: [] })
    } catch (err) { next(err) }
  }

  porUsuario = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { usuarioId } = req.params
      res.json({ usuarioId, resenas: [] })
    } catch (err) { next(err) }
  }

  crear = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resena = await container.crearResena.execute({
        usuarioId:       req.userId,
        animeId:         req.body.animeId,
        calificacion:    req.body.calificacion,
        contenido:       req.body.contenido,
        contieneSpoiler: req.body.contieneSpoiler ?? false,
        esPublica:       req.body.esPublica       ?? true,
      })
      res.status(201).json(resena)
    } catch (err) { next(err) }
  }

  editar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resena = await container.editarResena.execute({
        resenaId:        req.params.id,
        usuarioId:       req.userId,
        calificacion:    req.body.calificacion,
        contenido:       req.body.contenido,
        contieneSpoiler: req.body.contieneSpoiler,
        esPublica:       req.body.esPublica,
      })
      res.json(resena)
    } catch (err) { next(err) }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.eliminarResena.execute({
        resenaId:  req.params.id,
        usuarioId: req.userId,
      })
      res.status(204).send()
    } catch (err) { next(err) }
  }

  toggleLike = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await container.toggleLikeResena.execute({
        usuarioId: req.userId,
        resenaId:  req.params.id,
      })
      res.json(resultado)
    } catch (err) { next(err) }
  }
}
