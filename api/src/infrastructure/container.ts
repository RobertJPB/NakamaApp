// Repositorios (implementaciones concretas — Infrastructure)
import { PrismaAnimeRepository } from './repositories/PrismaAnimeRepository'
import { PrismaUsuarioRepository } from './repositories/PrismaUsuarioRepository'
import { PrismaResenaRepository } from './repositories/PrismaResenaRepository'
import { PrismaListaRepository } from './repositories/PrismaListaRepository'
import { PrismaComunidadRepository } from './repositories/PrismaComunidadRepository'
import { PrismaColeccionRepository } from './repositories/PrismaColeccionRepository'
import { PrismaFeedRepository } from './repositories/PrismaFeedRepository'
import { PrismaNotificacionRepository } from './repositories/PrismaNotificacionRepository'
import { PrismaBibliotecaRepository } from './repositories/PrismaBibliotecaRepository'
import { PrismaNoticiaRepository } from './repositories/PrismaNoticiaRepository'
import { PrismaPlantillaRepository } from './repositories/PrismaPlantillaRepository'

// Servicios
import { KitsuService } from './external/kitsu/KitsuService'
import { prisma } from './database/prisma/client'

// Casos de uso (Application)
import { BuscarAnimes } from '../application/usecases/anime/BuscarAnimes'
import { ObtenerDetalleAnime } from '../application/usecases/anime/ObtenerDetalleAnime'
import { RegistrarUsuario } from '../application/usecases/usuario/RegistrarUsuario'
import { ActualizarPerfil } from '../application/usecases/usuario/ActualizarPerfil'
import { ToggleSeguir } from '../application/usecases/usuario/ToggleSeguir'
import { AgregarALista } from '../application/usecases/biblioteca/AgregarALista'
import { EliminarDeLista } from '../application/usecases/biblioteca/EliminarDeLista'
import {
  ObtenerListaBiblioteca,
  ObtenerColumnasBiblioteca,
  GuardarColumnaBiblioteca,
  QuitarColumnaGuardada,
  GenerarInviteColumna,
  AceptarInviteColumna,
  CrearColumnaBiblioteca,
  ActualizarColumnaBiblioteca,
  VerificarColaborador,
  ToggleFavoritoBiblioteca,
} from '../application/usecases/biblioteca/BibliotecaUseCasesPrisma'
import { CrearResena } from '../application/usecases/resena/CrearResena'
import { EditarResena } from '../application/usecases/resena/EditarResena'
import { EliminarResena } from '../application/usecases/resena/EliminarResena'
import { ToggleLikeResena } from '../application/usecases/resena/ToggleLikeResena'
import {
  ObtenerResenasRecientes,
  BuscarResenas,
  ObtenerResenasPorAnime,
  ObtenerResenasPorUsuario,
} from '../application/usecases/resena/ResenaUseCasesPrisma'
import { ObtenerRanking } from '../application/usecases/ranking/ObtenerRanking'
import { ObtenerFeed } from '../application/usecases/feed/ObtenerFeed'
import {
  CrearPublicacionFeed,
  EliminarPublicacionFeed,
  EliminarFeedResena,
  ToggleLikePublicacion,
  ObtenerComentarios,
  CrearComentario,
  EliminarComentario,
} from '../application/usecases/feed/FeedUseCases'
import { BuscarColecciones } from '../application/usecases/coleccion/BuscarColecciones'
import {
  ListarNotificaciones,
  MarcarTodasLeidas,
  MarcarLeida,
} from '../application/usecases/notificacion/NotificacionUseCases'
import {
  BuscarComunidades,
  ListarPublicacionesComunidadDirecto,
  CrearPublicacionComunidad,
  EliminarPublicacionComunidad,
  EditarPublicacionComunidad,
  VotarEncuestaComunidad,
  ListarMiembrosComunidad,
  ExpulsarMiembro,
  CambiarRolMiembro,
  ComentarPublicacionComunidad,
} from '../application/usecases/comunidad/ComunidadUseCasesPrisma'

// Repositorios instanciados una sola vez (singleton)
const animeRepo = new PrismaAnimeRepository()
const usuarioRepo = new PrismaUsuarioRepository()
const resenaRepo = new PrismaResenaRepository()
const listaRepo = new PrismaListaRepository()
const comunidadRepo = new PrismaComunidadRepository()
const coleccionRepo = new PrismaColeccionRepository()
const feedRepo = new PrismaFeedRepository()
const notificacionRepo = new PrismaNotificacionRepository()
const bibliotecaRepo = new PrismaBibliotecaRepository()
const noticiaRepo = new PrismaNoticiaRepository()
const plantillaRepo = new PrismaPlantillaRepository()

// Servicios instanciados
const animeService = new KitsuService()

// Casos de uso con dependencias inyectadas

export const container = {
  // Repositorios expuestos (acceso directo desde controllers sin instanciar)
  comunidadRepo,
  coleccionRepo,
  animeRepo,
  noticiaRepo,
  plantillaRepo,
  usuarioRepo,

  // Servicios
  animeService,

  // Anime
  buscarAnimes: new BuscarAnimes(animeRepo, animeService),
  obtenerDetalleAnime: new ObtenerDetalleAnime(animeRepo, animeService, resenaRepo, prisma),

  // Usuario
  registrarUsuario: new RegistrarUsuario(usuarioRepo),
  actualizarPerfil: new ActualizarPerfil(usuarioRepo),
  toggleSeguir: new ToggleSeguir(usuarioRepo),

  // Biblioteca
  agregarALista: new AgregarALista(listaRepo),
  eliminarDeLista: new EliminarDeLista(listaRepo),
  obtenerListaBiblioteca: new ObtenerListaBiblioteca(bibliotecaRepo),
  obtenerColumnasBiblioteca: new ObtenerColumnasBiblioteca(bibliotecaRepo),
  guardarColumnaBiblioteca: new GuardarColumnaBiblioteca(bibliotecaRepo),
  quitarColumnaGuardada: new QuitarColumnaGuardada(bibliotecaRepo),
  generarInviteColumna: new GenerarInviteColumna(bibliotecaRepo),
  aceptarInviteColumna: new AceptarInviteColumna(bibliotecaRepo),
  crearColumnaBiblioteca: new CrearColumnaBiblioteca(bibliotecaRepo),
  actualizarColumnaBiblioteca: new ActualizarColumnaBiblioteca(bibliotecaRepo),
  verificarColaborador: new VerificarColaborador(bibliotecaRepo),
  toggleFavoritoBiblioteca: new ToggleFavoritoBiblioteca(bibliotecaRepo),

  // Reseñas
  crearResena: new CrearResena(resenaRepo),
  editarResena: new EditarResena(resenaRepo),
  eliminarResena: new EliminarResena(resenaRepo),
  toggleLikeResena: new ToggleLikeResena(resenaRepo),
  obtenerResenasRecientes: new ObtenerResenasRecientes(resenaRepo),
  buscarResenas: new BuscarResenas(resenaRepo),
  obtenerResenasPorAnime: new ObtenerResenasPorAnime(resenaRepo),
  obtenerResenasPorUsuario: new ObtenerResenasPorUsuario(resenaRepo),

  // Ranking
  obtenerRanking: new ObtenerRanking(animeRepo),
  // Feed
  obtenerFeed: new ObtenerFeed(usuarioRepo, resenaRepo),
  crearPublicacionFeed: new CrearPublicacionFeed(feedRepo),
  eliminarPublicacionFeed: new EliminarPublicacionFeed(feedRepo),
  eliminarFeedResena: new EliminarFeedResena(feedRepo),
  toggleLikePublicacion: new ToggleLikePublicacion(feedRepo),
  obtenerComentarios: new ObtenerComentarios(feedRepo),
  crearComentario: new CrearComentario(feedRepo),
  eliminarComentario: new EliminarComentario(feedRepo),

  // Comunidad
  buscarComunidades: new BuscarComunidades(comunidadRepo),
  listarPublicacionesComunidadDirecto: new ListarPublicacionesComunidadDirecto(comunidadRepo),
  crearPublicacionComunidad: new CrearPublicacionComunidad(comunidadRepo),
  eliminarPublicacionComunidad: new EliminarPublicacionComunidad(comunidadRepo),
  editarPublicacionComunidad: new EditarPublicacionComunidad(comunidadRepo),
  votarEncuestaComunidad: new VotarEncuestaComunidad(comunidadRepo),
  listarMiembrosComunidad: new ListarMiembrosComunidad(comunidadRepo),
  expulsarMiembro: new ExpulsarMiembro(comunidadRepo),
  cambiarRolMiembro: new CambiarRolMiembro(comunidadRepo),
  comentarPublicacionComunidad: new ComentarPublicacionComunidad(comunidadRepo),

  // Colecciones
  buscarColecciones: new BuscarColecciones(coleccionRepo),

  // Notificaciones
  listarNotificaciones: new ListarNotificaciones(notificacionRepo),
  marcarTodasLeidas: new MarcarTodasLeidas(notificacionRepo),
  marcarLeida: new MarcarLeida(notificacionRepo),
}
