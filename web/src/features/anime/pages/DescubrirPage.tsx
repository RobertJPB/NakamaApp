import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Layout }    from '../../../components/shared/Layout'
import { AnimeCard } from '../../../components/ui/AnimeCard'
import { api, getCached } from '../../../lib/axios'
import { useBusqueda } from '../../../hooks/useAnime'
import styles        from './DescubrirPage.module.css'

const GENEROS = [
  { value: 'Action', label: 'Acción' }, { value: 'Adventure', label: 'Aventura' }, { value: 'Comedy', label: 'Comedia' },
  { value: 'Drama', label: 'Drama' }, { value: 'Fantasy', label: 'Fantasía' }, { value: 'Horror', label: 'Terror' },
  { value: 'Mystery', label: 'Misterio' }, { value: 'Romance', label: 'Romance' }, { value: 'Sci-Fi', label: 'Ciencia Ficción' },
  { value: 'Slice of Life', label: 'Recuentos de la vida' }, { value: 'Sports', label: 'Deportes' }, { value: 'Supernatural', label: 'Sobrenatural' },
  { value: 'Thriller', label: 'Suspenso' }, { value: 'Mecha', label: 'Mecha' }
]
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
  if (windowWidth >= 1600) columnas = 11;
  else if (windowWidth >= 1280) columnas = 9;
  else if (windowWidth >= 768) columnas = 7;
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
              key={anime.id ?? anime.externalId} 
              className={styles.categoriaItem}
              onClick={() => window.location.href = `/anime/${anime.externalId}`}
            >
              <div className={styles.categoriaPoster}>
                <img src={anime.imagenUrl} alt={anime.titulo} loading="lazy" />
                <div className={styles.categoriaOverlay}>
                  <h4 className={styles.categoriaAnimeTitulo}>{anime.titulo}</h4>
                  <div className={styles.categoriaMeta}>
                    {anime.calificacionPromedio && <span className={styles.catRating}>★ {Number(anime.calificacionPromedio).toFixed(1)}</span>}
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
  const initialGenero = params.get('genero') ?? ''

  const [query,    setQuery]    = useState(initialQuery)
  const [genero,   setGenero]   = useState(initialGenero)
  const [tipo,     setTipo]     = useState('')
  const [temporada,setTemporada]= useState('')
  const [demografia, setDemografia] = useState('')
  const [anio,       setAnio]       = useState('')
  const [page,       setPage]       = useState(1)
  const [animes,   setAnimes]   = useState<any[]>([])
  const [cargando, setCargando] = useState(false)
  const [cargandoCategorias, setCargandoCategorias] = useState(false)

  const [populares,    setPopulares]    = useState<any[]>(() => getCached('/api/animes/populares') ?? [])
  const [recomendados, setRecomendados] = useState<any[]>(() => getCached('/api/animes/populares?page=2') ?? [])
  const [clasicos,     setClasicos]     = useState<any[]>(() => getCached('/api/animes/populares?anio=1998') ?? [])
  const [romance,      setRomance]      = useState<any[]>(() => getCached('/api/animes/populares?genero=Romance') ?? [])
  const [accion,       setAccion]       = useState<any[]>(() => getCached('/api/animes/populares?genero=Action') ?? [])
  const [comedia,      setComedia]      = useState<any[]>(() => getCached('/api/animes/populares?genero=Comedy') ?? [])
  const [terror,       setTerror]       = useState<any[]>(() => getCached('/api/animes/populares?genero=Horror') ?? [])
  const [scifi,        setScifi]        = useState<any[]>(() => getCached('/api/animes/populares?genero=Sci-Fi') ?? [])
  const [fantasia,     setFantasia]     = useState<any[]>(() => getCached('/api/animes/populares?genero=Fantasy') ?? [])
  const [deportes,     setDeportes]     = useState<any[]>(() => getCached('/api/animes/populares?genero=Sports') ?? [])
  const [misterio,     setMisterio]     = useState<any[]>(() => getCached('/api/animes/populares?genero=Mystery') ?? [])
  const [mecha,        setMecha]        = useState<any[]>(() => getCached('/api/animes/populares?genero=Mecha') ?? [])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    setQuery(searchParams.get('q') ?? '')
    setGenero(searchParams.get('genero') ?? '')
  }, [location.search])

  const { resultados, cargando: buscando } = useBusqueda(query)

  // Cargar categorías principales si no hay búsqueda activa
  useEffect(() => {
    if (query.trim() || genero || tipo || temporada || demografia) return;

    // Each category fetches and renders independently as soon as it arrives
    const fetchAndSet = (url: string, setter: (d: any[]) => void) => {
      // Show cached data immediately
      const cached = getCached(url)
      if (cached && cached.length > 0) setter(cached)

      api.get(url)
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : (res.data.animes ?? [])
          if (data.length > 0) setter(data)
        })
        .catch(() => {})
    }

    fetchAndSet('/api/animes/populares',              setPopulares)
    fetchAndSet('/api/animes/populares?page=2',       setRecomendados)
    fetchAndSet('/api/animes/populares?anio=1998',    setClasicos)
    fetchAndSet('/api/animes/populares?genero=Romance', setRomance)
    fetchAndSet('/api/animes/populares?genero=Action',  setAccion)
    fetchAndSet('/api/animes/populares?genero=Comedy',  setComedia)
    fetchAndSet('/api/animes/populares?genero=Horror',  setTerror)
    fetchAndSet('/api/animes/populares?genero=Sci-Fi',  setScifi)
    fetchAndSet('/api/animes/populares?genero=Fantasy', setFantasia)
    fetchAndSet('/api/animes/populares?genero=Sports',  setDeportes)
    fetchAndSet('/api/animes/populares?genero=Mystery', setMisterio)
    fetchAndSet('/api/animes/populares?genero=Mecha',   setMecha)

    setCargandoCategorias(false)
  }, [query, genero, tipo, temporada])

  // Aplicar filtros locales
  useEffect(() => {
    if (!genero && !tipo && !temporada && !demografia && !anio) return
    setCargando(true)
    const params = new URLSearchParams()
    if (genero)    params.set('genero',    genero)
    if (tipo)      params.set('tipo',      tipo)
    if (temporada) params.set('temporada', temporada)
    if (demografia) params.set('demografia', demografia)
    if (anio)       params.set('anio',       anio)
    params.set('page', page.toString())
    params.set('perPage', '40')
    
    // Usamos populares para que busque en AniList
    api.get(`/api/animes/populares?${params.toString()}`)
      .then(({ data }) => setAnimes(Array.isArray(data) ? data : data.animes ?? []))
      .finally(() => setCargando(false))
  }, [genero, tipo, temporada, demografia, anio, page])

  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const handleSetGenero = (v: string) => { setGenero(v); setPage(1) }
  const handleSetTipo = (v: string) => { setTipo(v); setPage(1) }
  const handleSetTemporada = (v: string) => { setTemporada(v); setPage(1) }
  const handleSetDemografia = (v: string) => { setDemografia(v); setPage(1) }
  const handleSetAnio = (v: string) => { setAnio(v); setPage(1) }

  const limpiarFiltros = () => { setGenero(''); setTipo(''); setTemporada(''); setDemografia(''); setAnio(''); setPage(1); }
  const hayFiltros = genero || tipo || temporada || demografia || anio
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
              placeholder="¿Qué tipo de anime quieres buscar hoy?" 
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
                  <button className={`${styles.chipH} ${!genero ? styles.chipActivo : ''}`} onClick={() => handleSetGenero('')}>Todos</button>
                  {GENEROS.map(g => (
                    <button key={g.value} className={`${styles.chipH} ${genero === g.value ? styles.chipActivo : ''}`} onClick={() => handleSetGenero(g.value)}>{g.label}</button>
                  ))}
                </div>
              </div>
              <div className={styles.filtroGrupoH}>
                <span className={styles.filtroLabel}>Formato:</span>
                <div className={styles.filtroOpcionesH}>
                  <button className={`${styles.chipH} ${!tipo ? styles.chipActivo : ''}`} onClick={() => handleSetTipo('')}>Todos</button>
                  {TIPOS.map(t => (
                    <button key={t} className={`${styles.chipH} ${tipo === t ? styles.chipActivo : ''}`} onClick={() => handleSetTipo(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className={styles.filtroGrupoH}>
                <span className={styles.filtroLabel}>Temporada:</span>
                <div className={styles.filtroOpcionesH}>
                  <button className={`${styles.chipH} ${!temporada ? styles.chipActivo : ''}`} onClick={() => handleSetTemporada('')}>Todas</button>
                  {TEMPORADAS.map(t => (
                    <button key={t} className={`${styles.chipH} ${temporada === t ? styles.chipActivo : ''}`} onClick={() => handleSetTemporada(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className={styles.filtroGrupoH}>
                <span className={styles.filtroLabel}>Demografía:</span>
                <div className={styles.filtroOpcionesH}>
                  <button className={`${styles.chipH} ${!demografia ? styles.chipActivo : ''}`} onClick={() => handleSetDemografia('')}>Todas</button>
                  {DEMOGRAFIAS.map(d => (
                    <button key={d} className={`${styles.chipH} ${demografia === d ? styles.chipActivo : ''}`} onClick={() => handleSetDemografia(d)}>{d}</button>
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
                <div className={styles.resultadosHeader}>
                  <h2 className={styles.resultadosTitulo}>
                    {query.trim() 
                      ? 'Resultados de búsqueda' 
                      : (anio === '1998' 
                          ? 'Animes Clásicos' 
                          : (genero 
                              ? `Animes de ${GENEROS.find(g => g.value === genero)?.label || genero}` 
                              : 'Todos los Animes'))}
                  </h2>
                  {query.trim() && (
                    <p className={styles.contador}>
                      {`${resultados.length} resultado${resultados.length !== 1 ? 's' : ''} para "${query}"`}
                    </p>
                  )}
                </div>

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
                          key={anime.externalId ?? anime.id}
                          externalId={anime.externalId}
                          titulo={anime.titulo}
                          imagenUrl={anime.imagenUrl}
                          tipo={anime.tipo}
                          anio={anime.anio}
                          calificacion={Number(anime.calificacionPromedio)}
                          onClick={() => window.location.href = `/anime/${anime.externalId}`}
                        />
                      ))}
                    </div>
                    {hayFiltros && !query.trim() && (
                      <div className={styles.paginacion}>
                        <button 
                          className={styles.pageBtn} 
                          disabled={page === 1} 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                          Anterior
                        </button>
                        <span className={styles.pageText}>Página {page}</span>
                        <button 
                          className={styles.pageBtn} 
                          disabled={mostrar.length < 40}
                          onClick={() => setPage(p => p + 1)}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                    {hayFiltros && <button className={styles.limpiarBtnCentral} onClick={limpiarFiltros}>Volver a Descubrir</button>}
                  </>
                )}
              </>
            ) : (
              // Vista de Categorías (Netflix style)
              <div className={styles.categoriasWrap}>
                <Categoria layout="grid" titulo="Recomendado para ti"   animes={recomendados} onVerMas={() => handleSetGenero('Action')} />
                <Categoria layout="grid" titulo="Animes Populares"      animes={populares} />
                <Categoria layout="grid" titulo="Acción"                animes={accion}    onVerMas={() => handleSetGenero('Action')} />
                <Categoria layout="grid" titulo="Comedia"               animes={comedia}   onVerMas={() => handleSetGenero('Comedy')} />
                <Categoria layout="grid" titulo="Fantasía"              animes={fantasia}  onVerMas={() => handleSetGenero('Fantasy')} />
                <Categoria layout="grid" titulo="Romance"               animes={romance}   onVerMas={() => handleSetGenero('Romance')} />
                <Categoria layout="grid" titulo="Ciencia Ficción"       animes={scifi}     onVerMas={() => handleSetGenero('Sci-Fi')} />
                <Categoria layout="grid" titulo="Animes Clásicos"       animes={clasicos}  onVerMas={() => handleSetAnio('1998')} />
                <Categoria layout="grid" titulo="Deportes"              animes={deportes}  onVerMas={() => handleSetGenero('Sports')} />
                <Categoria layout="grid" titulo="Misterio"              animes={misterio}  onVerMas={() => handleSetGenero('Mystery')} />
                <Categoria layout="grid" titulo="Terror"                animes={terror}    onVerMas={() => handleSetGenero('Horror')} />
                <Categoria layout="grid" titulo="Mecha"                 animes={mecha}     onVerMas={() => handleSetGenero('Mecha')} />
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
