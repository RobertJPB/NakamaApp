import { prisma } from '../../../infrastructure/database/prisma/client'
import { AppError } from '../../../presentation/middlewares/error.middleware'
import { Prisma } from '@prisma/client'

interface Input {
  usuarioId: string
  personajeId: string
  animeId: string
  calificacion: number
  contenido?: string
  contieneSpoiler?: boolean
}

export class CrearResenaPersonaje {
  async execute(input: Input) {
    if (input.calificacion < 1 || input.calificacion > 10) {
      throw new AppError('La calificación debe estar entre 1 y 10', 400)
    }

    const { usuarioId, personajeId, animeId, calificacion, contenido, contieneSpoiler } = input

    // Check if the user already reviewed this character
    const existente = await prisma.resenaPersonaje.findUnique({
      where: {
        usuarioId_personajeId: { usuarioId, personajeId }
      }
    })

    if (existente) {
      throw new AppError('Ya has reseñado a este personaje', 400)
    }

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const resena = await tx.resenaPersonaje.create({
        data: {
          usuarioId,
          personajeId,
          animeId,
          calificacion,
          contenido,
          contieneSpoiler: contieneSpoiler ?? false,
          esPublica: true,
        },
        include: {
          usuario: { select: { id: true, username: true, nombreDisplay: true, avatarUrl: true, marcoUrl: true } },
          personaje: { select: { id: true, nombre: true, imagenUrl: true } },
          anime: { select: { id: true, titulo: true, externalId: true } }
        }
      })

      // Crear publicación automática en el feed
      await tx.publicacion.create({
        data: {
          usuarioId,
          tipo: 'resena_personaje',
          resenaPersonajeId: resena.id,
          contenido: null
        }
      })

      return resena
    })
  }
}
