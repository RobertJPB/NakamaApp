import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }   from '../../infrastructure/container'
import { AppError }    from '../middlewares/error.middleware'

export class FeedController {
  getFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const page  = Number(req.query.page)  || 1
      const limit = Number(req.query.limit) || 20
      const resultado = await container.obtenerFeed.execute({
        usuarioId: req.userId,
        page,
        limit,
      })
      res.json(resultado)
    } catch (err) { next(err) }
  }
  postFeed = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()
      const { contenido, tema, soloAmigos } = req.body

      const nuevaPub = await prismaClient.publicacion.create({
        data: {
          usuarioId: req.userId,
          contenido,
          tema,
          soloAmigos: Boolean(soloAmigos),
        },
        include: { usuario: true }
      })

      // Add to feed system
      await prismaClient.feed.create({
        data: {
          usuarioId: req.userId,
          tipo: 'publicacion',
          referenciaId: nuevaPub.id,
          actorId: req.userId
        }
      })

      res.status(201).json(nuevaPub)
    } catch (err) { next(err) }
  }

  deleteFeedItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id } = req.params
      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()

      if (tipo === 'resena') {
        await container.eliminarResena.execute({ resenaId: id, usuarioId: req.userId })
        await prismaClient.feed.deleteMany({ where: { tipo: 'resena', referenciaId: id, usuarioId: req.userId } })
      } else if (tipo === 'publicacion') {
        await prismaClient.publicacion.deleteMany({ where: { id, usuarioId: req.userId } })
        await prismaClient.feed.deleteMany({ where: { tipo: 'publicacion', referenciaId: id, usuarioId: req.userId } })
      }
      res.status(204).send()
    } catch (err) { next(err) }
  }

  toggleLike = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id } = req.params
      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()

      if (tipo === 'resena') {
        const resultado = await container.toggleLikeResena.execute({ usuarioId: req.userId, resenaId: id })
        return res.json(resultado)
      } else if (tipo === 'publicacion') {
        const existente = await prismaClient.reaccionPublicacion.findUnique({ where: { usuarioId_publicacionId: { usuarioId: req.userId, publicacionId: id } } })
        if (existente) {
          await prismaClient.reaccionPublicacion.delete({ where: { usuarioId_publicacionId: { usuarioId: req.userId, publicacionId: id } } })
          await prismaClient.publicacion.update({ where: { id }, data: { totalLikes: { decrement: 1 } } })
          return res.json({ accion: 'unliked' })
        } else {
          await prismaClient.reaccionPublicacion.create({ data: { usuarioId: req.userId, publicacionId: id } })
          await prismaClient.publicacion.update({ where: { id }, data: { totalLikes: { increment: 1 } } })
          return res.json({ accion: 'liked' })
        }
      }
      res.status(400).json({ error: 'Tipo invalido' })
    } catch (err) { next(err) }
  }

  getComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { tipo, id } = req.params
      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()

      const filter = tipo === 'resena' ? { resenaId: id } : { publicacionId: id }
      const comentarios = await prismaClient.comentario.findMany({
        where: filter,
        include: { usuario: { select: { id: true, nombreDisplay: true, username: true, avatarUrl: true } } },
        orderBy: { creadoEn: 'asc' }
      })
      res.json(comentarios)
    } catch (err) { next(err) }
  }

  postComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id } = req.params
      const { contenido } = req.body
      if (!contenido || !contenido.trim()) throw new AppError('Comentario vacio', 400)

      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()

      const data = {
        usuarioId: req.userId,
        contenido,
        ...(tipo === 'resena' ? { resenaId: id } : { publicacionId: id })
      }
      
      const nuevo = await prismaClient.comentario.create({
        data,
        include: { usuario: { select: { id: true, nombreDisplay: true, username: true, avatarUrl: true } } }
      })

      if (tipo === 'resena') {
        await prismaClient.resena.update({ where: { id }, data: { totalComentarios: { increment: 1 } } })
      } else if (tipo === 'publicacion') {
        await prismaClient.publicacion.update({ where: { id }, data: { totalComentarios: { increment: 1 } } })
      }

      res.status(201).json(nuevo)
    } catch (err) { next(err) }
  }

  deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, id, comentarioId } = req.params

      const prisma = require('../../infrastructure/database/prisma/client').default || require('@prisma/client').PrismaClient
      const prismaClient = new prisma()

      const comentario = await prismaClient.comentario.findUnique({ where: { id: comentarioId } })
      if (!comentario) throw new AppError('No encontrado', 404)
      if (comentario.usuarioId !== req.userId) throw new AppError('No autorizado', 403)

      await prismaClient.comentario.delete({ where: { id: comentarioId } })

      if (tipo === 'resena') {
        await prismaClient.resena.update({ where: { id }, data: { totalComentarios: { decrement: 1 } } })
      } else if (tipo === 'publicacion') {
        await prismaClient.publicacion.update({ where: { id }, data: { totalComentarios: { decrement: 1 } } })
      }

      res.status(200).json({ ok: true })
    } catch (err) { next(err) }
  }
}
