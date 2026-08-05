import { PrismaClient } from '@prisma/client'
import { AppError } from '../../../presentation/middlewares/error.middleware'

export class BuscarComunidades {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(q: string) {
    return this.prisma.comunidad.findMany({
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
}

export class ListarPublicacionesComunidadDirecto {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(comunidadId: string, seccion?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const whereClause: any = { comunidadId }
    if (seccion) whereClause.tema = seccion

    return this.prisma.publicacion.findMany({
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
}

export class CrearPublicacionComunidad {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(dto: any) {
    return this.prisma.publicacion.create({
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
}

export class EliminarPublicacionComunidad {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(pubId: string, usuarioId: string) {
    const pub = await this.prisma.publicacion.findUnique({ where: { id: pubId } })
    if (!pub) throw new AppError('Publicación no encontrada', 404)
    
    let autorizado = pub.usuarioId === usuarioId
    if (!autorizado && pub.comunidadId) {
      const miembro = await this.prisma.miembro.findUnique({ 
        where: { usuarioId_comunidadId: { usuarioId, comunidadId: pub.comunidadId } } 
      })
      if (miembro && (miembro.rol === 'admin' || miembro.rol === 'moderador')) {
        autorizado = true
      }
    }
    if (!autorizado) throw new AppError('No autorizado', 403)
    await this.prisma.publicacion.delete({ where: { id: pubId } })
  }
}

export class EditarPublicacionComunidad {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(pubId: string, usuarioId: string, contenido: string) {
    if (!contenido || contenido.trim() === '') throw new AppError('El contenido no puede estar vacío', 400)
    const pub = await this.prisma.publicacion.findUnique({ where: { id: pubId } })
    if (!pub) throw new AppError('Publicación no encontrada', 404)
    if (pub.usuarioId !== usuarioId) throw new AppError('No autorizado para editar', 403)
    return this.prisma.publicacion.update({ 
      where: { id: pubId },
      data: { contenido: contenido.trim() }
    })
  }
}

export class VotarEncuestaComunidad {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(opcionId: string, usuarioId: string) {
    const opcion = await this.prisma.opcionEncuesta.findUnique({ where: { id: opcionId } })
    if (!opcion) throw new AppError('Opción no encontrada', 404)

    const votoPrevio = await this.prisma.votoEncuesta.findFirst({
      where: { usuarioId, opcion: { publicacionId: opcion.publicacionId } }
    })

    if (votoPrevio) {
      if (votoPrevio.opcionId === opcionId) {
        await this.prisma.$transaction([
          this.prisma.votoEncuesta.delete({ where: { usuarioId_opcionId: { usuarioId, opcionId: votoPrevio.opcionId } } }),
          this.prisma.opcionEncuesta.update({ where: { id: votoPrevio.opcionId }, data: { votos: { decrement: 1 } } })
        ])
        return { accion: 'unvoted' }
      } else {
        await this.prisma.$transaction([
          this.prisma.votoEncuesta.delete({ where: { usuarioId_opcionId: { usuarioId, opcionId: votoPrevio.opcionId } } }),
          this.prisma.opcionEncuesta.update({ where: { id: votoPrevio.opcionId }, data: { votos: { decrement: 1 } } }),
          this.prisma.votoEncuesta.create({ data: { usuarioId, opcionId } }),
          this.prisma.opcionEncuesta.update({ where: { id: opcionId }, data: { votos: { increment: 1 } } })
        ])
        return { accion: 'changed' }
      }
    }

    await this.prisma.$transaction([
      this.prisma.votoEncuesta.create({ data: { usuarioId, opcionId } }),
      this.prisma.opcionEncuesta.update({ where: { id: opcionId }, data: { votos: { increment: 1 } } })
    ])
    return { accion: 'voted' }
  }
}

export class ListarMiembrosComunidad {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(comunidadId: string) {
    return this.prisma.miembro.findMany({
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
}

export class ExpulsarMiembro {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(comunidadId: string, objetivoId: string, adminId: string) {
    const yo = await this.prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: adminId, comunidadId } } })
    const objetivo = await this.prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } } })

    if (!yo || !objetivo) throw new AppError('Miembro no encontrado', 404)
    if (yo.rol === 'miembro') throw new AppError('No tienes permisos', 403)
    if (yo.rol === 'moderador' && (objetivo.rol === 'admin' || objetivo.rol === 'moderador')) {
      throw new AppError('No puedes expulsar a este usuario', 403)
    }
    if (adminId === objetivoId) throw new AppError('No puedes expulsarte a ti mismo', 400)

    await this.prisma.miembro.delete({ where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } } })
    await this.prisma.comunidad.update({ where: { id: comunidadId }, data: { totalMiembros: { decrement: 1 } } })
  }
}

export class CambiarRolMiembro {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(comunidadId: string, objetivoId: string, adminId: string, rol: string) {
    if (!['admin', 'moderador', 'miembro'].includes(rol)) throw new AppError('Rol inválido', 400)

    const yo = await this.prisma.miembro.findUnique({ where: { usuarioId_comunidadId: { usuarioId: adminId, comunidadId } } })
    if (!yo || yo.rol !== 'admin') throw new AppError('Solo los administradores pueden cambiar roles', 403)
    if (adminId === objetivoId) throw new AppError('No puedes cambiar tu propio rol', 400)

    await this.prisma.miembro.update({
      where: { usuarioId_comunidadId: { usuarioId: objetivoId, comunidadId } },
      data: { rol: rol as any }
    })
  }
}

export class ComentarPublicacionComunidad {
  constructor(private readonly prisma: PrismaClient) {}
  async execute(pubId: string, usuarioId: string, contenido: string) {
    if (!contenido?.trim()) throw new AppError('Comentario vacío', 400)
    const pub = await this.prisma.publicacion.findUnique({ where: { id: pubId } })
    if (!pub) throw new AppError('Publicación no encontrada', 404)

    const comentario = await this.prisma.comentario.create({
      data: { usuarioId, publicacionId: pubId, contenido: contenido.trim() },
      include: { usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true } } }
    })
    await this.prisma.publicacion.update({ where: { id: pubId }, data: { totalComentarios: { increment: 1 } } })
    return comentario
  }
}
