import { prisma }            from '../database/prisma/client'
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository'
import { Usuario }           from '../../domain/entities/Usuario'

export class PrismaUsuarioRepository implements IUsuarioRepository {

  private mapear(raw: any): Usuario {
    return {
      id:              raw.id,
      email:           raw.email,
      username:        raw.username,
      nombreDisplay:   raw.nombreDisplay,
      avatarUrl:       raw.avatarUrl    ?? undefined,
      bannerUrl:       raw.bannerUrl    ?? undefined,
      bio:             raw.bio          ?? undefined,
      sitioWeb:        raw.sitioWeb     ?? undefined,
      perfilPrivado:   raw.perfilPrivado,
      resenasPublicas: raw.resenasPublicas,
      listasPublicas:  raw.listasPublicas,
      creadoEn:        raw.creadoEn,
      actualizadoEn:   raw.actualizadoEn,
      ultimoAcceso:    raw.ultimoAcceso ?? undefined,
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
        id:            data.id!,
        email:         data.email!,
        username:      data.username!,
        nombreDisplay: data.nombreDisplay!,
      },
    })
    return this.mapear(raw)
  }

  async update(id: string, data: Partial<Usuario>): Promise<Usuario> {
    const raw = await prisma.usuario.update({
      where: { id },
      data: {
        nombreDisplay:   data.nombreDisplay,
        bio:             data.bio,
        sitioWeb:        data.sitioWeb,
        avatarUrl:       data.avatarUrl,
        bannerUrl:       data.bannerUrl,
        perfilPrivado:   data.perfilPrivado,
        resenasPublicas: data.resenasPublicas,
        listasPublicas:  data.listasPublicas,
      },
    })
    return this.mapear(raw)
  }

  async delete(id: string): Promise<void> {
    await prisma.usuario.delete({ where: { id } })
  }

  async getSeguidores(usuarioId: string): Promise<Usuario[]> {
    const rows = await prisma.seguidor.findMany({
      where:   { seguidoId: usuarioId, estado: 'aceptado' },
      include: { seguidor: true },
    })
    return rows.map(r => this.mapear(r.seguidor))
  }

  async getSiguiendo(usuarioId: string): Promise<Usuario[]> {
    const rows = await prisma.seguidor.findMany({
      where:   { seguidorId: usuarioId, estado: 'aceptado' },
      include: { seguido: true },
    })
    return rows.map(r => this.mapear(r.seguido))
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
    const estado   = objetivo?.perfilPrivado ? 'pendiente' : 'aceptado'

    await prisma.seguidor.create({
      data: { seguidorId, seguidoId, estado },
    })
    return { accion: estado === 'pendiente' ? 'pendiente' as const : 'seguido' as const }
  }
}
