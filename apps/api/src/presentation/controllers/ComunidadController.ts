import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { AppError }    from '../middlewares/error.middleware'
import { PrismaComunidadRepository } from '../../infrastructure/repositories/PrismaComunidadRepository'

const comunidadRepo = new PrismaComunidadRepository()

export class ComunidadController {
  listar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tipo  = req.query.tipo as string | undefined
      const page  = Number(req.query.page)  || 1
      const limit = Number(req.query.limit) || 20
      const resultado = await comunidadRepo.findMany(tipo, page, limit)
      res.json(resultado)
    } catch (err) { next(err) }
  }

  detalle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comunidad = await comunidadRepo.findById(req.params.id)
      if (!comunidad) throw new AppError('Comunidad no encontrada', 404)
      res.json(comunidad)
    } catch (err) { next(err) }
  }

  publicaciones = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Placeholder hasta que se implemente el caso de uso de publicaciones
      res.json({ comunidadId: req.params.id, publicaciones: [] })
    } catch (err) { next(err) }
  }

  crear = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await comunidadRepo.create({
        nombre:      req.body.nombre,
        descripcion: req.body.descripcion,
        imagenUrl:   req.body.imagenUrl,
        tipo:        req.body.tipo ?? 'anime',
        creadoPor:   req.userId,
      })
      res.status(201).json(resultado)
    } catch (err) { next(err) }
  }

  unirse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await comunidadRepo.unirse(req.userId, req.params.id)
      res.json({ mensaje: 'Te uniste a la comunidad' })
    } catch (err) { next(err) }
  }

  salir = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await comunidadRepo.salir(req.userId, req.params.id)
      res.json({ mensaje: 'Saliste de la comunidad' })
    } catch (err) { next(err) }
  }

  publicar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      // Placeholder hasta que se implemente el caso de uso de publicaciones
      res.status(201).json({ mensaje: 'Publicación creada', comunidadId: req.params.id })
    } catch (err) { next(err) }
  }

  comentar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      // Placeholder hasta que se implemente el caso de uso de comentarios
      res.status(201).json({ mensaje: 'Comentario creado', publicacionId: req.params.pubId })
    } catch (err) { next(err) }
  }

  likePublicacion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      // Placeholder hasta que se implemente el caso de uso de likes
      res.json({ mensaje: 'Like registrado', publicacionId: req.params.pubId })
    } catch (err) { next(err) }
  }
}
