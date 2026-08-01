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

  buscar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? '').trim()
      if (q.length < 2) return res.json([])
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const comunidades = await prisma.comunidad.findMany({
        where: {
          OR: [
            { nombre: { contains: q, mode: 'insensitive' } },
            { descripcion: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 50,
        include: {
          creador: { select: { username: true, nombreDisplay: true, avatarUrl: true } },
          _count: { select: { miembros: true, publicaciones: true } }
        },
        orderBy: { creadoEn: 'desc' }
      })
      res.json(comunidades)
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
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const skip = (page - 1) * limit
      const seccion = req.query.seccion as string | undefined
      const { prisma } = require('../../infrastructure/database/prisma/client')

      const whereClause: any = { comunidadId: req.params.id }
      if (seccion) {
        whereClause.tema = seccion
      }

      const posts = await prisma.publicacion.findMany({
        where: whereClause,
        include: {
          usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } },
          opciones: {
            include: { votosUsuarios: { select: { usuarioId: true } } }
          },
          resena: {
            include: { anime: { select: { id: true, titulo: true, imagenUrl: true } } }
          }
        },
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limit
      })
      res.json({ comunidadId: req.params.id, publicaciones: posts })
    } catch (err) { next(err) }
  }

  crear = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await comunidadRepo.create({
        nombre:      req.body.nombre,
        descripcion: req.body.descripcion,
        imagenUrl:   req.body.imagenUrl,
        bannerUrl:   req.body.bannerUrl,
        tipo:        req.body.tipo ?? 'anime',
        creadoPor:   req.userId,
      })
      res.status(201).json(resultado)
    } catch (err) { next(err) }
  }

  editar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const comunidad = await comunidadRepo.findById(req.params.id)
      if (!comunidad) throw new AppError('Comunidad no encontrada', 404)
      
      // Solo el creador puede editar (por simplicidad, o verificar rol 'admin' en la tabla Miembro)
      if (comunidad.creadoPor !== req.userId) {
        throw new AppError('No tienes permisos para editar esta comunidad', 403)
      }

      const resultado = await comunidadRepo.update(req.params.id, {
        nombre:      req.body.nombre,
        descripcion: req.body.descripcion,
        imagenUrl:   req.body.imagenUrl,
        bannerUrl:   req.body.bannerUrl,
        tipo:        req.body.tipo,
      })
      res.json(resultado)
    } catch (err) { next(err) }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const comunidad = await comunidadRepo.findById(req.params.id)
      if (!comunidad) throw new AppError('Comunidad no encontrada', 404)
      
      // Solo el creador puede eliminar
      if (comunidad.creadoPor !== req.userId) {
        throw new AppError('No tienes permisos para eliminar esta comunidad', 403)
      }

      await comunidadRepo.delete(req.params.id)
      res.json({ mensaje: 'Comunidad eliminada con éxito' })
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
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const { tipo, titulo, contenido, imagenUrl, opciones, resenaId, seccion } = req.body

      const nuevaPub = await prisma.publicacion.create({
        data: {
          comunidadId: req.params.id,
          usuarioId: req.userId,
          tipo: tipo || 'texto',
          tema: seccion || null,
          titulo,
          contenido,
          imagenUrl,
          resenaId,
          opciones: (tipo === 'encuesta' && opciones && opciones.length > 0) ? {
            create: opciones.map((opt: any) => ({ 
              texto: typeof opt === 'string' ? opt : opt.texto,
              imagenUrl: typeof opt === 'string' ? undefined : opt.imagenUrl 
            }))
          } : undefined
        },
        include: {
          usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } },
          opciones: true,
          resena: true
        }
      })
      res.status(201).json(nuevaPub)
    } catch (err) { next(err) }
  }

  eliminarPublicacion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      
      const pub = await prisma.publicacion.findUnique({ where: { id: req.params.pubId } })
      if (!pub) throw new AppError('Publicación no encontrada', 404)
      
      let autorizado = pub.usuarioId === req.userId
      if (!autorizado && pub.comunidadId) {
        const miembro = await prisma.miembro.findUnique({ 
          where: { usuarioId_comunidadId: { usuarioId: req.userId, comunidadId: pub.comunidadId } } 
        })
        if (miembro && (miembro.rol === 'admin' || miembro.rol === 'moderador')) {
          autorizado = true
        }
      }

      if (!autorizado) throw new AppError('No autorizado', 403)

      await prisma.publicacion.delete({ where: { id: req.params.pubId } })
      res.json({ mensaje: 'Publicación eliminada correctamente' })
    } catch (err) { next(err) }
  }

  editarPublicacion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const { contenido } = req.body
      if (!contenido || contenido.trim() === '') throw new AppError('El contenido no puede estar vacío', 400)

      const pub = await prisma.publicacion.findUnique({ where: { id: req.params.pubId } })
      if (!pub) throw new AppError('Publicación no encontrada', 404)
      if (pub.usuarioId !== req.userId) throw new AppError('No autorizado para editar', 403)

      const actualizada = await prisma.publicacion.update({ 
        where: { id: req.params.pubId },
        data: { contenido: contenido.trim() }
      })
      res.json(actualizada)
    } catch (err) { next(err) }
  }

  votarEncuesta = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const opcionId = req.body.opcionId

      const opcion = await prisma.opcionEncuesta.findUnique({ where: { id: opcionId } })
      if (!opcion) throw new AppError('Opción no encontrada', 404)

      const votoPrevio = await prisma.votoEncuesta.findFirst({
        where: {
          usuarioId: req.userId,
          opcion: { publicacionId: opcion.publicacionId }
        }
      })

      if (votoPrevio) {
        if (votoPrevio.opcionId === opcionId) {
          // Quitar voto
          await prisma.$transaction([
            prisma.votoEncuesta.delete({ where: { usuarioId_opcionId: { usuarioId: req.userId, opcionId: votoPrevio.opcionId } } }),
            prisma.opcionEncuesta.update({ where: { id: votoPrevio.opcionId }, data: { votos: { decrement: 1 } } })
          ])
          return res.json({ accion: 'unvoted' })
        } else {
          // Cambiar voto
          await prisma.$transaction([
            prisma.votoEncuesta.delete({ where: { usuarioId_opcionId: { usuarioId: req.userId, opcionId: votoPrevio.opcionId } } }),
            prisma.opcionEncuesta.update({ where: { id: votoPrevio.opcionId }, data: { votos: { decrement: 1 } } }),
            prisma.votoEncuesta.create({ data: { usuarioId: req.userId, opcionId } }),
            prisma.opcionEncuesta.update({ where: { id: opcionId }, data: { votos: { increment: 1 } } })
          ])
          return res.json({ accion: 'changed' })
        }
      }

      // Nuevo voto
      await prisma.$transaction([
        prisma.votoEncuesta.create({ data: { usuarioId: req.userId, opcionId } }),
        prisma.opcionEncuesta.update({ where: { id: opcionId }, data: { votos: { increment: 1 } } })
      ])
      res.json({ accion: 'voted' })
    } catch (err) { next(err) }
  }
  listarMiembros = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const miembros = await prisma.miembro.findMany({
        where: { comunidadId: req.params.id },
        include: {
          usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } }
        },
        orderBy: [
          { rol: 'asc' }, // admin, miembro, moderador (alphabetic, but we want admin first. Prisma enum sort order is definition order! admin, moderador, miembro)
          { unidoEn: 'desc' }
        ]
      })
      res.json(miembros)
    } catch (err) { next(err) }
  }

  expulsarMiembro = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const { id: comunidadId, usuarioId: objetivoId } = req.params

      const yo = await prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: req.userId, comunidadId } } })
      const objetivo = await prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } } })

      if (!yo || !objetivo) throw new AppError('Miembro no encontrado', 404)
      if (yo.rol === 'miembro') throw new AppError('No tienes permisos', 403)
      if (yo.rol === 'moderador' && (objetivo.rol === 'admin' || objetivo.rol === 'moderador')) {
        throw new AppError('No puedes expulsar a este usuario', 403)
      }
      if (req.userId === objetivoId) throw new AppError('No puedes expulsarte a ti mismo', 400)

      await prisma.miembro.delete({ where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } } })
      await prisma.comunidad.update({ where: { id: comunidadId }, data: { totalMiembros: { decrement: 1 } } })
      
      res.json({ mensaje: 'Miembro expulsado' })
    } catch (err) { next(err) }
  }

  cambiarRol = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const { id: comunidadId, usuarioId: objetivoId } = req.params
      const { rol } = req.body

      if (!['admin', 'moderador', 'miembro'].includes(rol)) throw new AppError('Rol inválido', 400)

      const yo = await prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: req.userId, comunidadId } } })
      if (!yo || yo.rol !== 'admin') throw new AppError('Solo los administradores pueden cambiar roles', 403)
      if (req.userId === objetivoId) throw new AppError('No puedes cambiar tu propio rol', 400)

      await prisma.miembro.update({
        where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } },
        data: { rol }
      })
      
      res.json({ mensaje: 'Rol actualizado' })
    } catch (err) { next(err) }
  }
  comentar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const { pubId } = req.params
      const { contenido } = req.body
      if (!contenido?.trim()) throw new AppError('Comentario vacío', 400)

      // No se requiere ser miembro para comentar — solo estar autenticado
      const pub = await prisma.publicacion.findUnique({ where: { id: pubId } })
      if (!pub) throw new AppError('Publicación no encontrada', 404)

      const comentario = await prisma.comentario.create({
        data: { usuarioId: req.userId, publicacionId: pubId, contenido: contenido.trim() },
        include: { usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } } }
      })
      await prisma.publicacion.update({ where: { id: pubId }, data: { totalComentarios: { increment: 1 } } })

      res.status(201).json(comentario)
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
