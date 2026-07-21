import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Layout }    from '../../../components/shared/Layout'
import { AnimeCard } from '../../../components/ui/AnimeCard'
import { api }       from '../../../lib/axios'
import { useBusqueda } from '../../../hooks/useAnime'
import styles        from './DescubrirPage.module.css'

const GENEROS = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller','Mecha']
const TIPOS   = ['TV','MOVIE','OVA','ONA','SPECIAL']
const TEMPORADAS = ['WINTER','SPRING','SUMMER','FALL']
const DEMOGRAFIAS = ['Shounen', 'Shoujo', 'Seinen', 'Josei', 'Kids']

const Categoria = ({ titulo, animes, layout = 'grid', onVerMas }: { titulo: string, animes: any[], layout?: 'grid', onVerMas?: () => void }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!Array.isArray(animes) || animes.length === 0) return null;
  
  // Usaremos un tamaño uniforme: 7 columnas en PC grande, 5 en mediano, 3 en móvil
  let columnas = 4;
  if (windowWidth >= 1600) columnas = 10;
  else if (windowWidth >= 1280) columnas = 8;
  else if (windowWidth >= 768) columnas = 6;
  else columnas = 4;

  
  // Calculamos cuántas filas enteras podemos llenar como máximo (hasta 2 filas)
  const maxFilasCompletas = Math.floor(animes.length / columnas);
  const filasAMostrar = Math.min(2, maxFilasCompletas);
  const limite = filasAMostrar * columnas;
  const items = animes.slice(0, limite);
  const containerClass = styles['layout' + layout];
  
  return (
    <div className={styles.categoriaContenedor}>
      <div className={styles.categoriaHeader}>
        <h3 className={styles.categoriaTitulo}>{titulo}</h3>
        {onVerMas && <button className={styles.verMasBtn} onClick={onVerMas}>Ver más</button>}
      </div>
      <div className={`${styles.categoriaContenido} ${containerClass}`}>
        {items.map((anime, i) => {
          return (
            <div 
              key={anime.id ?? anime.anilistId} 
              className={styles.categoriaItem}
              onClick={() => window.location.href = `/anime/${anime.anilistId}`}
            >
              <div className={styles.categoriaPoster}>
                <img src={anime.imagenUrl} alt={anime.titulo} loading="lazy" />
                <div className={styles.categoriaOverlay}>
                  <h4 className={styles.categoriaAnimeTitulo}>{anime.titulo}</h4>
                  <div className={styles.categoriaMeta}>
                    {anime.calificacionPromedio && <span className={styles.catRating}>★ {(Number(anime.calificacionPromedio) / 10).toFixed(1)}</span>}
                    {anime.anio && <span>{anime.anio}</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const DescubrirPage: React.FC = () => {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialQuery = params.get('q') ?? ''

  const [query,    setQuery]    = useState(initialQuery)
  const [genero,   setGenero]   = useState('')
  const [tipo,     setTipo]     = useState('')
  const [temporada,setTemporada]= useState('')
  const [demografia, setDemografia] = useState('')
  const [animes,   setAnimes]   = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [cargandoCategorias, setCargandoCategorias] = useState(false)

  const [populares, setPopulares] = useState<any[]>([])
  const [recomendados, setRecomendados] = useState<any[]>([])
  const [clasicos, setClasicos] = useState<any[]>([])
  const [romance, setRomance] = useState<any[]>([])
  const [accion, setAccion] = useState<any[]>([])

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') ?? ''
    setQuery(q)
  }, [location.search])

  const { resultados, cargando: buscando } = useBusqueda(query)

  // Cargar categorías principales si no hay búsqueda activa
  useEffect(() => {
    if (query.trim() || genero || tipo || temporada || demografia) return;
    
    const fetchCategories = async () => {
      setCargandoCategorias(true)
      
      const fetchWithRetry = async (url: string, setter: any, retries = 3, delay = 600) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const res = await api.get(url)
            const data = Array.isArray(res.data) ? res.data : (res.data.animes ?? [])
            if (data.length > 0) {
              setter(data)
              return
            }
          } catch (err) {
            console.error(`Error fetching ${url} (attempt ${attempt}/${retries})`, err)
          }
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, delay * attempt))
          }
        }
      }

      // Fetch Romance first (freshest rate limit quota), then the rest
      await fetchWithRetry('/api/animes/populares?genero=Romance', setRomance)
      await new Promise(r => setTimeout(r, 1000))
      
      await fetchWithRetry('/api/animes/populares', setPopulares)
      await new Promise(r => setTimeout(r, 700))
      
      await fetchWithRetry('/api/animes/populares?page=2', setRecomendados)
      await new Promise(r => setTimeout(r, 700))
      
      await fetchWithRetry('/api/animes/populares?anio=1998', setClasicos)
      await new Promise(r => setTimeout(r, 700))
      
      await fetchWithRetry('/api/animes/populares?genero=Action', setAccion)

      setCargandoCategorias(false)
    }
    
    fetchCategories()
  }, [query, genero, tipo, temporada])

  // Aplicar filtros locales
  useEffect(() => {
    if (!genero && !tipo && !temporada && !demografia) return
    setCargando(true)
    const params = new URLSearchParams()
    if (genero)    params.set('genero',    genero)
    if (tipo)      params.set('tipo',      tipo)
    if (temporada) params.set('temporada', temporada)
    if (demografia) params.set('demografia', demografia)
    // Usamos populares para que busque en AniList
    api.get(`/api/animes/populares?${params.toString()}&perPage=40`)
      .then(({ data }) => setAnimes(Array.isArray(data) ? data : data.animes ?? []))
      .finally(() => setCargando(false))
  }, [genero, tipo, temporada])

  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const limpiarFiltros = () => { setGenero(''); setTipo(''); setTemporada(''); setDemografia('') }
  const hayFiltros = genero || tipo || temporada || demografia
  const mostrar = query.trim() ? resultados : animes

  return (
    <Layout>
      <div className={styles.wrap}>

        {/* Buscador grande y filtros desplegados */}
        <div className={styles.heroFiltros}>
          <div className={styles.searchWrapGrande}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              className={styles.searchGrande}
              type="text" 
              placeholder="¿Qué tipo de anime quieres ver hoy?" 
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className={styles.limpiarSearch} onClick={() => setQuery('')}>
                <X size={18} />
              </button>
            )}
            <button 
              className={`${styles.toggleFiltrosBtn} ${mostrarFiltros || hayFiltros ? styles.toggleActivo : ''}`}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              Filtros {hayFiltros ? '(Activos)' : ''}
            </button>
          </div>
          
          {mostrarFiltros && (
            <div className={styles.filtrosDesplegados}>
              <div className={styles.filtroGrupoH}>
                <span className={styles.filtroLabel}>Género:</span>
                <div className={styles.filtroOpcionesH}>
                  <button className={`${styles.chipH} ${!genero ? styles.chipActivo : ''}`} onClick={() => setGenero('')}>Todos</button>
                  {GENEROS.map(g => (
                    <button key={g} className={`${styles.chipH} ${genero === g ? styles.chipActivo : ''}`} onClick={() => setGenero(g)}>{g}</button>
                  ))}
                </div>
              </div>
              <div className={styles.filtroGrupoH}>
                <span className={styles.filtroLabel}>Formato:</span>
                <div className={styles.filtroOpcionesH}>
                  <button className={`${styles.chipH} ${!tipo ? styles.chipActivo : ''}`} onClick={() => setTipo('')}>Todos</button>
                  {TIPOS.map(t => (
                    <button key={t} className={`${styles.chipH} ${tipo === t ? styles.chipActivo : ''}`} onClick={() => setTipo(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className={styles.filtroGrupoH}>
                <span className={styles.filtroLabel}>Temporada:</span>
                <div className={styles.filtroOpcionesH}>
                  <button className={`${styles.chipH} ${!temporada ? styles.chipActivo : ''}`} onClick={() => setTemporada('')}>Todas</button>
                  {TEMPORADAS.map(t => (
                    <button key={t} className={`${styles.chipH} ${temporada === t ? styles.chipActivo : ''}`} onClick={() => setTemporada(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className={styles.filtroGrupoH}>
                <span className={styles.filtroLabel}>Demografía:</span>
                <div className={styles.filtroOpcionesH}>
                  <button className={`${styles.chipH} ${!demografia ? styles.chipActivo : ''}`} onClick={() => setDemografia('')}>Todas</button>
                  {DEMOGRAFIAS.map(d => (
                    <button key={d} className={`${styles.chipH} ${demografia === d ? styles.chipActivo : ''}`} onClick={() => setDemografia(d)}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.layout}>
          {/* Grid de resultados o Categorías */}
          <div className={styles.resultados}>
            {hayFiltros || query.trim() ? (
              <>
                <p className={styles.contador}>
                  {query.trim()
                    ? `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''} para "${query}"`
                    : `${mostrar.length} animes ${genero ? `de ${genero}` : ''}`
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
                    {hayFiltros && <button className={styles.limpiar} onClick={limpiarFiltros}>Volver al inicio</button>}
                  </div>
                ) : (
                  <>
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
                    {hayFiltros && <button className={styles.limpiarBtnCentral} onClick={limpiarFiltros}>Volver a Descubrir</button>}
                  </>
                )}
              </>
            ) : (
              // Vista de Categorías (Netflix style)
              <div className={styles.categoriasWrap}>
                <Categoria layout="grid" titulo="Recomendado para ti" animes={recomendados} onVerMas={() => setGenero('Action')} />
                <Categoria layout="grid" titulo="Animes Populares" animes={populares} />
                <Categoria layout="grid" titulo="Animes Clásicos" animes={clasicos} onVerMas={() => setTemporada('1998')} />
                <Categoria layout="grid" titulo="Amor y Romance" animes={romance} onVerMas={() => setGenero('Romance')} />
                <Categoria layout="grid" titulo="Acción" animes={accion} onVerMas={() => setGenero('Action')} />
                {cargandoCategorias && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-texto-muted)', fontSize: 'var(--text-sm)' }}>
                    Cargando más categorías...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
