import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../infrastructure/auth/SupabaseAuthMiddleware'
import { container }   from '../../infrastructure/container'
import { AppError }    from '../middlewares/error.middleware'

export class BibliotecaController {

  getLista = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const lista = await prisma.listaUsuario.findMany({
        where: { usuarioId: req.params.usuarioId },
        include: { anime: true }
      })
      res.json({ usuarioId: req.params.usuarioId, lista })
    } catch (err) { next(err) }
  }

  getColumnas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const targetUserId = req.params.usuarioId
      
      let columnas = await prisma.columnaKanban.findMany({
        where: { usuarioId: targetUserId },
        orderBy: { orden: 'asc' }
      })
      
      if (columnas.length === 0) {
        const defaultNames = ["Me gusta", "Por ver", "Viendo", "Terminado"]
        const inserts = defaultNames.map((nombre, idx) => ({
          usuarioId: targetUserId,
          nombre,
          orden: idx
        }))
        await prisma.columnaKanban.createMany({ data: inserts })
        columnas = await prisma.columnaKanban.findMany({
          where: { usuarioId: targetUserId },
          orderBy: { orden: 'asc' }
        })
      }
      
      res.json({ usuarioId: targetUserId, columnas })
    } catch (err) { next(err) }
  }

  crearColumna = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { prisma } = require('../../infrastructure/database/prisma/client')
      const count = await prisma.columnaKanban.count({ where: { usuarioId: req.userId } })
      const nueva = await prisma.columnaKanban.create({
        data: {
          usuarioId: req.userId,
          nombre: req.body.nombre,
          descripcion: req.body.descripcion,
          imagenUrl: req.body.imagenUrl,
          orden: count
        }
      })
      res.status(201).json(nueva)
    } catch (err) { next(err) }
  }

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ usuarioId: req.params.usuarioId, stats: {} })
    } catch (err) { next(err) }
  }

  getRuleta = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ usuarioId: req.params.usuarioId, animes: [] })
    } catch (err) { next(err) }
  }

  agregar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const entrada = await container.agregarALista.execute({
        usuarioId:       req.userId,
        animeId:         req.body.animeId,
        estado:          req.body.estado,
        episodiosVistos: req.body.episodiosVistos,
        esPrivada:       req.body.esPrivada,
        notasPrivadas:   req.body.notasPrivadas,
      })
      res.status(201).json(entrada)
    } catch (err) { next(err) }
  }

  actualizar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const entrada = await container.agregarALista.execute({
        usuarioId: req.userId,
        animeId:   req.params.animeId,
        ...req.body,
      })
      res.json(entrada)
    } catch (err) { next(err) }
  }

  eliminar = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      await container.eliminarDeLista.execute({
        usuarioId: req.userId,
        animeId:   req.params.animeId,
      })
      res.status(204).send()
    } catch (err) { next(err) }
  }

  toggleFavorito = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) throw new AppError('No autenticado', 401)
      const { animeId } = req.params
      const { prisma } = require('../../infrastructure/database/prisma/client')

      // Verificar si ya existe en la lista
      let entrada = await prisma.listaUsuario.findUnique({
        where: { usuarioId_animeId: { usuarioId: req.userId, animeId } }
      })

      if (!entrada) {
        // Si no existe, crear con estado 'pendiente' y favorito
        // Pero primero comprobar límite
        const favsCount = await prisma.listaUsuario.count({
          where: { usuarioId: req.userId, esFavorito: true }
        })
        if (favsCount >= 5) {
          throw new AppError('Límite de 5 favoritos alcanzado. Elimina uno primero.', 400)
        }

        entrada = await prisma.listaUsuario.create({
          data: {
            usuarioId: req.userId,
            animeId,
            estado: 'pendiente',
            esFavorito: true
          }
        })
        return res.json({ mensaje: 'Añadido a favoritos', esFavorito: true })
      }

      // Si existe, toggluear
      if (!entrada.esFavorito) {
        const favsCount = await prisma.listaUsuario.count({
          where: { usuarioId: req.userId, esFavorito: true }
        })
        if (favsCount >= 5) {
          throw new AppError('Límite de 5 favoritos alcanzado. Elimina uno primero.', 400)
        }
      }

      const nuevoEstado = !entrada.esFavorito
      await prisma.listaUsuario.update({
        where: { id: entrada.id },
        data: { esFavorito: nuevoEstado }
      })

      res.json({ 
        mensaje: nuevoEstado ? 'Añadido a favoritos' : 'Eliminado de favoritos',
        esFavorito: nuevoEstado
      })
    } catch (err) { next(err) }
  }
}
