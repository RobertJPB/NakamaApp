import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { AppError } from '../middlewares/error.middleware'
import { container } from '../../infrastructure/container'

export class ComunidadController {
  listar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tipo = req.query.tipo as string | undefined
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const resultado = await container.comunidadRepo.findMany(tipo, page, limit)
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  buscar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? '').trim()
      if (q.length < 2) return res.json([])
      const comunidades = await container.buscarComunidades.execute(q)
      res.json(comunidades)
    } catch (err) {
      next(err)
    }
  }

  detalle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comunidad = await container.comunidadRepo.findById(req.params.id)
      if (!comunidad) throw new AppError('Comunidad no encontrada', 404)
      res.json(comunidad)
    } catch (err) {
      next(err)
    }
  }

  publicaciones = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const seccion = req.query.seccion as string | undefined
      const posts = await container.listarPublicacionesComunidadDirecto.execute(
        req.params.id,
        seccion,
        page,
        limit,
        req.userId
      )
      res.json({ comunidadId: req.params.id, publicaciones: posts })
    } catch (err) {
      next(err)
    }
  }

  crear = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const resultado = await container.comunidadRepo.create({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        imagenUrl: req.body.imagenUrl,
        bannerUrl: req.body.bannerUrl,
        tipo: req.body.tipo ?? 'anime',
        creadoPor: req.userId,
      })
      res.status(201).json(resultado)
    } catch (err) {
      next(err)
    }
  }

  editar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const comunidad = await container.comunidadRepo.findById(req.params.id)
      if (!comunidad) throw new AppError('Comunidad no encontrada', 404)

      // Solo el creador puede editar (por simplicidad, o verificar rol 'admin' en la tabla Miembro)
      if (comunidad.creadoPor !== req.userId) {
        throw new AppError('No tienes permisos para editar esta comunidad', 403)
      }

      const resultado = await container.comunidadRepo.update(req.params.id, {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        imagenUrl: req.body.imagenUrl,
        bannerUrl: req.body.bannerUrl,
        tipo: req.body.tipo,
      })
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const comunidad = await container.comunidadRepo.findById(req.params.id)
      if (!comunidad) throw new AppError('Comunidad no encontrada', 404)

      // Solo el creador puede eliminar
      if (comunidad.creadoPor !== req.userId) {
        throw new AppError('No tienes permisos para eliminar esta comunidad', 403)
      }

      await container.comunidadRepo.delete(req.params.id)
      res.json({ mensaje: 'Comunidad eliminada con éxito' })
    } catch (err) {
      next(err)
    }
  }

  unirse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.comunidadRepo.unirse(req.userId, req.params.id)
      res.json({ mensaje: 'Te uniste a la comunidad' })
    } catch (err) {
      next(err)
    }
  }

  salir = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.comunidadRepo.salir(req.userId, req.params.id)
      res.json({ mensaje: 'Saliste de la comunidad' })
    } catch (err) {
      next(err)
    }
  }

  publicar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { tipo, titulo, contenido, imagenUrl, opciones, resenaId, seccion } = req.body

      const nuevaPub = await container.crearPublicacionComunidad.execute({
        comunidadId: req.params.id,
        usuarioId: req.userId,
        tipo,
        seccion,
        titulo,
        contenido,
        imagenUrl,
        resenaId,
        opciones,
      })
      res.status(201).json(nuevaPub)
    } catch (err) {
      next(err)
    }
  }

  eliminarPublicacion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.eliminarPublicacionComunidad.execute(req.params.pubId, req.userId)
      res.json({ mensaje: 'Publicación eliminada correctamente' })
    } catch (err) {
      next(err)
    }
  }

  editarPublicacion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { contenido } = req.body
      const actualizada = await container.editarPublicacionComunidad.execute(
        req.params.pubId,
        req.userId,
        contenido
      )
      res.json(actualizada)
    } catch (err) {
      next(err)
    }
  }

  votarEncuesta = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const opcionId = req.body.opcionId
      const resultado = await container.votarEncuestaComunidad.execute(opcionId, req.userId)
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }
  listarMiembros = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const miembros = await container.listarMiembrosComunidad.execute(req.params.id)
      res.json(miembros)
    } catch (err) {
      next(err)
    }
  }

  expulsarMiembro = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { id: comunidadId, usuarioId: objetivoId } = req.params
      await container.expulsarMiembro.execute(comunidadId, objetivoId, req.userId)

      res.json({ mensaje: 'Miembro expulsado' })
    } catch (err) {
      next(err)
    }
  }

  cambiarRol = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { id: comunidadId, usuarioId: objetivoId } = req.params
      const { rol } = req.body
      await container.cambiarRolMiembro.execute(comunidadId, objetivoId, req.userId, rol)

      res.json({ mensaje: 'Rol actualizado' })
    } catch (err) {
      next(err)
    }
  }
  comentar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { pubId } = req.params
      const { contenido } = req.body
      const comentario = await container.comentarPublicacionComunidad.execute(
        pubId,
        req.userId,
        contenido
      )

      res.status(201).json(comentario)
    } catch (err) {
      next(err)
    }
  }

  likePublicacion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      // Placeholder hasta que se implemente el caso de uso de likes
      res.json({ mensaje: 'Like registrado', publicacionId: req.params.pubId })
    } catch (err) {
      next(err)
    }
  }
}
