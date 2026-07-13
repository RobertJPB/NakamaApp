import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { AppError }    from '../middlewares/error.middleware'
import { PrismaColeccionRepository } from '../../infrastructure/repositories/PrismaColeccionRepository'

const coleccionRepo = new PrismaColeccionRepository()

export class ColeccionController {
  editoriales = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page  = Number(req.query.page)  || 1
      const limit = Number(req.query.limit) || 20
      const resultado = await coleccionRepo.findEditoriales(page, limit)
      res.json(resultado)
    } catch (err) { next(err) }
  }

  porUsuario = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resultado = await coleccionRepo.findByUsuario(req.params.usuarioId)
      res.json(resultado)
    } catch (err) { next(err) }
  }

  detalle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coleccion = await coleccionRepo.findById(req.params.id)
      if (!coleccion) throw new AppError('Colección no encontrada', 404)
      res.json(coleccion)
    } catch (err) { next(err) }
  }

  crear = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await coleccionRepo.create({
        usuarioId:   req.userId,
        titulo:      req.body.titulo,
        descripcion: req.body.descripcion,
        imagenUrl:   req.body.imagenUrl,
        esPublica:   req.body.esPublica ?? true,
      })
      res.status(201).json(resultado)
    } catch (err) { next(err) }
  }

  editar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await coleccionRepo.update(req.params.id, req.body)
      res.json(resultado)
    } catch (err) { next(err) }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await coleccionRepo.delete(req.params.id, req.userId)
      res.status(204).send()
    } catch (err) { next(err) }
  }

  agregarAnime = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await coleccionRepo.agregarAnime(
        req.params.id,
        req.body.animeId,
        req.body.posicion ?? 0,
        req.body.nota,
      )
      res.status(201).json({ mensaje: 'Anime agregado a la colección' })
    } catch (err) { next(err) }
  }

  quitarAnime = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await coleccionRepo.quitarAnime(req.params.id, req.params.animeId)
      res.status(204).send()
    } catch (err) { next(err) }
  }
}
