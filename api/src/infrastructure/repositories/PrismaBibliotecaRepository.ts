import { prisma } from '../database/prisma/client'
import { IBibliotecaRepository } from '../../domain/repositories/IBibliotecaRepository'
import { AppError } from '../../presentation/middlewares/error.middleware'
import { env } from '../../config/env'

export class PrismaBibliotecaRepository implements IBibliotecaRepository {
  async obtenerLista(targetUserId: string): Promise<{ usuarioId: string; lista: any[] }> {
    const listaPropia = await prisma.listaUsuario.findMany({
      where: { usuarioId: targetUserId },
      include: { anime: true },
    })
    const colaboraciones = await prisma.colaboradorLista.findMany({
      where: { usuarioId: targetUserId },
      include: { columna: true },
    })

    // Una sola consulta para todas las colaboraciones (evita N+1).
    let listasAjenas: any[] = []
    if (colaboraciones.length > 0) {
      const condiciones = colaboraciones.map((colab) => ({
        usuarioId: colab.columna.usuarioId,
        estados: { has: colab.columna.nombre },
      }))
      listasAjenas = await prisma.listaUsuario.findMany({
        where: { OR: condiciones },
        include: { anime: true },
      })
    }
    return { usuarioId: targetUserId, lista: [...listaPropia, ...listasAjenas] }
  }

  async obtenerColumnas(targetUserId: string): Promise<{ usuarioId: string; columnas: any[] }> {
    let columnas = await prisma.columnaKanban.findMany({
      where: { usuarioId: targetUserId },
      orderBy: { orden: 'asc' },
    })
    if (columnas.length === 0) {
      const defaultNames = ['Me gusta', 'Por ver', 'Viendo', 'Terminado']
      const inserts = defaultNames.map((nombre, idx) => ({
        usuarioId: targetUserId,
        nombre,
        orden: idx,
      }))
      await prisma.columnaKanban.createMany({ data: inserts })
      columnas = await prisma.columnaKanban.findMany({
        where: { usuarioId: targetUserId },
        orderBy: { orden: 'asc' },
      })
    }
    const colaboraciones = await prisma.colaboradorLista.findMany({
      where: { usuarioId: targetUserId },
      include: { columna: { include: { usuario: true } } },
    })
    const columnasColaboradas = colaboraciones.map((c: any) => ({
      ...c.columna,
      esColaborativa: true,
      propietario: c.columna.usuario,
    }))

    const guardadas = await prisma.listaGuardada.findMany({
      where: { usuarioId: targetUserId },
      include: { columna: { include: { usuario: true } } },
    })
    const columnasGuardadas = guardadas.map((g: any) => ({
      ...g.columna,
      esGuardada: true,
      propietario: g.columna.usuario,
    }))

    return {
      usuarioId: targetUserId,
      columnas: [...columnas, ...columnasColaboradas, ...columnasGuardadas],
    }
  }

  async guardarColumna(columnaId: string, usuarioId: string): Promise<void> {
    const columna = await prisma.columnaKanban.findUnique({ where: { id: columnaId } })
    if (!columna) throw new AppError('Lista no encontrada', 404)
    if (columna.usuarioId === usuarioId)
      throw new AppError('No puedes guardar tu propia lista', 400)
    await prisma.listaGuardada.upsert({
      where: { usuarioId_columnaId: { usuarioId, columnaId } },
      update: {},
      create: { usuarioId, columnaId },
    })
  }

  async quitarColumnaGuardada(columnaId: string, usuarioId: string): Promise<void> {
    await prisma.listaGuardada
      .delete({
        where: { usuarioId_columnaId: { usuarioId, columnaId } },
      })
      .catch(() => {})
  }

  async generarInvite(columnaId: string, usuarioId: string): Promise<string> {
    const columna = await prisma.columnaKanban.findFirst({ where: { id: columnaId, usuarioId } })
    if (!columna) throw new AppError('Lista no encontrada o no tienes permisos', 404)
    return `${env.FRONTEND_URL}/lista/invite/${columnaId}`
  }

  async aceptarInvite(columnaId: string, usuarioId: string): Promise<void> {
    const columna = await prisma.columnaKanban.findUnique({ where: { id: columnaId } })
    if (!columna) throw new AppError('Lista no encontrada', 404)
    if (columna.usuarioId === usuarioId)
      throw new AppError('No puedes colaborar en tu propia lista', 400)
    const existente = await prisma.colaboradorLista.findUnique({
      where: { columnaId_usuarioId: { columnaId, usuarioId } },
    })
    if (!existente) {
      await prisma.colaboradorLista.create({ data: { columnaId, usuarioId } })
    }
  }

  async crearColumna(
    usuarioId: string,
    dto: { nombre: string; descripcion?: string; imagenUrl?: string }
  ): Promise<any> {
    const count = await prisma.columnaKanban.count({ where: { usuarioId } })
    return prisma.columnaKanban.create({
      data: {
        usuarioId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        imagenUrl: dto.imagenUrl,
        orden: count,
      },
    })
  }

  async actualizarColumna(columnaId: string, usuarioId: string, dto: any): Promise<any> {
    const columna = await prisma.columnaKanban.findFirst({ where: { id: columnaId, usuarioId } })
    if (!columna) throw new AppError('Lista no encontrada o no tienes permisos', 404)
    return prisma.columnaKanban.update({
      where: { id: columnaId },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre : columna.nombre,
        descripcion: dto.descripcion !== undefined ? dto.descripcion : columna.descripcion,
        imagenUrl: dto.imagenUrl !== undefined ? dto.imagenUrl : columna.imagenUrl,
        esPrivada: dto.esPrivada !== undefined ? dto.esPrivada : columna.esPrivada,
      },
    })
  }

  async verificarColaborador(
    usuarioId: string,
    propietarioId: string,
    estado?: string
  ): Promise<void> {
    if (!estado) {
      const esColab = await prisma.colaboradorLista.findFirst({
        where: { usuarioId, columna: { usuarioId: propietarioId } },
      })
      if (!esColab) throw new AppError('No tienes permisos', 403)
      return
    }
    const esColab = await prisma.colaboradorLista.findFirst({
      where: { usuarioId, columna: { usuarioId: propietarioId, nombre: estado } },
    })
    if (!esColab) throw new AppError('No tienes permisos para editar esta lista', 403)
  }

  async toggleFavorito(
    animeId: string,
    usuarioId: string
  ): Promise<{ mensaje: string; esFavorito: boolean }> {
    let entrada = await prisma.listaUsuario.findUnique({
      where: { usuarioId_animeId: { usuarioId, animeId } },
    })
    if (!entrada) {
      const favsCount = await prisma.listaUsuario.count({ where: { usuarioId, esFavorito: true } })
      if (favsCount >= 4)
        throw new AppError('Límite de 4 favoritos alcanzado. Elimina uno primero.', 400)
      entrada = await prisma.listaUsuario.create({
        data: { usuarioId, animeId, estados: ['Por ver'], esFavorito: true },
      })
      return { mensaje: 'Añadido a favoritos', esFavorito: true }
    }
    if (!entrada.esFavorito) {
      const favsCount = await prisma.listaUsuario.count({ where: { usuarioId, esFavorito: true } })
      if (favsCount >= 4)
        throw new AppError('Límite de 4 favoritos alcanzado. Elimina uno primero.', 400)
    }
    const nuevoEstado = !entrada.esFavorito
    await prisma.listaUsuario.update({
      where: { id: entrada.id },
      data: { esFavorito: nuevoEstado },
    })
    return {
      mensaje: nuevoEstado ? 'Añadido a favoritos' : 'Eliminado de favoritos',
      esFavorito: nuevoEstado,
    }
  }
}
