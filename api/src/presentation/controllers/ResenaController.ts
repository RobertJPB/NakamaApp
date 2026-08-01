import { Response, NextFunction }  from 'express'
import { AuthRequest }             from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }               from '../../infrastructure/container'
import { AppError }                from '../middlewares/error.middleware'

/**
 * SRP: solo maneja HTTP (parsear request, llamar caso de uso, devolver response)
 * DIP: usa el container, no instancia nada directamente
 */
export class ResenaController {

  recientes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.query.limit) || 8
      const { prisma } = require('../../infrastructure/database/prisma/client')
      
      const resenas = await prisma.resena.findMany({
        where: { esPublica: true },
        orderBy: { creadoEn: 'desc' },
        take: limit,
        include: {
          anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
          usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
        }
      })
      
      res.json(resenas)
    } catch (error) {
      next(error)
    }
  }

  buscar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? '').trim()
      if (q.length < 2) return res.json([])

      const { prisma } = require('../../infrastructure/database/prisma/client')
      const resenas = await prisma.resena.findMany({
        where: {
          esPublica: true,
          OR: [
            { contenido: { contains: q, mode: 'insensitive' } },
            { anime: { titulo: { contains: q, mode: 'insensitive' } } }
          ]
        },
        orderBy: { creadoEn: 'desc' },
        take: 50,
        include: {
          anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
          usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
        }
      })
      
      res.json(resenas)
    } catch (error) {
      next(error)
    }
  }

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
          anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
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
          anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
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
      // Si el frontend envía un ID de Kitsu (string), debemos asegurar que el anime exista
      if (animeIdEnDb && !animeIdEnDb.includes('-')) { // Si no es un UUID, asume que es externalId
        const { anime } = await container.obtenerDetalleAnime.execute(String(animeIdEnDb))
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

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      
      const resena = await prisma.resena.findUnique({ where: { id: req.params.id } })
      if (!resena) throw new AppError('Reseña no encontrada', 404)
      if (resena.usuarioId !== req.userId) throw new AppError('No autorizado', 403)

      await prisma.resena.delete({ where: { id: req.params.id } })
      res.json({ mensaje: 'Reseña eliminada correctamente' })
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
        etiquetas:       req.body.etiquetas,
      })
      res.json(resena)
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
