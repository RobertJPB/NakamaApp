import { Request, Response, NextFunction } from 'express'
import { AuthRequest }   from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }     from '../../infrastructure/container'
import { AppError }      from '../middlewares/error.middleware'
import { prisma }        from '../../infrastructure/database/prisma/client'

export class UsuarioController {

  me = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.userId }
      })
      if (!usuario) throw new AppError('Usuario no encontrado', 404)
      res.json(usuario)
    } catch (err) { next(err) }
  }

  registrar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = await container.registrarUsuario.execute({
        id:       req.body.id,
        email:    req.body.email,
        username: req.body.username,
        nombre:   req.body.nombre,
      })
      res.status(201).json(usuario)
    } catch (err) { next(err) }
  }

  perfil = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { username: req.params.username },
        include: {
          _count: {
            select: {
              seguidores: true,
              siguiendo:  true,
              lista:      true,
              resenas:    true,
            }
          }
        }
      })
      if (!usuario) throw new AppError('Usuario no encontrado', 404)

      let esSeguido = false
      if (req.userId) {
        const relacion = await prisma.seguidor.findUnique({
          where: {
            seguidorId_seguidoId: {
              seguidorId: req.userId,
              seguidoId:  usuario.id
            }
          }
        })
        esSeguido = relacion?.estado === 'aceptado'
      }

      res.json({
        ...usuario,
        totalAnimesLista: usuario._count.lista,
        totalResenas:     usuario._count.resenas,
        totalSeguidores:  usuario._count.seguidores,
        totalSiguiendo:   usuario._count.siguiendo,
        esSeguido,
      })
    } catch (err) { next(err) }
  }

  actualizar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const usuario = await container.actualizarPerfil.execute({
        usuarioId: req.userId,
        ...req.body,
      })
      res.json(usuario)
    } catch (err) { next(err) }
  }

  toggleSeguir = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await container.toggleSeguir.execute({
        seguidorId: req.userId,
        seguidoId:  req.params.id,
      })
      res.json(resultado)
    } catch (err) { next(err) }
  }

  seguidores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const seguidores = await prisma.seguidor.findMany({
        where: { seguidoId: id },
        include: {
          seguidor: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, bio: true } }
        }
      });
      res.json({ usuarioId: id, usuarios: seguidores.map(s => s.seguidor) });
    } catch (err) { next(err) }
  }

  siguiendo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const siguiendo = await prisma.seguidor.findMany({
        where: { seguidorId: id },
        include: {
          seguido: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, bio: true } }
        }
      });
      res.json({ usuarioId: id, usuarios: siguiendo.map(s => s.seguido) });
    } catch (err) { next(err) }
  }
  buscar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? '').trim()
      if (q.length < 2) return res.json([])

      const usuarios = await prisma.usuario.findMany({
        where: {
          OR: [
            { username:     { contains: q, mode: 'insensitive' } },
            { nombreDisplay: { contains: q, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: {
          id:           true,
          username:     true,
          nombreDisplay: true,
          avatarUrl:    true,
          marcoUrl:     true,
          _count: { select: { seguidores: true } }
        },
        orderBy: { creadoEn: 'desc' }
      })

      res.json(usuarios)
    } catch (err) { next(err) }
  }

  sugeridos = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Si el usuario está autenticado, excluimos al propio usuario
      // y a los que ya sigue. Por simplicidad ahora, solo devolvemos 4 usuarios aleatorios
      // excluyendo al usuario actual.
      let excludedIds: string[] = []
      
      if (req.userId) {
        excludedIds.push(req.userId)
        const siguiendo = await prisma.seguidor.findMany({
          where: { seguidorId: req.userId },
          select: { seguidoId: true }
        })
        excludedIds.push(...siguiendo.map(s => s.seguidoId))
      }
      
      const all = req.query.all === 'true'
      const sugeridos = await prisma.usuario.findMany({
        where: { id: { notIn: excludedIds } },
        take: all ? 50 : 4,
        select: {
          id: true,
          username: true,
          nombreDisplay: true,
          avatarUrl: true,
          marcoUrl: true,
          bio: true,
        },
        orderBy: {
          creadoEn: 'desc'
        }
      })
      
      res.json(all ? { usuarios: sugeridos } : sugeridos)
    } catch (err) { next(err) }
  }

  actividad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const username = req.params.username
      const usuario = await prisma.usuario.findUnique({ where: { username } })
      if (!usuario) throw new AppError('Usuario no encontrado', 404)
      
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20

      // Fetch Publicaciones (propias y likes)
      const publicaciones = await prisma.publicacion.findMany({
        where: {
          OR: [
            { usuarioId: usuario.id },
            { reacciones: { some: { usuarioId: usuario.id } } }
          ]
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } },
          comunidad: { select: { nombre: true, imagenUrl: true } },
          resena: {
            include: { anime: { select: { id: true, titulo: true, externalId: true, imagenUrl: true } } }
          },
          opciones: {
            include: { votosUsuarios: true }
          },
          reacciones: req.userId ? { where: { usuarioId: req.userId } } : false,
          comentarios: {
            include: {
              usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
            },
            orderBy: { creadoEn: 'asc' }
          }
        }
      })

      // Fetch Reseñas (propias y likes)
      const resenas = await prisma.resena.findMany({
        where: {
          OR: [
            { usuarioId: usuario.id },
            { reacciones: { some: { usuarioId: usuario.id } } }
          ]
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } },
          anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
          reacciones: req.userId ? { where: { usuarioId: req.userId } } : false,
          comentarios: {
            include: {
              usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } }
            },
            orderBy: { creadoEn: 'asc' }
          }
        }
      })

      const mappedResenas = resenas.map(r => ({
        id: r.id,
        tipo: 'resena',
        actorId: r.usuario.id,
        actorUsername: r.usuario.username,
        actorNombre: r.usuario.nombreDisplay,
        actorAvatar: r.usuario.avatarUrl,
        actorMarco: r.usuario.marcoUrl,
        animeTitulo: r.anime.titulo,
        externalId: r.anime.externalId,
        animeImagen: r.anime.imagenUrl,
        calificacion: r.calificacion,
        contenido: r.contenido,
        etiquetas: r.etiquetas,
        fechaVisto: r.fechaVisto ? r.fechaVisto.toISOString() : null,
        creadoEn: r.creadoEn.toISOString(),
        timestamp: r.creadoEn.getTime(),
        totalLikes: r.totalLikes,
        totalComentarios: r.totalComentarios,
        hasLiked: r.reacciones?.length > 0,
        likedByTarget: r.usuarioId !== usuario.id,
        comentarios: r.comentarios
      }))

      const mappedPublicaciones = publicaciones.map(p => ({
        id: p.id,
        tipo: p.tipo,
        actorId: p.usuario.id,
        actorUsername: p.usuario.username,
        actorNombre: p.usuario.nombreDisplay,
        actorAvatar: p.usuario.avatarUrl,
        actorMarco: p.usuario.marcoUrl,
        comunidadId: p.comunidadId,
        comunidadNombre: p.comunidad?.nombre,
        comunidadImagen: p.comunidad?.imagenUrl,
        titulo: p.titulo,
        contenido: p.contenido,
        imagenUrl: p.imagenUrl,
        resena: p.resena ? {
          id: p.resena.id,
          animeTitulo: p.resena.anime.titulo,
          externalId: p.resena.anime.externalId,
          animeImagen: p.resena.anime.imagenUrl,
          calificacion: p.resena.calificacion
        } : null,
        opciones: p.opciones?.map((opt: any) => ({
          id: opt.id,
          texto: opt.texto,
          votos: opt.votos,
          hasVoted: opt.votosUsuarios.some((v: any) => v.usuarioId === req.userId)
        })) || [],
        creadoEn: p.creadoEn.toISOString(),
        timestamp: p.creadoEn.getTime(),
        totalLikes: p.totalLikes,
        totalComentarios: p.totalComentarios,
        hasLiked: p.reacciones?.length > 0,
        likedByTarget: p.usuarioId !== usuario.id,
        comentarios: p.comentarios
      }))

      const feed = [...mappedResenas, ...mappedPublicaciones]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .map(({ timestamp, ...rest }) => rest)

      res.json(feed)
    } catch (err) { next(err) }
  }
}
