import { prisma }               from '../database/prisma/client'
import { IComunidadRepository } from '../../domain/repositories/IComunidadRepository'
import { Comunidad }            from '../../domain/entities/Comunidad'
import { AppError }             from '../../presentation/middlewares/error.middleware'

export class PrismaComunidadRepository implements IComunidadRepository {

  private mapear(raw: any): Comunidad {
    return {
      id:            raw.id,
      nombre:        raw.nombre,
      descripcion:   raw.descripcion  ?? undefined,
      imagenUrl:     raw.imagenUrl    ?? undefined,
      bannerUrl:     raw.bannerUrl    ?? undefined,
      tipo:          raw.tipo,
      referenciaId:  raw.referenciaId ?? undefined,
      esOficial:     raw.esOficial,
      totalMiembros: raw.totalMiembros,
      creadoPor:     raw.creadoPor    ?? undefined,
      creadoEn:      raw.creadoEn,
    }
  }

  async findById(id: string): Promise<Comunidad | null> {
    const raw = await prisma.comunidad.findUnique({ where: { id } })
    return raw ? this.mapear(raw) : null
  }

  async findMany(tipo?: string, page = 1, limit = 20): Promise<Comunidad[]> {
    const rows = await prisma.comunidad.findMany({
      where:   tipo ? { tipo: tipo as import('@prisma/client').TipoComunidad } : {},
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { totalMiembros: 'desc' },
    })
    return rows.map(this.mapear)
  }

  async create(data: Partial<Comunidad>): Promise<Comunidad> {
    const raw = await prisma.comunidad.create({
      data: {
        nombre:       data.nombre!,
        descripcion:  data.descripcion,
        imagenUrl:    data.imagenUrl,
        bannerUrl:    data.bannerUrl,
        tipo:         data.tipo!,
        referenciaId: data.referenciaId,
        creadoPor:    data.creadoPor,
        totalMiembros: data.creadoPor ? 1 : 0,
      },
    })
    // El creador se une automáticamente como admin
    if (data.creadoPor) {
      await prisma.miembro.create({
        data: { usuarioId: data.creadoPor, comunidadId: raw.id, rol: 'admin' },
      })
    }
    return this.mapear(raw)
  }

  async update(id: string, data: Partial<Comunidad>): Promise<Comunidad> {
    const raw = await prisma.comunidad.update({
      where: { id },
      data:  { 
        descripcion: data.descripcion, 
        imagenUrl: data.imagenUrl,
        bannerUrl: data.bannerUrl,
        tipo: data.tipo 
      },
    })
    return this.mapear(raw)
  }

  async delete(id: string): Promise<void> {
    await prisma.comunidad.delete({ where: { id } })
  }

  async unirse(usuarioId: string, comunidadId: string): Promise<void> {
    const yaEs = await this.esMiembro(usuarioId, comunidadId)
    if (!yaEs) {
      await prisma.miembro.create({
        data: { usuarioId, comunidadId }
      })
      const total = await prisma.miembro.count({ where: { comunidadId } })
      await prisma.comunidad.update({
        where: { id: comunidadId },
        data: { totalMiembros: total }
      })
    }
  }

  async salir(usuarioId: string, comunidadId: string): Promise<void> {
    const yaEs = await this.esMiembro(usuarioId, comunidadId)
    if (yaEs) {
      await prisma.miembro.delete({
        where: { usuarioId_comunidadId: { usuarioId, comunidadId } }
      })
      const total = await prisma.miembro.count({ where: { comunidadId } })
      await prisma.comunidad.update({
        where: { id: comunidadId },
        data: { totalMiembros: total }
      })
    }
  }

  async esMiembro(usuarioId: string, comunidadId: string): Promise<boolean> {
    const m = await prisma.miembro.findUnique({
      where: { usuarioId_comunidadId: { usuarioId, comunidadId } },
    })
    return !!m
  }

  async buscar(q: string): Promise<any[]> {
    return prisma.comunidad.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { descripcion: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 50,
      include: {
        creador: { select: { username: true, nombreDisplay: true, avatarUrl: true } },
        _count: { select: { miembros: true, publicaciones: true } }
      },
      orderBy: { creadoEn: 'desc' }
    })
  }

  async listarPublicaciones(comunidadId: string, seccion?: string, page = 1, limit = 20): Promise<any[]> {
    const skip = (page - 1) * limit
    const whereClause: any = { comunidadId }
    if (seccion) whereClause.tema = seccion

    return prisma.publicacion.findMany({
      where: whereClause,
      include: {
        usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } },
        opciones: { include: { votosUsuarios: { select: { usuarioId: true } } } },
        resena: { include: { anime: { select: { id: true, titulo: true, imagenUrl: true } } } }
      },
      orderBy: { creadoEn: 'desc' },
      skip, take: limit
    })
  }

  async crearPublicacion(dto: any): Promise<any> {
    return prisma.publicacion.create({
      data: {
        comunidadId: dto.comunidadId,
        usuarioId: dto.usuarioId,
        tipo: dto.tipo || 'texto',
        tema: dto.seccion || null,
        titulo: dto.titulo,
        contenido: dto.contenido,
        imagenUrl: dto.imagenUrl,
        resenaId: dto.resenaId,
        opciones: (dto.tipo === 'encuesta' && dto.opciones && dto.opciones.length > 0) ? {
          create: dto.opciones.map((opt: any) => ({
            texto: typeof opt === 'string' ? opt : opt.texto,
            imagenUrl: typeof opt === 'string' ? undefined : opt.imagenUrl
          }))
        } : undefined
      },
      include: {
        usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } },
        opciones: true,
        resena: true
      }
    })
  }

  async eliminarPublicacion(pubId: string, usuarioId: string): Promise<void> {
    const pub = await prisma.publicacion.findUnique({ where: { id: pubId } })
    if (!pub) throw new AppError('Publicación no encontrada', 404)

    let autorizado = pub.usuarioId === usuarioId
    if (!autorizado && pub.comunidadId) {
      const miembro = await prisma.miembro.findUnique({
        where: { usuarioId_comunidadId: { usuarioId, comunidadId: pub.comunidadId } }
      })
      if (miembro && (miembro.rol === 'admin' || miembro.rol === 'moderador')) {
        autorizado = true
      }
    }
    if (!autorizado) throw new AppError('No autorizado', 403)
    await prisma.publicacion.delete({ where: { id: pubId } })
  }

  async editarPublicacion(pubId: string, usuarioId: string, contenido: string): Promise<any> {
    if (!contenido || contenido.trim() === '') throw new AppError('El contenido no puede estar vacío', 400)
    const pub = await prisma.publicacion.findUnique({ where: { id: pubId } })
    if (!pub) throw new AppError('Publicación no encontrada', 404)
    if (pub.usuarioId !== usuarioId) throw new AppError('No autorizado para editar', 403)
    return prisma.publicacion.update({
      where: { id: pubId },
      data: { contenido: contenido.trim() }
    })
  }

  async votarEncuesta(opcionId: string, usuarioId: string): Promise<{ accion: string }> {
    const opcion = await prisma.opcionEncuesta.findUnique({ where: { id: opcionId } })
    if (!opcion) throw new AppError('Opción no encontrada', 404)

    const votoPrevio = await prisma.votoEncuesta.findFirst({
      where: { usuarioId, opcion: { publicacionId: opcion.publicacionId } }
    })

    if (votoPrevio) {
      if (votoPrevio.opcionId === opcionId) {
        await prisma.$transaction([
          prisma.votoEncuesta.delete({ where: { usuarioId_opcionId: { usuarioId, opcionId: votoPrevio.opcionId } } }),
          prisma.opcionEncuesta.update({ where: { id: votoPrevio.opcionId }, data: { votos: { decrement: 1 } } })
        ])
        return { accion: 'unvoted' }
      } else {
        await prisma.$transaction([
          prisma.votoEncuesta.delete({ where: { usuarioId_opcionId: { usuarioId, opcionId: votoPrevio.opcionId } } }),
          prisma.opcionEncuesta.update({ where: { id: votoPrevio.opcionId }, data: { votos: { decrement: 1 } } }),
          prisma.votoEncuesta.create({ data: { usuarioId, opcionId } }),
          prisma.opcionEncuesta.update({ where: { id: opcionId }, data: { votos: { increment: 1 } } })
        ])
        return { accion: 'changed' }
      }
    }

    await prisma.$transaction([
      prisma.votoEncuesta.create({ data: { usuarioId, opcionId } }),
      prisma.opcionEncuesta.update({ where: { id: opcionId }, data: { votos: { increment: 1 } } })
    ])
    return { accion: 'voted' }
  }

  async listarMiembros(comunidadId: string): Promise<any[]> {
    return prisma.miembro.findMany({
      where: { comunidadId },
      include: {
        usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } }
      },
      orderBy: [
        { rol: 'asc' },
        { unidoEn: 'desc' }
      ]
    })
  }

  async expulsarMiembro(comunidadId: string, objetivoId: string, adminId: string): Promise<void> {
    const yo = await prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: adminId, comunidadId } } })
    const objetivo = await prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } } })

    if (!yo || !objetivo) throw new AppError('Miembro no encontrado', 404)
    if (yo.rol === 'miembro') throw new AppError('No tienes permisos', 403)
    if (yo.rol === 'moderador' && (objetivo.rol === 'admin' || objetivo.rol === 'moderador')) {
      throw new AppError('No puedes expulsar a este usuario', 403)
    }
    if (adminId === objetivoId) throw new AppError('No puedes expulsarte a ti mismo', 400)

    await prisma.miembro.delete({ where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } } })
    await prisma.comunidad.update({ where: { id: comunidadId }, data: { totalMiembros: { decrement: 1 } } })
  }

  async cambiarRol(comunidadId: string, objetivoId: string, adminId: string, rol: string): Promise<void> {
    if (!['admin', 'moderador', 'miembro'].includes(rol)) throw new AppError('Rol inválido', 400)

    const yo = await prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: adminId, comunidadId } } })
    if (!yo || yo.rol !== 'admin') throw new AppError('Solo los administradores pueden cambiar roles', 403)
    if (adminId === objetivoId) throw new AppError('No puedes cambiar tu propio rol', 400)

    await prisma.miembro.update({
      where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } },
      data: { rol: rol as any }
    })
  }

  async comentarPublicacion(pubId: string, usuarioId: string, contenido: string): Promise<any> {
    if (!contenido?.trim()) throw new AppError('Comentario vacío', 400)
    const pub = await prisma.publicacion.findUnique({ where: { id: pubId } })
    if (!pub) throw new AppError('Publicación no encontrada', 404)

    const comentario = await prisma.comentario.create({
      data: { usuarioId, publicacionId: pubId, contenido: contenido.trim() },
      include: { usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } } }
    })
    await prisma.publicacion.update({ where: { id: pubId }, data: { totalComentarios: { increment: 1 } } })
    return comentario
  }
}
