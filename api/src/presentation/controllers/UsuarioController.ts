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
      res.json({ usuarioId: req.params.id, seguidores: [] })
    } catch (err) { next(err) }
  }

  siguiendo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ usuarioId: req.params.id, siguiendo: [] })
    } catch (err) { next(err) }
  }
}
