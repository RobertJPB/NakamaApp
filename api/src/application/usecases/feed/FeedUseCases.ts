import { PrismaClient } from '@prisma/client'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export class CrearPublicacionFeed {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(dto: { usuarioId: string; contenido?: string; tema?: string; soloAmigos?: boolean; tipo?: string; opciones?: string[]; imagenUrl?: string }) {
    const nuevaPub = await this.prisma.publicacion.create({
      data: {
        usuarioId: dto.usuarioId,
        contenido: dto.contenido,
        tema: dto.tema,
        soloAmigos: Boolean(dto.soloAmigos),
        tipo: (dto.tipo || 'texto') as any,
        imagenUrl: dto.imagenUrl,
        opciones: (dto.tipo === 'encuesta' && dto.opciones && dto.opciones.length > 0) ? {
          create: dto.opciones.map((opt: string) => ({ texto: opt }))
        } : undefined
      },
      include: { usuario: true, opciones: true }
    })
    await this.prisma.feed.create({
      data: {
        usuarioId: dto.usuarioId,
        tipo: 'publicacion',
        referenciaId: nuevaPub.id,
        actorId: dto.usuarioId
      }
    })
    return nuevaPub
  }
}

export class EliminarPublicacionFeed {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(id: string, usuarioId: string) {
    await this.prisma.publicacion.deleteMany({ where: { id, usuarioId } })
    await this.prisma.feed.deleteMany({ where: { tipo: 'publicacion', referenciaId: id, usuarioId } })
  }
}

export class ToggleLikePublicacion {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(id: string, usuarioId: string) {
    const existente = await this.prisma.reaccionPublicacion.findUnique({ where: { usuarioId_publicacionId: { usuarioId, publicacionId: id } } })
    if (existente) {
      await this.prisma.reaccionPublicacion.delete({ where: { usuarioId_publicacionId: { usuarioId, publicacionId: id } } })
      await this.prisma.publicacion.update({ where: { id }, data: { totalLikes: { decrement: 1 } } })
      return { accion: 'unliked' }
    } else {
      await this.prisma.reaccionPublicacion.create({ data: { usuarioId, publicacionId: id } })
      const pub = await this.prisma.publicacion.update({ where: { id }, data: { totalLikes: { increment: 1 } } })
      if (pub.usuarioId !== usuarioId) {
        await this.prisma.notificacion.create({
          data: {
            usuarioId: pub.usuarioId,
            tipo: 'like_resena', 
            actorId: usuarioId,
            referenciaId: pub.id,
            mensaje: 'Le dio me gusta a tu publicación.'
          }
        })
      }
      return { accion: 'liked' }
    }
  }
}

export class ObtenerComentarios {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(tipo: string, id: string) {
    const filter = tipo === 'resena' ? { resenaId: id } : { publicacionId: id }
    return this.prisma.comentario.findMany({
      where: filter,
      include: { usuario: { select: { id: true, nombreDisplay: true, username: true, avatarUrl: true } } },
      orderBy: { creadoEn: 'asc' }
    })
  }
}

export class CrearComentario {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(dto: { tipo: string; id: string; usuarioId: string; contenido: string; padreId?: string }) {
    const data = {
      usuarioId: dto.usuarioId,
      contenido: dto.contenido,
      padreId: dto.padreId || null,
      ...(dto.tipo === 'resena' ? { resenaId: dto.id } : { publicacionId: dto.id })
    }
    const nuevo = await this.prisma.comentario.create({
      data,
      include: { usuario: { select: { id: true, nombreDisplay: true, username: true, avatarUrl: true } } }
    })

    if (dto.tipo === 'resena') {
      const resena = await this.prisma.resena.update({ where: { id: dto.id }, data: { totalComentarios: { increment: 1 } } })
      if (resena.usuarioId !== dto.usuarioId) {
        await this.prisma.notificacion.create({
          data: {
            usuarioId: resena.usuarioId,
            tipo: 'comentario_publicacion',
            actorId: dto.usuarioId,
            referenciaId: resena.id,
            mensaje: 'Comentó en tu reseña.'
          }
        })
      }
    } else {
      const pub = await this.prisma.publicacion.update({ where: { id: dto.id }, data: { totalComentarios: { increment: 1 } } })
      if (pub.usuarioId !== dto.usuarioId) {
        await this.prisma.notificacion.create({
          data: {
            usuarioId: pub.usuarioId,
            tipo: 'comentario_publicacion',
            actorId: dto.usuarioId,
            referenciaId: pub.id,
            mensaje: 'Comentó en tu publicación.'
          }
        })
      }
    }
    return nuevo
  }
}

export class EliminarComentario {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(tipo: string, id: string, comentarioId: string, usuarioId: string) {
    const comentario = await this.prisma.comentario.findUnique({ where: { id: comentarioId } })
    if (!comentario) throw new AppError('No encontrado', 404)
    if (comentario.usuarioId !== usuarioId) throw new AppError('No autorizado', 403)
    await this.prisma.comentario.delete({ where: { id: comentarioId } })

    if (tipo === 'resena') {
      await this.prisma.resena.update({ where: { id }, data: { totalComentarios: { decrement: 1 } } })
    } else {
      await this.prisma.publicacion.update({ where: { id }, data: { totalComentarios: { decrement: 1 } } })
    }
  }
}
