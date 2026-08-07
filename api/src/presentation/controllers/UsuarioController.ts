import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container } from '../../infrastructure/container'
import { AppError } from '../middlewares/error.middleware'

export class UsuarioController {
  me = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const usuario = await container.usuarioRepo.findByIdRaw(req.userId)
      if (!usuario) throw new AppError('Usuario no encontrado', 404)
      res.json(usuario)
    } catch (err) {
      next(err)
    }
  }

  registrar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usuario = await container.registrarUsuario.execute({
        id: req.body.id,
        email: req.body.email,
        username: req.body.username,
        nombre: req.body.nombre,
      })
      res.status(201).json(usuario)
    } catch (err) {
      next(err)
    }
  }

  perfil = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const usuario = await container.usuarioRepo.findPerfilPorUsername(req.params.username)
      if (!usuario) throw new AppError('Usuario no encontrado', 404)

      let esSeguido = false
      if (req.userId) {
        const estado = await container.usuarioRepo.obtenerEstadoSeguimiento(req.userId, usuario.id)
        esSeguido = estado === 'aceptado'
      }

      res.json({
        ...usuario,
        totalAnimesLista: usuario._count.lista,
        totalResenas: usuario._count.resenas,
        totalSeguidores: usuario._count.seguidores,
        totalSiguiendo: usuario._count.siguiendo,
        esSeguido,
      })
    } catch (err) {
      next(err)
    }
  }

  actualizar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const usuario = await container.actualizarPerfil.execute({
        usuarioId: req.userId,
        ...req.body,
      })
      res.json(usuario)
    } catch (err) {
      next(err)
    }
  }

  toggleSeguir = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await container.toggleSeguir.execute({
        seguidorId: req.userId,
        seguidoId: req.params.id,
      })
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  seguidores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const seguidores = await container.usuarioRepo.findSeguidores(id)
      res.json({ usuarioId: id, usuarios: seguidores.map((s: any) => s.seguidor) })
    } catch (err) {
      next(err)
    }
  }

  siguiendo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const siguiendo = await container.usuarioRepo.findSiguiendo(id)
      res.json({ usuarioId: id, usuarios: siguiendo.map((s: any) => s.seguido) })
    } catch (err) {
      next(err)
    }
  }
  buscar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? '').trim()
      if (q.length < 2) return res.json([])

      const usuarios = await container.usuarioRepo.buscarUsuarios(q)

      res.json(usuarios)
    } catch (err) {
      next(err)
    }
  }

  sugeridos = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Si el usuario está autenticado, excluimos al propio usuario
      // y a los que ya sigue. Por simplicidad ahora, solo devolvemos 4 usuarios aleatorios
      // excluyendo al usuario actual.
      let excludedIds: string[] = []

      if (req.userId) {
        excludedIds.push(req.userId)
        excludedIds.push(...(await container.usuarioRepo.findSeguidoIds(req.userId)))
      }

      const all = req.query.all === 'true'
      let sugeridos = await container.usuarioRepo.findSugeridos(excludedIds, all ? 50 : 4)

      // Filtrar usuarios vetados (Maria Teresa, olasbb) a nivel global en la API
      sugeridos = sugeridos.filter((u: any) => {
        const username = u.username?.toLowerCase() || ''
        const nombreDisplay = u.nombreDisplay?.toLowerCase() || ''
        return !username.includes('maria teresa') && !nombreDisplay.includes('maria teresa') &&
               !username.includes('olasbb') && !nombreDisplay.includes('olasbb')
      })

      res.json(all ? { usuarios: sugeridos } : sugeridos)
    } catch (err) {
      next(err)
    }
  }

  actividad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const username = req.params.username
      const usuario = await container.usuarioRepo.findByUsername(username)
      if (!usuario) throw new AppError('Usuario no encontrado', 404)

      const limit = Number(req.query.limit) || 20
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null

      const { publicaciones, resenas } = await container.usuarioRepo.findActividad(
        usuario.id,
        req.userId,
        cursor,
        limit
      )

      const mappedResenas = resenas.map((r: any) => ({
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
        comentarios: r.comentarios,
      }))

      const mappedPublicaciones = publicaciones.map((p: any) => ({
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
        resena: p.resena
          ? {
              id: p.resena.id,
              animeTitulo: p.resena.anime.titulo,
              externalId: p.resena.anime.externalId,
              animeImagen: p.resena.anime.imagenUrl,
              calificacion: p.resena.calificacion,
            }
          : null,
        opciones:
          p.opciones?.map((opt: any) => ({
            id: opt.id,
            texto: opt.texto,
            votos: opt.votos,
            hasVoted: opt.votosUsuarios.some((v: any) => v.usuarioId === req.userId),
          })) || [],
        creadoEn: p.creadoEn.toISOString(),
        timestamp: p.creadoEn.getTime(),
        totalLikes: p.totalLikes,
        totalComentarios: p.totalComentarios,
        hasLiked: p.reacciones?.length > 0,
        likedByTarget: p.usuarioId !== usuario.id,
        comentarios: p.comentarios,
      }))

      const feed = [...mappedResenas, ...mappedPublicaciones]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .map(({ timestamp: _timestamp, ...rest }) => rest)

      res.json(feed)
    } catch (err) {
      next(err)
    }
  }
}
