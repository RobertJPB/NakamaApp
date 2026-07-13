import { prisma }               from '../database/prisma/client'
import { IColeccionRepository } from '../../domain/repositories/IColeccionRepository'
import { Coleccion }            from '../../domain/entities/Coleccion'

export class PrismaColeccionRepository implements IColeccionRepository {

  private mapear(raw: any): Coleccion {
    return {
      id:            raw.id,
      usuarioId:     raw.usuarioId    ?? undefined,
      titulo:        raw.titulo,
      descripcion:   raw.descripcion  ?? undefined,
      imagenUrl:     raw.imagenUrl    ?? undefined,
      esEditorial:   raw.esEditorial,
      esPublica:     raw.esPublica,
      totalAnimes:   raw.totalAnimes,
      creadoEn:      raw.creadoEn,
      actualizadoEn: raw.actualizadoEn,
    }
  }

  async findById(id: string): Promise<Coleccion | null> {
    const raw = await prisma.coleccion.findUnique({
      where:   { id },
      include: { animes: { include: { anime: true }, orderBy: { posicion: 'asc' } } },
    })
    return raw ? this.mapear(raw) : null
  }

  async findEditoriales(page: number, limit: number): Promise<Coleccion[]> {
    const rows = await prisma.coleccion.findMany({
      where:   { esEditorial: true, esPublica: true },
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { creadoEn: 'desc' },
    })
    return rows.map(this.mapear)
  }

  async findByUsuario(usuarioId: string): Promise<Coleccion[]> {
    const rows = await prisma.coleccion.findMany({
      where:   { usuarioId },
      orderBy: { actualizadoEn: 'desc' },
    })
    return rows.map(this.mapear)
  }

  async create(data: Partial<Coleccion>): Promise<Coleccion> {
    const raw = await prisma.coleccion.create({
      data: {
        titulo:       data.titulo!,
        descripcion:  data.descripcion,
        imagenUrl:    data.imagenUrl,
        esEditorial:  data.esEditorial ?? false,
        esPublica:    data.esPublica   ?? true,
        usuarioId:    data.usuarioId,
      },
    })
    return this.mapear(raw)
  }

  async update(id: string, data: Partial<Coleccion>): Promise<Coleccion> {
    const raw = await prisma.coleccion.update({
      where: { id },
      data:  { titulo: data.titulo, descripcion: data.descripcion, imagenUrl: data.imagenUrl, esPublica: data.esPublica },
    })
    return this.mapear(raw)
  }

  async delete(id: string, usuarioId: string): Promise<void> {
    await prisma.coleccion.deleteMany({ where: { id, usuarioId } })
  }

  async agregarAnime(coleccionId: string, animeId: string, posicion: number, nota?: string): Promise<void> {
    await prisma.coleccionAnime.upsert({
      where:  { coleccionId_animeId: { coleccionId, animeId } },
      create: { coleccionId, animeId, posicion, nota },
      update: { posicion, nota },
    })
    await prisma.coleccion.update({
      where: { id: coleccionId },
      data:  { totalAnimes: { increment: 1 } },
    })
  }

  async quitarAnime(coleccionId: string, animeId: string): Promise<void> {
    await prisma.coleccionAnime.deleteMany({ where: { coleccionId, animeId } })
    await prisma.coleccion.update({
      where: { id: coleccionId },
      data:  { totalAnimes: { decrement: 1 } },
    })
  }
}
