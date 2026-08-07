import { prisma } from '../database/prisma/client'
import { IFeedRepository } from '../../domain/repositories/IFeedRepository'
import { AppError } from '../../presentation/middlewares/error.middleware'

export class PrismaFeedRepository implements IFeedRepository {
  async crearPublicacion(dto: {
    usuarioId: string
    contenido?: string
    tema?: string
    soloAmigos?: boolean
    tipo?: string
    opciones?: string[]
    imagenUrl?: string
  }): Promise<any> {
    const nuevaPub = await prisma.publicacion.create({
      data: {
        usuarioId: dto.usuarioId,
        contenido: dto.contenido,
        tema: dto.tema,
        soloAmigos: Boolean(dto.soloAmigos),
        tipo: (dto.tipo || 'texto') as any,
        imagenUrl: dto.imagenUrl,
        opciones:
          dto.tipo === 'encuesta' && dto.opciones && dto.opciones.length > 0
            ? {
                create: dto.opciones.map((opt: string) => ({ texto: opt })),
              }
            : undefined,
      },
      include: { usuario: true, opciones: true },
    })
    await prisma.feed.create({
      data: {
        usuarioId: dto.usuarioId,
        tipo: 'publicacion',
        referenciaId: nuevaPub.id,
        actorId: dto.usuarioId,
      },
    })
    return nuevaPub
  }

  async eliminarPublicacion(id: string, usuarioId: string): Promise<void> {
    await prisma.publicacion.deleteMany({ where: { id, usuarioId } })
    await prisma.feed.deleteMany({ where: { tipo: 'publicacion', referenciaId: id, usuarioId } })
  }

  async eliminarFeedResena(referenciaId: string, usuarioId: string): Promise<void> {
    await prisma.feed.deleteMany({ where: { tipo: 'resena', referenciaId, usuarioId } })
  }

  async toggleLike(id: string, usuarioId: string): Promise<{ accion: 'liked' | 'unliked' }> {
    const existente = await prisma.reaccionPublicacion.findUnique({
      where: { usuarioId_publicacionId: { usuarioId, publicacionId: id } },
    })
    if (existente) {
      await prisma.reaccionPublicacion.delete({
        where: { usuarioId_publicacionId: { usuarioId, publicacionId: id } },
      })
      await prisma.publicacion.update({ where: { id }, data: { totalLikes: { decrement: 1 } } })
      return { accion: 'unliked' }
    } else {
      await prisma.reaccionPublicacion.create({ data: { usuarioId, publicacionId: id } })
      const pub = await prisma.publicacion.update({
        where: { id },
        data: { totalLikes: { increment: 1 } },
      })
      if (pub.usuarioId !== usuarioId) {
        await prisma.notificacion.create({
          data: {
            usuarioId: pub.usuarioId,
            tipo: 'like_resena',
            actorId: usuarioId,
            referenciaId: pub.id,
            mensaje: 'Le dio me gusta a tu publicación.',
          },
        })
      }
      return { accion: 'liked' }
    }
  }

  async obtenerComentarios(tipo: string, id: string): Promise<any[]> {
    const filter = tipo === 'resena' ? { resenaId: id } : { publicacionId: id }
    return prisma.comentario.findMany({
      where: filter,
      include: {
        usuario: { select: { id: true, nombreDisplay: true, username: true, avatarUrl: true } },
      },
      orderBy: { creadoEn: 'asc' },
    })
  }

  async crearComentario(dto: {
    tipo: string
    id: string
    usuarioId: string
    contenido: string
    padreId?: string
  }): Promise<any> {
    const data = {
      usuarioId: dto.usuarioId,
      contenido: dto.contenido,
      padreId: dto.padreId || null,
      ...(dto.tipo === 'resena' ? { resenaId: dto.id } : { publicacionId: dto.id }),
    }
    const nuevo = await prisma.comentario.create({
      data,
      include: {
        usuario: { select: { id: true, nombreDisplay: true, username: true, avatarUrl: true } },
      },
    })

    if (dto.tipo === 'resena') {
      const resena = await prisma.resena.update({
        where: { id: dto.id },
        data: { totalComentarios: { increment: 1 } },
      })
      if (resena.usuarioId !== dto.usuarioId) {
        await prisma.notificacion.create({
          data: {
            usuarioId: resena.usuarioId,
            tipo: 'comentario_publicacion',
            actorId: dto.usuarioId,
            referenciaId: resena.id,
            mensaje: 'Comentó en tu reseña.',
          },
        })
      }
    } else {
      const pub = await prisma.publicacion.update({
        where: { id: dto.id },
        data: { totalComentarios: { increment: 1 } },
      })
      if (pub.usuarioId !== dto.usuarioId) {
        await prisma.notificacion.create({
          data: {
            usuarioId: pub.usuarioId,
            tipo: 'comentario_publicacion',
            actorId: dto.usuarioId,
            referenciaId: pub.id,
            mensaje: 'Comentó en tu publicación.',
          },
        })
      }
    }
    return nuevo
  }

  async eliminarComentario(
    tipo: string,
    id: string,
    comentarioId: string,
    usuarioId: string
  ): Promise<void> {
    const comentario = await prisma.comentario.findUnique({ where: { id: comentarioId } })
    if (!comentario) throw new AppError('No encontrado', 404)
    if (comentario.usuarioId !== usuarioId) throw new AppError('No autorizado', 403)
    await prisma.comentario.delete({ where: { id: comentarioId } })

    if (tipo === 'resena') {
      await prisma.resena.update({ where: { id }, data: { totalComentarios: { decrement: 1 } } })
    } else {
      await prisma.publicacion.update({
        where: { id },
        data: { totalComentarios: { decrement: 1 } },
      })
    }
  }
}
