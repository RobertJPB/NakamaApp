import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container } from '../../infrastructure/container'
import { AppError } from '../middlewares/error.middleware'

export class BibliotecaController {
  getLista = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.usuarioId
      const resultado = await container.obtenerListaBiblioteca.execute(targetUserId)
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  getColumnas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.usuarioId
      const resultado = await container.obtenerColumnasBiblioteca.execute(targetUserId)
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }

  guardarColumna = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { columnaId } = req.params
      await container.guardarColumnaBiblioteca.execute(columnaId, req.userId)

      res.json({ message: 'Lista guardada correctamente' })
    } catch (err) {
      next(err)
    }
  }

  quitarColumnaGuardada = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { columnaId } = req.params
      await container.quitarColumnaGuardada.execute(columnaId, req.userId)

      res.json({ message: 'Lista removida de guardados' })
    } catch (err) {
      next(err)
    }
  }

  generarInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { columnaId } = req.params
      const inviteUrl = await container.generarInviteColumna.execute(columnaId, req.userId)

      res.json({ url: inviteUrl })
    } catch (err) {
      next(err)
    }
  }

  aceptarInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { columnaId } = req.body
      await container.aceptarInviteColumna.execute(columnaId, req.userId)
      res.json({ mensaje: 'Invitación aceptada correctamente' })
    } catch (err) {
      next(err)
    }
  }

  crearColumna = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const nueva = await container.crearColumnaBiblioteca.execute(req.userId, req.body)
      res.status(201).json(nueva)
    } catch (err) {
      next(err)
    }
  }

  actualizarColumna = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const actualizada = await container.actualizarColumnaBiblioteca.execute(
        req.params.columnaId,
        req.userId,
        req.body
      )
      res.json(actualizada)
    } catch (err) {
      next(err)
    }
  }

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = req.params.usuarioId
      const resultado = await container.obtenerListaBiblioteca.execute(targetUserId)
      const entradas = resultado.lista || []

      const conteoPorEstado: Record<string, number> = {}
      let totalEpisodiosVistos = 0
      let favoritos = 0

      for (const entrada of entradas) {
        for (const estado of entrada.estados ?? []) {
          conteoPorEstado[estado] = (conteoPorEstado[estado] ?? 0) + 1
        }
        totalEpisodiosVistos += entrada.episodiosVistos ?? 0
        if (entrada.esFavorito) favoritos++
      }

      res.json({
        usuarioId: targetUserId,
        stats: {
          totalAnimes: entradas.length,
          totalEpisodiosVistos,
          favoritos,
          conteoPorEstado,
        },
      })
    } catch (err) {
      next(err)
    }
  }

  agregar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { propietarioId, animeId, estado, episodiosVistos, esPrivada, notasPrivadas } = req.body
      let targetUserId = req.userId

      if (propietarioId && propietarioId !== req.userId) {
        await container.verificarColaborador.execute(req.userId, propietarioId, estado)
        targetUserId = propietarioId
      }

      const entrada = await container.agregarALista.execute({
        usuarioId: targetUserId,
        animeId: animeId,
        estado: estado,
        episodiosVistos: episodiosVistos,
        esPrivada: esPrivada,
        notasPrivadas: notasPrivadas,
      })
      res.status(201).json(entrada)
    } catch (err) {
      next(err)
    }
  }

  actualizar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { propietarioId: _propietarioId } = req.body
      let targetUserId = req.userId
      // Note: For actualizar, we might need to check if the anime is in a collaborated list.
      // But usually 'actualizar' is for episodes/score, which is more complex in shared lists.
      // For now, allow it if it's their own or they specify propietarioId.
      const entrada = await container.agregarALista.execute({
        usuarioId: targetUserId,
        animeId: req.params.animeId,
        ...req.body,
      })
      res.json(entrada)
    } catch (err) {
      next(err)
    }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { propietarioId, estado: _estado } = req.body
      let targetUserId = req.userId

      // In eliminar, we might just be removing it entirely or removing it from a specific list.
      // Container's eliminarDeLista removes the entire anime from the user's lists.
      // Since a collaborated list is just an 'estado' in the owner's record, removing it entirely
      // might affect other lists of the owner. But wait, `eliminar` is called when they click the trash icon.
      if (propietarioId && propietarioId !== req.userId) {
        await container.verificarColaborador.execute(req.userId, propietarioId)
        targetUserId = propietarioId
      }

      await container.eliminarDeLista.execute({
        usuarioId: targetUserId,
        animeId: req.params.animeId,
      })
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  toggleFavorito = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { animeId } = req.params
      const resultado = await container.toggleFavoritoBiblioteca.execute(animeId, req.userId)
      res.json(resultado)
    } catch (err) {
      next(err)
    }
  }
}
