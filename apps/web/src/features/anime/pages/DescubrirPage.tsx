import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Layout }    from '../../../components/shared/Layout'
import { AnimeCard } from '../../../components/ui/AnimeCard'
import { api }       from '../../../lib/axios'
import { useBusqueda } from '../../../hooks/useAnime'
import styles        from './DescubrirPage.module.css'

const GENEROS = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller','Mecha']
const TIPOS   = ['TV','MOVIE','OVA','ONA','SPECIAL']
const TEMPORADAS = ['WINTER','SPRING','SUMMER','FALL']

export const DescubrirPage: React.FC = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialQuery = params.get('q') ?? ''

  const [query,    setQuery]    = useState(initialQuery)
  const [genero,   setGenero]   = useState('')
  const [tipo,     setTipo]     = useState('')
  const [temporada,setTemporada]= useState('')
  const [animes,   setAnimes]   = useState<any[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') ?? ''
    setQuery(q)
  }, [location.search])

  const { resultados, cargando: buscando } = useBusqueda(query)

  // Cargar populares al inicio
  useEffect(() => {
    setCargando(true)
    api.get('/api/animes/populares')
      .then(({ data }) => setAnimes(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [])

  // Aplicar filtros locales
  useEffect(() => {
    if (!genero && !tipo && !temporada) return
    setCargando(true)
    const params = new URLSearchParams()
    if (genero)    params.set('genero',    genero)
    if (tipo)      params.set('tipo',      tipo)
    if (temporada) params.set('temporada', temporada)
    api.get(`/api/animes?${params.toString()}`)
      .then(({ data }) => setAnimes(Array.isArray(data) ? data : data.animes ?? []))
      .finally(() => setCargando(false))
  }, [genero, tipo, temporada])

  const limpiarFiltros = () => { setGenero(''); setTipo(''); setTemporada('') }
  const hayFiltros = genero || tipo || temporada
  const mostrar = query.trim() ? resultados : animes

  return (
    <Layout>
      <div className={styles.wrap}>

        {/* Hero búsqueda */}
        <div className={styles.hero}>
          <h1 className={styles.titulo}>Descubrir anime</h1>
          <p className={styles.subtitulo}>Explora el catálogo completo o busca lo que quieras</p>
          <div className={styles.searchWrap}>
            <input
              className={styles.search}
              type="text"
              placeholder="Buscar por título..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button className={styles.limpiarSearch} onClick={() => setQuery('')}>✕</button>
            )}
          </div>
        </div>

        <div className={styles.layout}>
          {/* Sidebar de filtros */}
          <aside className={styles.sidebar}>
            <div className={styles.filtroSeccion}>
              <div className={styles.filtroHeader}>
                <h3>Filtros</h3>
                {hayFiltros && (
                  <button className={styles.limpiar} onClick={limpiarFiltros}>Limpiar</button>
                )}
              </div>

              <div className={styles.filtroGrupo}>
                <p className={styles.filtroLabel}>Género</p>
                <div className={styles.filtroOpciones}>
                  {GENEROS.map(g => (
                    <button
                      key={g}
                      className={`${styles.chip} ${genero === g ? styles.chipActivo : ''}`}
                      onClick={() => setGenero(genero === g ? '' : g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filtroGrupo}>
                <p className={styles.filtroLabel}>Tipo</p>
                <div className={styles.filtroOpciones}>
                  {TIPOS.map(t => (
                    <button
                      key={t}
                      className={`${styles.chip} ${tipo === t ? styles.chipActivo : ''}`}
                      onClick={() => setTipo(tipo === t ? '' : t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filtroGrupo}>
                <p className={styles.filtroLabel}>Temporada</p>
                <div className={styles.filtroOpciones}>
                  {TEMPORADAS.map(t => (
                    <button
                      key={t}
                      className={`${styles.chip} ${temporada === t ? styles.chipActivo : ''}`}
                      onClick={() => setTemporada(temporada === t ? '' : t)}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid de resultados */}
          <div className={styles.resultados}>
            <p className={styles.contador}>
              {query.trim()
                ? `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''} para "${query}"`
                : `${mostrar.length} animes`
              }
            </p>

            {cargando || buscando ? (
              <div className={styles.grid}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className={styles.skeleton} />
                ))}
              </div>
            ) : mostrar.length === 0 ? (
              <div className={styles.vacio}>
                <p>No se encontraron animes</p>
                {hayFiltros && <button className={styles.limpiar} onClick={limpiarFiltros}>Limpiar filtros</button>}
              </div>
            ) : (
              <div className={styles.grid}>
                {mostrar.map((anime: any) => (
                  <AnimeCard
                    key={anime.anilistId ?? anime.id}
                    anilistId={anime.anilistId}
                    titulo={anime.titulo}
                    imagenUrl={anime.imagenUrl}
                    tipo={anime.tipo}
                    anio={anime.anio}
                    calificacion={Number(anime.calificacionPromedio)}
                    onClick={() => window.location.href = `/anime/${anime.anilistId}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
