import { prisma } from '../database/prisma/client'
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository'
import { Usuario } from '../../domain/entities/Usuario'

export class PrismaUsuarioRepository implements IUsuarioRepository {
  private mapear(raw: any): Usuario {
    return {
      id: raw.id,
      email: raw.email,
      username: raw.username,
      nombreDisplay: raw.nombreDisplay,
      avatarUrl: raw.avatarUrl ?? undefined,
      bannerUrl: raw.bannerUrl ?? undefined,
      marcoUrl: raw.marcoUrl ?? undefined,
      bio: raw.bio ?? undefined,
      sitioWeb: raw.sitioWeb ?? undefined,
      perfilPrivado: raw.perfilPrivado,
      resenasPublicas: raw.resenasPublicas,
      listasPublicas: raw.listasPublicas,
      creadoEn: raw.creadoEn,
      actualizadoEn: raw.actualizadoEn,
      ultimoAcceso: raw.ultimoAcceso ?? undefined,
    }
  }

  async findById(id: string): Promise<Usuario | null> {
    const raw = await prisma.usuario.findUnique({ where: { id } })
    return raw ? this.mapear(raw) : null
  }

  async findByUsername(username: string): Promise<Usuario | null> {
    const raw = await prisma.usuario.findUnique({ where: { username } })
    return raw ? this.mapear(raw) : null
  }

  async create(data: Partial<Usuario>): Promise<Usuario> {
    const raw = await prisma.usuario.create({
      data: {
        id: data.id!,
        email: data.email!,
        username: data.username!,
        nombreDisplay: data.nombreDisplay!,
      },
    })
    return this.mapear(raw)
  }

  async update(id: string, data: Partial<Usuario>): Promise<Usuario> {
    const raw = await prisma.usuario.update({
      where: { id },
      data: {
        username: data.username,
        nombreDisplay: data.nombreDisplay,
        bio: data.bio,
        sitioWeb: data.sitioWeb,
        avatarUrl: data.avatarUrl,
        bannerUrl: data.bannerUrl,
        marcoUrl: data.marcoUrl,
        perfilPrivado: data.perfilPrivado,
        resenasPublicas: data.resenasPublicas,
        listasPublicas: data.listasPublicas,
      },
    })
    return this.mapear(raw)
  }

  async delete(id: string): Promise<void> {
    await prisma.usuario.delete({ where: { id } })
  }

  async getSeguidores(usuarioId: string): Promise<Usuario[]> {
    const rows = await prisma.seguidor.findMany({
      where: { seguidoId: usuarioId, estado: 'aceptado' },
      include: { seguidor: true },
    })
    return rows.map((r: any) => this.mapear(r.seguidor))
  }

  async getSiguiendo(usuarioId: string): Promise<Usuario[]> {
    const rows = await prisma.seguidor.findMany({
      where: { seguidorId: usuarioId, estado: 'aceptado' },
      include: { seguido: true },
    })
    return rows.map((r: any) => this.mapear(r.seguido))
  }

  async toggleSeguir(seguidorId: string, seguidoId: string) {
    const existente = await prisma.seguidor.findUnique({
      where: { seguidorId_seguidoId: { seguidorId, seguidoId } },
    })

    if (existente) {
      await prisma.seguidor.delete({
        where: { seguidorId_seguidoId: { seguidorId, seguidoId } },
      })
      return { accion: 'dejado' as const }
    }

    const objetivo = await prisma.usuario.findUnique({ where: { id: seguidoId } })
    const estado = objetivo?.perfilPrivado ? 'pendiente' : 'aceptado'

    await prisma.seguidor.create({
      data: { seguidorId, seguidoId, estado },
    })

    if (estado === 'aceptado') {
      await prisma.notificacion.create({
        data: {
          usuarioId: seguidoId,
          tipo: 'nuevo_seguidor',
          actorId: seguidorId,
          mensaje: 'Ha comenzado a seguirte',
        },
      })
    }

    return { accion: estado === 'pendiente' ? ('pendiente' as const) : ('seguido' as const) }
  }

  async findByIdRaw(id: string): Promise<any | null> {
    return prisma.usuario.findUnique({ where: { id } })
  }

  async findPerfilPorUsername(username: string): Promise<any | null> {
    return prisma.usuario.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            seguidores: true,
            siguiendo: true,
            lista: true,
            resenas: true,
          },
        },
      },
    })
  }

  async obtenerEstadoSeguimiento(
    seguidorId: string,
    seguidoId: string
  ): Promise<string | undefined> {
    const relacion = await prisma.seguidor.findUnique({
      where: {
        seguidorId_seguidoId: {
          seguidorId,
          seguidoId,
        },
      },
    })
    return relacion?.estado
  }

  async findSeguidores(id: string): Promise<any[]> {
    return prisma.seguidor.findMany({
      where: { seguidoId: id },
      include: {
        seguidor: {
          select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, bio: true },
        },
      },
    })
  }

  async findSiguiendo(id: string): Promise<any[]> {
    return prisma.seguidor.findMany({
      where: { seguidorId: id },
      include: {
        seguido: {
          select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, bio: true },
        },
      },
    })
  }

  async buscarUsuarios(q: string): Promise<any[]> {
    return prisma.usuario.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { nombreDisplay: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        username: true,
        nombreDisplay: true,
        avatarUrl: true,
        marcoUrl: true,
        _count: { select: { seguidores: true } },
      },
      orderBy: { creadoEn: 'desc' },
    })
  }

  async findSeguidoIds(seguidorId: string): Promise<string[]> {
    const siguiendo = await prisma.seguidor.findMany({
      where: { seguidorId },
      select: { seguidoId: true },
    })
    return siguiendo.map((s: any) => s.seguidoId)
  }

  async findSugeridos(excludedIds: string[], take: number): Promise<any[]> {
    return prisma.usuario.findMany({
      where: { id: { notIn: excludedIds } },
      take,
      select: {
        id: true,
        username: true,
        nombreDisplay: true,
        avatarUrl: true,
        marcoUrl: true,
        bio: true,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    })
  }

  async findActividad(
    usuarioId: string,
    viewerId: string | undefined,
    cursor: string | null,
    limit: number
  ): Promise<{ publicaciones: any[]; resenas: any[] }> {
    const cursorWhere: any = {}
    if (cursor) {
      const fecha = new Date(cursor)
      if (!isNaN(fecha.getTime())) cursorWhere.creadoEn = { lt: fecha }
    }

    const publicaciones = await prisma.publicacion.findMany({
      where: {
        OR: [{ usuarioId }, { reacciones: { some: { usuarioId } } }],
        ...cursorWhere,
      },
      take: limit,
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombreDisplay: true,
            avatarUrl: true,
            marcoUrl: true,
          },
        },
        comunidad: { select: { nombre: true, imagenUrl: true } },
        resena: {
          include: {
            anime: { select: { id: true, titulo: true, externalId: true, imagenUrl: true } },
          },
        },
        resenaPersonaje: {
          include: {
            anime: { select: { titulo: true, externalId: true } },
            personaje: { select: { nombre: true, imagenUrl: true } }
          }
        },
        opciones: {
          include: { votosUsuarios: true },
        },
        reacciones: viewerId ? { where: { usuarioId: viewerId } } : false,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                username: true,
                nombreDisplay: true,
                avatarUrl: true,
                marcoUrl: true,
              },
            },
          },
          orderBy: { creadoEn: 'asc' },
        },
      },
    })

    const resenas = await prisma.resena.findMany({
      where: {
        OR: [{ usuarioId }, { reacciones: { some: { usuarioId } } }],
        ...cursorWhere,
      },
      take: limit,
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            username: true,
            nombreDisplay: true,
            avatarUrl: true,
            marcoUrl: true,
          },
        },
        anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
        reacciones: viewerId ? { where: { usuarioId: viewerId } } : false,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                username: true,
                nombreDisplay: true,
                avatarUrl: true,
                marcoUrl: true,
              },
            },
          },
          orderBy: { creadoEn: 'asc' },
        },
      },
    })

    return { publicaciones, resenas }
  }
}
