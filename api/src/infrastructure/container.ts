// Repositorios (implementaciones concretas — Infrastructure)
import { PrismaAnimeRepository }     from './repositories/PrismaAnimeRepository'
import { PrismaUsuarioRepository }   from './repositories/PrismaUsuarioRepository'
import { PrismaResenaRepository }    from './repositories/PrismaResenaRepository'
import { PrismaListaRepository }     from './repositories/PrismaListaRepository'
import { PrismaComunidadRepository } from './repositories/PrismaComunidadRepository'
import { PrismaColeccionRepository } from './repositories/PrismaColeccionRepository'

// Servicios
import { KitsuService }            from './external/kitsu/KitsuService'

// Casos de uso (Application)
import { BuscarAnimes }        from '../application/usecases/anime/BuscarAnimes'
import { ObtenerDetalleAnime } from '../application/usecases/anime/ObtenerDetalleAnime'
import { RegistrarUsuario }    from '../application/usecases/usuario/RegistrarUsuario'
import { ActualizarPerfil }    from '../application/usecases/usuario/ActualizarPerfil'
import { ToggleSeguir }        from '../application/usecases/usuario/ToggleSeguir'
import { AgregarALista }       from '../application/usecases/biblioteca/AgregarALista'
import { EliminarDeLista }     from '../application/usecases/biblioteca/EliminarDeLista'
import { ObtenerListaBiblioteca, ObtenerColumnasBiblioteca, GuardarColumnaBiblioteca, QuitarColumnaGuardada, GenerarInviteColumna, AceptarInviteColumna, CrearColumnaBiblioteca, ActualizarColumnaBiblioteca, VerificarColaborador, ToggleFavoritoBiblioteca } from '../application/usecases/biblioteca/BibliotecaUseCasesPrisma'
import { CrearResena }         from '../application/usecases/resena/CrearResena'
import { EditarResena }        from '../application/usecases/resena/EditarResena'
import { EliminarResena }      from '../application/usecases/resena/EliminarResena'
import { ToggleLikeResena }    from '../application/usecases/resena/ToggleLikeResena'
import { ObtenerResenasRecientes, BuscarResenas, ObtenerResenasPorAnime, ObtenerResenasPorUsuario } from '../application/usecases/resena/ResenaUseCasesPrisma'
import { ObtenerRanking }      from '../application/usecases/ranking/ObtenerRanking'
import { ObtenerFeed }         from '../application/usecases/feed/ObtenerFeed'
import { CrearPublicacionFeed, EliminarPublicacionFeed, ToggleLikePublicacion, ObtenerComentarios, CrearComentario, EliminarComentario } from '../application/usecases/feed/FeedUseCases'
import { BuscarColecciones }   from '../application/usecases/coleccion/BuscarColecciones'
import { ListarNotificaciones, MarcarTodasLeidas, MarcarLeida } from '../application/usecases/notificacion/NotificacionUseCases'
import { BuscarComunidades, ListarPublicacionesComunidadDirecto, CrearPublicacionComunidad, EliminarPublicacionComunidad, EditarPublicacionComunidad, VotarEncuestaComunidad, ListarMiembrosComunidad, ExpulsarMiembro, CambiarRolMiembro, ComentarPublicacionComunidad } from '../application/usecases/comunidad/ComunidadUseCasesPrisma'

// Repositorios instanciados una sola vez (singleton)
const animeRepo     = new PrismaAnimeRepository()
const usuarioRepo   = new PrismaUsuarioRepository()
const resenaRepo    = new PrismaResenaRepository()
const listaRepo     = new PrismaListaRepository()
const comunidadRepo = new PrismaComunidadRepository()
const coleccionRepo = new PrismaColeccionRepository()

// Servicios instanciados
const animeService  = new KitsuService()

// Casos de uso con dependencias inyectadas
import { prisma } from './database/prisma/client'

export const container = {
  // Anime
  buscarAnimes:        new BuscarAnimes(animeRepo, animeService),
  obtenerDetalleAnime: new ObtenerDetalleAnime(animeRepo, animeService, resenaRepo),

  // Usuario
  registrarUsuario:    new RegistrarUsuario(usuarioRepo),
  actualizarPerfil:    new ActualizarPerfil(usuarioRepo),
  toggleSeguir:        new ToggleSeguir(usuarioRepo),

  // Biblioteca
  agregarALista:       new AgregarALista(listaRepo),
  eliminarDeLista:     new EliminarDeLista(listaRepo),
  obtenerListaBiblioteca: new ObtenerListaBiblioteca(prisma),
  obtenerColumnasBiblioteca: new ObtenerColumnasBiblioteca(prisma),
  guardarColumnaBiblioteca: new GuardarColumnaBiblioteca(prisma),
  quitarColumnaGuardada: new QuitarColumnaGuardada(prisma),
  generarInviteColumna: new GenerarInviteColumna(prisma),
  aceptarInviteColumna: new AceptarInviteColumna(prisma),
  crearColumnaBiblioteca: new CrearColumnaBiblioteca(prisma),
  actualizarColumnaBiblioteca: new ActualizarColumnaBiblioteca(prisma),
  verificarColaborador: new VerificarColaborador(prisma),
  toggleFavoritoBiblioteca: new ToggleFavoritoBiblioteca(prisma),

  // Reseñas
  crearResena:         new CrearResena(resenaRepo),
  editarResena:        new EditarResena(resenaRepo),
  eliminarResena:      new EliminarResena(resenaRepo),
  toggleLikeResena:    new ToggleLikeResena(resenaRepo),
  obtenerResenasRecientes: new ObtenerResenasRecientes(prisma),
  buscarResenas:       new BuscarResenas(prisma),
  obtenerResenasPorAnime: new ObtenerResenasPorAnime(prisma),
  obtenerResenasPorUsuario: new ObtenerResenasPorUsuario(prisma),

  // Ranking
  obtenerRanking:      new ObtenerRanking(animeRepo),
  // Feed
  obtenerFeed:         new ObtenerFeed(usuarioRepo, resenaRepo),
  crearPublicacionFeed: new CrearPublicacionFeed(prisma),
  eliminarPublicacionFeed: new EliminarPublicacionFeed(prisma),
  toggleLikePublicacion: new ToggleLikePublicacion(prisma),
  obtenerComentarios:  new ObtenerComentarios(prisma),
  crearComentario:     new CrearComentario(prisma),
  eliminarComentario:  new EliminarComentario(prisma),

  // Comunidad
  buscarComunidades:      new BuscarComunidades(prisma),
  listarPublicacionesComunidadDirecto: new ListarPublicacionesComunidadDirecto(prisma),
  crearPublicacionComunidad: new CrearPublicacionComunidad(prisma),
  eliminarPublicacionComunidad: new EliminarPublicacionComunidad(prisma),
  editarPublicacionComunidad: new EditarPublicacionComunidad(prisma),
  votarEncuestaComunidad: new VotarEncuestaComunidad(prisma),
  listarMiembrosComunidad: new ListarMiembrosComunidad(prisma),
  expulsarMiembro:        new ExpulsarMiembro(prisma),
  cambiarRolMiembro:      new CambiarRolMiembro(prisma),
  comentarPublicacionComunidad: new ComentarPublicacionComunidad(prisma),

  // Colecciones
  buscarColecciones:   new BuscarColecciones(prisma),

  // Notificaciones
  listarNotificaciones: new ListarNotificaciones(prisma),
  marcarTodasLeidas:    new MarcarTodasLeidas(prisma),
  marcarLeida:          new MarcarLeida(prisma),
}
