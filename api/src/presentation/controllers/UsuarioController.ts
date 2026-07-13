import { Request, Response, NextFunction } from 'express'
import { AuthRequest }   from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }     from '../../infrastructure/container'
import { AppError }      from '../middlewares/error.middleware'

export class UsuarioController {

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

  perfil = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ username: req.params.username })
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
