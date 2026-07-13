import React, { useState } from 'react'
import { useParams }       from 'react-router-dom'
import { Layout }          from '../../../components/shared/Layout'
import { useAnimeDetalle } from '../../../hooks/useAnime'
import { useAuth }         from '../../../hooks/useAuth'
import { ResenaCard }      from '../components/ResenaCard'
import { ResenaForm }      from '../components/ResenaForm'
import { PersonajeCard }   from '../components/PersonajeCard'
import { BotonLista }      from '../components/BotonLista'
import styles              from './AnimePage.module.css'

export const AnimePage: React.FC = () => {
  const { id }                    = useParams<{ id: string }>()
  const { detalle, cargando }     = useAnimeDetalle(Number(id))
  const { estaAutenticado }       = useAuth()
  const [tabActiva, setTabActiva] = useState<'resenas' | 'personajes' | 'info'>('resenas')

  if (cargando) return <Layout><div className={styles.cargando}>Cargando...</div></Layout>
  if (!detalle) return <Layout><div className={styles.cargando}>Anime no encontrado</div></Layout>

  const { anime, personajes } = detalle

  return (
    <Layout>
      {/* Hero con banner */}
      <div className={styles.hero}>
        {anime.bannerUrl && (
          <div className={styles.banner}>
            <img src={anime.bannerUrl} alt="" />
            <div className={styles.bannerOverlay} />
          </div>
        )}

        <div className={styles.heroContenido}>
          {/* Poster */}
          <div className={styles.posterWrap}>
            <img src={anime.imagenUrl} alt={anime.titulo} className={styles.poster} />
            {estaAutenticado && <BotonLista animeId={anime.id} />}
          </div>

          {/* Info principal */}
          <div className={styles.info}>
            <div className={styles.meta}>
              {anime.tipo && <span className={styles.metaTag}>{anime.tipo}</span>}
              {anime.temporada && <span className={styles.metaTag}>{anime.temporada} {anime.anio}</span>}
              {anime.estadoEmision && (
                <span className={`${styles.metaTag} ${anime.estadoEmision === 'RELEASING' ? styles.emision : ''}`}>
                  {anime.estadoEmision === 'RELEASING' ? '● En emisión' : 'Finalizado'}
                </span>
              )}
            </div>

            <h1 className={styles.titulo}>{anime.titulo}</h1>
            {anime.tituloJapones && <p className={styles.tituloJp}>{anime.tituloJapones}</p>}

            {/* Calificación estilo Letterboxd */}
            <div className={styles.rating}>
              <div className={styles.ratingNumero}>
                <span className={styles.ratingValor}>{Number(anime.calificacionPromedio).toFixed(1)}</span>
                <span className={styles.ratingBase}>/10</span>
              </div>
              <div className={styles.ratingInfo}>
                <span className={styles.estrellas}>
                  {'★'.repeat(Math.round(Number(anime.calificacionPromedio) / 2))}
                  {'☆'.repeat(5 - Math.round(Number(anime.calificacionPromedio) / 2))}
                </span>
                <span className={styles.totalResenas}>{anime.totalResenas} reseñas</span>
              </div>
            </div>

            {/* Datos técnicos */}
            <div className={styles.datos}>
              {anime.estudio    && <div className={styles.dato}><span>Estudio</span><strong>{anime.estudio}</strong></div>}
              {anime.episodios  && <div className={styles.dato}><span>Episodios</span><strong>{anime.episodios}</strong></div>}
              {anime.duracionMin && <div className={styles.dato}><span>Duración</span><strong>{anime.duracionMin} min</strong></div>}
              {anime.totalEnListas && <div className={styles.dato}><span>En listas</span><strong>{anime.totalEnListas}</strong></div>}
            </div>

            {/* Géneros */}
            {anime.generos?.length > 0 && (
              <div className={styles.generos}>
                {anime.generos.map((g: string) => (
                  <a key={g} href={`/descubrir?genero=${g}`} className={styles.genero}>{g}</a>
                ))}
              </div>
            )}

            {/* Sinopsis */}
            <p className={styles.sinopsis}>{anime.sinopsis}</p>
          </div>
        </div>
      </div>

      {/* Tabs estilo Letterboxd */}
      <div className={styles.tabs}>
        {(['resenas', 'personajes', 'info'] as const).map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${tabActiva === tab ? styles.tabActiva : ''}`}
            onClick={() => setTabActiva(tab)}
          >
            {tab === 'resenas'    ? `Reseñas (${anime.totalResenas ?? 0})` :
             tab === 'personajes' ? 'Personajes' : 'Información'}
          </button>
        ))}
      </div>

      <div className={styles.contenido}>
        {tabActiva === 'resenas' && (
          <div className={styles.resenasLayout}>
            {estaAutenticado && (
              <div className={styles.formWrap}>
                <ResenaForm animeId={anime.id} />
              </div>
            )}
            <div className={styles.listaResenas}>
              {(anime.resenas ?? []).length === 0
                ? <p className={styles.vacio}>Sé el primero en dejar una reseña.</p>
                : (anime.resenas ?? []).map((r: any) => <ResenaCard key={r.id} resena={r} />)
              }
            </div>
          </div>
        )}

        {tabActiva === 'personajes' && (
          <div className={styles.personajesGrid}>
            {(personajes ?? []).map((p: any) => <PersonajeCard key={p.id} personaje={p} />)}
          </div>
        )}

        {tabActiva === 'info' && (
          <div className={styles.infoDetalle}>
            <div className={styles.infoFila}><span>Título romaji</span><strong>{anime.tituloRomaji}</strong></div>
            <div className={styles.infoFila}><span>Título japonés</span><strong>{anime.tituloJapones}</strong></div>
            <div className={styles.infoFila}><span>Formato</span><strong>{anime.tipo}</strong></div>
            <div className={styles.infoFila}><span>Episodios</span><strong>{anime.episodios}</strong></div>
            <div className={styles.infoFila}><span>Duración</span><strong>{anime.duracionMin} min por ep.</strong></div>
            <div className={styles.infoFila}><span>Estado</span><strong>{anime.estadoEmision}</strong></div>
            <div className={styles.infoFila}><span>Temporada</span><strong>{anime.temporada} {anime.anio}</strong></div>
            <div className={styles.infoFila}><span>Estudio</span><strong>{anime.estudio}</strong></div>
          </div>
        )}
      </div>
    </Layout>
  )
}
