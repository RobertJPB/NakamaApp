import { z } from 'zod'

export const registrarUsuarioSchema = z.object({
  id: z.string().min(1, 'El ID de Supabase es requerido'),
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(20, 'El username es muy largo'),
  nombreDisplay: z.string().min(1, 'El nombre display es requerido').max(50, 'Nombre muy largo'),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
})

export const actualizarPerfilSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  nombreDisplay: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().optional().or(z.literal('')),
  bannerUrl: z.string().optional().or(z.literal('')),
  marcoUrl: z.string().optional().or(z.literal('')),
  bio: z.string().max(500).optional(),
  sitioWeb: z.string().optional().or(z.literal('')),
  perfilPrivado: z.boolean().optional(),
  resenasPublicas: z.boolean().optional(),
  listasPublicas: z.boolean().optional(),
})

export const crearResenaSchema = z.object({
  animeId: z.string().min(1),
  calificacion: z.number().min(0).max(10),
  contenido: z.string().optional(),
  contieneSpoiler: z.boolean().optional(),
  esPublica: z.boolean().optional(),
  fechaVisto: z.string().optional(),
  etiquetas: z.array(z.string()).optional(),
})

export const postFeedSchema = z.object({
  contenido: z.string().min(1, 'El contenido no puede estar vacío'),
  tema: z.string().optional(),
  soloAmigos: z.boolean().optional(),
  tipo: z.enum(['texto', 'encuesta', 'imagen']).optional(),
  opciones: z.array(z.string()).optional(),
  imagenUrl: z.string().url().optional().or(z.literal('')),
})

export const crearComunidadSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(50),
  descripcion: z.string().optional(),
  imagenUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  tipo: z.string().optional(),
})

export const comentarioSchema = z.object({
  contenido: z.string().min(1, 'El comentario no puede estar vacío').max(500),
  padreId: z.string().nullish(),
})
