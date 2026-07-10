import { prisma }               from '../database/prisma/client'
import { IComunidadRepository } from '../../domain/repositories/IComunidadRepository'
import { Comunidad }            from '../../domain/entities/Comunidad'

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
      where:   tipo ? { tipo: tipo as any } : {},
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
        tipo:         data.tipo!,
        referenciaId: data.referenciaId,
        creadoPor:    data.creadoPor,
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
      data:  { nombre: data.nombre, descripcion: data.descripcion, imagenUrl: data.imagenUrl },
    })
    return this.mapear(raw)
  }

  async delete(id: string): Promise<void> {
    await prisma.comunidad.delete({ where: { id } })
  }

  async unirse(usuarioId: string, comunidadId: string): Promise<void> {
    await prisma.miembro.upsert({
      where:  { usuarioId_comunidadId: { usuarioId, comunidadId } },
      create: { usuarioId, comunidadId },
      update: {},
    })
  }

  async salir(usuarioId: string, comunidadId: string): Promise<void> {
    await prisma.miembro.deleteMany({ where: { usuarioId, comunidadId } })
  }

  async esMiembro(usuarioId: string, comunidadId: string): Promise<boolean> {
    const m = await prisma.miembro.findUnique({
      where: { usuarioId_comunidadId: { usuarioId, comunidadId } },
    })
    return !!m
  }
}
