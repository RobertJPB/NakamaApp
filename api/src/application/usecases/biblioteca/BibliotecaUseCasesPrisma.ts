import { PrismaClient } from '@prisma/client'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export class ObtenerListaBiblioteca {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(targetUserId: string) {
    const listaPropia = await this.prisma.listaUsuario.findMany({
      where: { usuarioId: targetUserId },
      include: { anime: true }
    })
    const colaboraciones = await this.prisma.colaboradorLista.findMany({
      where: { usuarioId: targetUserId },
      include: { columna: true }
    })

    const listasAjenas = []
    for (const colab of colaboraciones) {
      const listName = colab.columna.nombre
      const animesAjenos = await this.prisma.listaUsuario.findMany({
        where: { usuarioId: colab.columna.usuarioId, estados: { has: listName } },
        include: { anime: true }
      })
      listasAjenas.push(...animesAjenos)
    }
    return { usuarioId: targetUserId, lista: [...listaPropia, ...listasAjenas] }
  }
}

export class ObtenerColumnasBiblioteca {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(targetUserId: string) {
    let columnas = await this.prisma.columnaKanban.findMany({
      where: { usuarioId: targetUserId },
      orderBy: { orden: 'asc' }
    })
    if (columnas.length === 0) {
      const defaultNames = ["Me gusta", "Por ver", "Viendo", "Terminado"]
      const inserts = defaultNames.map((nombre, idx) => ({ usuarioId: targetUserId, nombre, orden: idx }))
      await this.prisma.columnaKanban.createMany({ data: inserts })
      columnas = await this.prisma.columnaKanban.findMany({
        where: { usuarioId: targetUserId },
        orderBy: { orden: 'asc' }
      })
    }
    const colaboraciones = await this.prisma.colaboradorLista.findMany({
      where: { usuarioId: targetUserId },
      include: { columna: { include: { usuario: true } } }
    })
    const columnasColaboradas = colaboraciones.map((c: any) => ({ ...c.columna, esColaborativa: true, propietario: c.columna.usuario }))
    
    const guardadas = await this.prisma.listaGuardada.findMany({
      where: { usuarioId: targetUserId },
      include: { columna: { include: { usuario: true } } }
    })
    const columnasGuardadas = guardadas.map((g: any) => ({ ...g.columna, esGuardada: true, propietario: g.columna.usuario }))
    
    return { usuarioId: targetUserId, columnas: [...columnas, ...columnasColaboradas, ...columnasGuardadas] }
  }
}

export class GuardarColumnaBiblioteca {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(columnaId: string, usuarioId: string) {
    const columna = await this.prisma.columnaKanban.findUnique({ where: { id: columnaId } })
    if (!columna) throw new AppError('Lista no encontrada', 404)
    if (columna.usuarioId === usuarioId) throw new AppError('No puedes guardar tu propia lista', 400)
    await this.prisma.listaGuardada.upsert({
      where: { usuarioId_columnaId: { usuarioId, columnaId } },
      update: {}, create: { usuarioId, columnaId }
    })
  }
}

export class QuitarColumnaGuardada {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(columnaId: string, usuarioId: string) {
    await this.prisma.listaGuardada.delete({
      where: { usuarioId_columnaId: { usuarioId, columnaId } }
    }).catch(() => {})
  }
}

export class GenerarInviteColumna {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(columnaId: string, usuarioId: string) {
    const columna = await this.prisma.columnaKanban.findFirst({ where: { id: columnaId, usuarioId } })
    if (!columna) throw new AppError('Lista no encontrada o no tienes permisos', 404)
    return `${process.env.FRONTEND_URL || 'http://localhost:3001'}/lista/invite/${columnaId}`
  }
}

export class AceptarInviteColumna {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(columnaId: string, usuarioId: string) {
    const columna = await this.prisma.columnaKanban.findUnique({ where: { id: columnaId } })
    if (!columna) throw new AppError('Lista no encontrada', 404)
    if (columna.usuarioId === usuarioId) throw new AppError('No puedes colaborar en tu propia lista', 400)
    const existente = await this.prisma.colaboradorLista.findUnique({
      where: { columnaId_usuarioId: { columnaId, usuarioId } }
    })
    if (!existente) {
      await this.prisma.colaboradorLista.create({ data: { columnaId, usuarioId } })
    }
  }
}

export class CrearColumnaBiblioteca {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(usuarioId: string, dto: { nombre: string, descripcion?: string, imagenUrl?: string }) {
    const count = await this.prisma.columnaKanban.count({ where: { usuarioId } })
    return this.prisma.columnaKanban.create({
      data: { usuarioId, nombre: dto.nombre, descripcion: dto.descripcion, imagenUrl: dto.imagenUrl, orden: count }
    })
  }
}

export class ActualizarColumnaBiblioteca {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(columnaId: string, usuarioId: string, dto: any) {
    const columna = await this.prisma.columnaKanban.findFirst({ where: { id: columnaId, usuarioId } })
    if (!columna) throw new AppError('Lista no encontrada o no tienes permisos', 404)
    return this.prisma.columnaKanban.update({
      where: { id: columnaId },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre : columna.nombre,
        descripcion: dto.descripcion !== undefined ? dto.descripcion : columna.descripcion,
        imagenUrl: dto.imagenUrl !== undefined ? dto.imagenUrl : columna.imagenUrl,
        esPrivada: dto.esPrivada !== undefined ? dto.esPrivada : columna.esPrivada
      }
    })
  }
}

export class VerificarColaborador {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(usuarioId: string, propietarioId: string, estado?: string) {
    if (!estado) {
      const esColab = await this.prisma.colaboradorLista.findFirst({
        where: { usuarioId, columna: { usuarioId: propietarioId } }
      })
      if (!esColab) throw new AppError('No tienes permisos', 403)
      return
    }
    const esColab = await this.prisma.colaboradorLista.findFirst({
      where: { usuarioId, columna: { usuarioId: propietarioId, nombre: estado } }
    })
    if (!esColab) throw new AppError('No tienes permisos para editar esta lista', 403)
  }
}

export class ToggleFavoritoBiblioteca {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(animeId: string, usuarioId: string) {
    let entrada = await this.prisma.listaUsuario.findUnique({
      where: { usuarioId_animeId: { usuarioId, animeId } }
    })
    if (!entrada) {
      const favsCount = await this.prisma.listaUsuario.count({ where: { usuarioId, esFavorito: true } })
      if (favsCount >= 5) throw new AppError('Límite de 5 favoritos alcanzado. Elimina uno primero.', 400)
      entrada = await this.prisma.listaUsuario.create({
        data: { usuarioId, animeId, estados: ['Por ver'], esFavorito: true }
      })
      return { mensaje: 'Añadido a favoritos', esFavorito: true }
    }
    if (!entrada.esFavorito) {
      const favsCount = await this.prisma.listaUsuario.count({ where: { usuarioId, esFavorito: true } })
      if (favsCount >= 5) throw new AppError('Límite de 5 favoritos alcanzado. Elimina uno primero.', 400)
    }
    const nuevoEstado = !entrada.esFavorito
    await this.prisma.listaUsuario.update({ where: { id: entrada.id }, data: { esFavorito: nuevoEstado } })
    return { mensaje: nuevoEstado ? 'Añadido a favoritos' : 'Eliminado de favoritos', esFavorito: nuevoEstado }
  }
}
