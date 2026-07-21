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
      
      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()
      
      const resenas = await prismaClient.resena.findMany({
        where: { animeId, esPublica: true },
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          anime: { select: { titulo: true, anilistId: true, imagenUrl: true } },
          usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
        }
      })

      res.json({ animeId, page, limit, resenas })
    } catch (err) { next(err) }
  }

  porUsuario = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { usuarioId } = req.params
      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()

      const resenas = await prismaClient.resena.findMany({
        where: { usuarioId, esPublica: true },
        orderBy: { creadoEn: 'desc' },
        include: {
          anime: { select: { titulo: true, anilistId: true, imagenUrl: true } },
          usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
        }
      })

      res.json({ usuarioId, resenas })
    } catch (err) { next(err) }
  }

  crear = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      
      let animeIdEnDb = req.body.animeId
      // Si el frontend envía un ID de Anilist (número), debemos asegurar que el anime exista
      if (typeof animeIdEnDb === 'number' || (!isNaN(Number(animeIdEnDb)) && String(animeIdEnDb).length < 10)) {
        const { anime } = await container.obtenerDetalleAnime.execute(Number(animeIdEnDb))
        animeIdEnDb = anime.id
      }

      const resena = await container.crearResena.execute({
        usuarioId:       req.userId,
        animeId:         animeIdEnDb,
        calificacion:    req.body.calificacion,
        contenido:       req.body.contenido,
        contieneSpoiler: req.body.contieneSpoiler ?? false,
        esPublica:       req.body.esPublica       ?? true,
        fechaVisto:      req.body.fechaVisto,
        etiquetas:       req.body.etiquetas,
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
