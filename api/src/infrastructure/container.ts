// Repositorios (implementaciones concretas — Infrastructure)
import { PrismaAnimeRepository }     from './repositories/PrismaAnimeRepository'
import { PrismaUsuarioRepository }   from './repositories/PrismaUsuarioRepository'
import { PrismaResenaRepository }    from './repositories/PrismaResenaRepository'
import { PrismaListaRepository }     from './repositories/PrismaListaRepository'
import { PrismaComunidadRepository } from './repositories/PrismaComunidadRepository'
import { PrismaColeccionRepository } from './repositories/PrismaColeccionRepository'

// Servicios
import { AniListService }            from './services/AniListService'

// Casos de uso (Application)
import { BuscarAnimes }        from '../application/usecases/anime/BuscarAnimes'
import { ObtenerDetalleAnime } from '../application/usecases/anime/ObtenerDetalleAnime'
import { RegistrarUsuario }    from '../application/usecases/usuario/RegistrarUsuario'
import { ActualizarPerfil }    from '../application/usecases/usuario/ActualizarPerfil'
import { ToggleSeguir }        from '../application/usecases/usuario/ToggleSeguir'
import { AgregarALista }       from '../application/usecases/biblioteca/AgregarALista'
import { EliminarDeLista }     from '../application/usecases/biblioteca/EliminarDeLista'
import { CrearResena }         from '../application/usecases/resena/CrearResena'
import { EditarResena }        from '../application/usecases/resena/EditarResena'
import { EliminarResena }      from '../application/usecases/resena/EliminarResena'
import { ToggleLikeResena }    from '../application/usecases/resena/ToggleLikeResena'
import { ObtenerRanking }      from '../application/usecases/ranking/ObtenerRanking'
import { ObtenerFeed }         from '../application/usecases/feed/ObtenerFeed'

// Repositorios instanciados una sola vez (singleton)
const animeRepo     = new PrismaAnimeRepository()
const usuarioRepo   = new PrismaUsuarioRepository()
const resenaRepo    = new PrismaResenaRepository()
const listaRepo     = new PrismaListaRepository()
const comunidadRepo = new PrismaComunidadRepository()
const coleccionRepo = new PrismaColeccionRepository()

// Servicios instanciados
const animeService  = new AniListService()

// Casos de uso con dependencias inyectadas
export const container = {
  // Anime
  buscarAnimes:        new BuscarAnimes(animeRepo, animeService),
  obtenerDetalleAnime: new ObtenerDetalleAnime(animeRepo, animeService),

  // Usuario
  registrarUsuario:    new RegistrarUsuario(usuarioRepo),
  actualizarPerfil:    new ActualizarPerfil(usuarioRepo),
  toggleSeguir:        new ToggleSeguir(usuarioRepo),

  // Biblioteca
  agregarALista:       new AgregarALista(listaRepo),
  eliminarDeLista:     new EliminarDeLista(listaRepo),

  // Reseñas
  crearResena:         new CrearResena(resenaRepo),
  editadorResena:      new EditarResena(resenaRepo), // Nótese: Se corrigió typo en nombre o se mantiene igual?
  editarResena:        new EditarResena(resenaRepo),
  eliminarResena:      new EliminarResena(resenaRepo),
  toggleLikeResena:    new ToggleLikeResena(resenaRepo),

  // Ranking
  obtenerRanking:      new ObtenerRanking(animeRepo),
  obtenerFeed:         new ObtenerFeed(usuarioRepo),
}
