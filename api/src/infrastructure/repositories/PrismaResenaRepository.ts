import { prisma }            from '../database/prisma/client'
import { IResenaRepository } from '../../domain/repositories/IResenaRepository'
import { Resena }            from '../../domain/entities/Resena'

export class PrismaResenaRepository implements IResenaRepository {

  private mapear(raw: any): Resena {
    return {
      id:              raw.id,
      usuarioId:       raw.usuarioId,
      animeId:         raw.animeId,
      calificacion:    raw.calificacion,
      contenido:       raw.contenido    ?? undefined,
      contieneSpoiler: raw.contieneSpoiler,
      esPublica:       raw.esPublica,
      totalLikes:      raw.totalLikes,
      fechaVisto:      raw.fechaVisto ?? undefined,
      etiquetas:       raw.etiquetas ?? [],
      creadoEn:        raw.creadoEn,
      editadoEn:       raw.editadoEn   ?? undefined,
      usuario:         raw.usuario,
      anime:           raw.anime,
    }
  }

  async findById(id: string): Promise<Resena | null> {
    const raw = await prisma.resena.findUnique({ where: { id } })
    return raw ? this.mapear(raw) : null
  }

  async findByUsuarioYAnime(usuarioId: string, animeId: string): Promise<Resena | null> {
    const raw = await prisma.resena.findUnique({
      where: { usuarioId_animeId: { usuarioId, animeId } },
    })
    return raw ? this.mapear(raw) : null
  }

  async findByAnime(animeId: string, page: number, limit: number): Promise<Resena[]> {
    const rows = await prisma.resena.findMany({
      where:   { animeId, esPublica: true },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { creadoEn: 'desc' },
      include: { usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true } } },
    })
    return rows.map(this.mapear)
  }

  async findByUsuario(usuarioId: string, page: number, limit: number): Promise<Resena[]> {
    const rows = await prisma.resena.findMany({
      where:   { usuarioId },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { creadoEn: 'desc' },
    })
    return rows.map(this.mapear)
  }

  async upsert(data: Partial<Resena>): Promise<Resena> {
    const payload = {
      calificacion:    data.calificacion!,
      contenido:       data.contenido,
      contieneSpoiler: data.contieneSpoiler ?? false,
      esPublica:       data.esPublica       ?? true,
      fechaVisto:      data.fechaVisto,
      etiquetas:       data.etiquetas ?? [],
      editadoEn:       data.editadoEn ? new Date() : undefined,
    }
    const raw = await prisma.resena.upsert({
      where:  { usuarioId_animeId: { usuarioId: data.usuarioId!, animeId: data.animeId! } },
      create: { usuarioId: data.usuarioId!, animeId: data.animeId!, ...payload },
      update: payload,
    })
    return this.mapear(raw)
  }

  async delete(id: string, usuarioId: string): Promise<void> {
    await prisma.resena.deleteMany({ where: { id, usuarioId } })
  }

  async toggleLike(usuarioId: string, resenaId: string) {
    const existente = await prisma.reaccionResena.findUnique({
      where: { usuarioId_resenaId: { usuarioId, resenaId } },
    })

    if (existente) {
      await prisma.reaccionResena.delete({
        where: { usuarioId_resenaId: { usuarioId, resenaId } },
      })
      await prisma.resena.update({ where: { id: resenaId }, data: { totalLikes: { decrement: 1 } } })
      return { accion: 'unliked' as const }
    }

    await prisma.reaccionResena.create({ data: { usuarioId, resenaId } })
    const resena = await prisma.resena.update({ where: { id: resenaId }, data: { totalLikes: { increment: 1 } } })
    
    if (resena.usuarioId !== usuarioId) {
      await prisma.notificacion.create({
        data: {
          usuarioId: resena.usuarioId,
          tipo: 'like_resena',
          actorId: usuarioId,
          referenciaId: resena.id,
          mensaje: 'Le dio me gusta a tu reseña.'
        }
      })
    }

    return { accion: 'liked' as const }
  }

  async findFeedByUsuario(usuarioId: string, page: number, limit: number): Promise<any[]> {
    // 1. Ejecutar las dos primeras consultas en paralelo para ahorrar latencia de red
    const [seguidos, misMembresias] = await Promise.all([
      prisma.seguidor.findMany({
        where: { seguidorId: usuarioId },
        select: { seguidoId: true }
      }),
      prisma.miembro.findMany({
        where: { usuarioId },
        select: { comunidadId: true }
      })
    ]);
    
    const comunidadIds = misMembresias.map((m: { comunidadId: string }) => m.comunidadId);
    
    // 2. Ejecutar la tercera consulta si hay comunidades
    let miembrosComunidad: { usuarioId: string }[] = [];
    if (comunidadIds.length > 0) {
      miembrosComunidad = await prisma.miembro.findMany({
        where: { comunidadId: { in: comunidadIds } },
        select: { usuarioId: true }
      });
    }

    const usuariosIds = [
      usuarioId,
      ...seguidos.map((s: { seguidoId: string }) => s.seguidoId),
      ...miembrosComunidad.map((m: { usuarioId: string }) => m.usuarioId)
    ];

    const uniqueIds = Array.from(new Set(usuariosIds));

    const resenas = await prisma.resena.findMany({
      where: {
        usuarioId: { in: uniqueIds },
        esPublica: true
      },
      take: page * limit,
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } },
        anime: { select: { titulo: true, externalId: true, imagenUrl: true } },
        reacciones: { where: { usuarioId } }
      }
    });

    const publicaciones = await prisma.publicacion.findMany({
      where: {
        OR: [
          // Posts personales (sin comunidad) de usuarios seguidos o del propio usuario
          { comunidadId: null, usuarioId: { in: uniqueIds }, soloAmigos: false },
          // Posts de comunidades a las que el usuario está unido
          ...(comunidadIds.length > 0 ? [{ comunidadId: { in: comunidadIds } }] : [])
        ]
      },
      take: page * limit,
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: { select: { username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } },
        comunidad: { select: { id: true, nombre: true, imagenUrl: true } },
        opciones: { include: { votosUsuarios: { where: { usuarioId } } } },
        reacciones: { where: { usuarioId } },
        resena: { include: { anime: { select: { titulo: true, externalId: true, imagenUrl: true } } } }
      }
    });

    const mappedResenas = resenas.map((r: any) => ({
      id: r.id,
      tipo: 'resena',
      actorUsername: r.usuario.username,
      actorNombre: r.usuario.nombreDisplay,
      actorAvatar: r.usuario.avatarUrl,
      actorMarco: r.usuario.marcoUrl,
      animeTitulo: r.anime.titulo,
      externalId: r.anime.externalId,
      animeImagen: r.anime.imagenUrl,
      calificacion: r.calificacion,
      contenido: r.contenido,
      etiquetas: r.etiquetas,
      fechaVisto: r.fechaVisto ? r.fechaVisto.toISOString() : null,
      creadoEn: r.creadoEn.toISOString(),
      timestamp: r.creadoEn.getTime(),
      totalLikes: r.totalLikes,
      totalComentarios: r.totalComentarios,
      hasLiked: r.reacciones.length > 0
    }));

    const mappedPublicaciones = publicaciones.map((p: any) => ({
      id: p.id,
      tipo: p.tipo, // 'texto' | 'encuesta' | 'resena'
      actorUsername: p.usuario.username,
      actorNombre: p.usuario.nombreDisplay,
      actorAvatar: p.usuario.avatarUrl,
      actorMarco: p.usuario.marcoUrl,
      comunidadId: p.comunidadId,
      comunidadNombre: p.comunidad?.nombre,
      comunidadImagen: p.comunidad?.imagenUrl,
      titulo: p.titulo,
      contenido: p.contenido,
      imagenUrl: p.imagenUrl,
      resena: p.resena ? {
        id: p.resena.id,
        animeTitulo: p.resena.anime.titulo,
        externalId: p.resena.anime.externalId,
        animeImagen: p.resena.anime.imagenUrl,
        calificacion: p.resena.calificacion
      } : null,
      opciones: p.opciones?.map((opt: any) => ({
        id: opt.id,
        texto: opt.texto,
        votos: opt.votos,
        hasVoted: opt.votosUsuarios.length > 0
      })) || [],
      creadoEn: p.creadoEn.toISOString(),
      timestamp: p.creadoEn.getTime(),
      totalLikes: p.totalLikes,
      totalComentarios: p.totalComentarios,
      hasLiked: p.reacciones.length > 0
    }));

    const feed = [...mappedResenas, ...mappedPublicaciones]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice((page - 1) * limit, page * limit)
      .map(({ timestamp, ...rest }) => rest);

    return feed;
  }
}

