import React, { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { Layout }          from '../../../components/shared/Layout'
import { useAnimeDetalle } from '../../../hooks/useAnime'
import { useAuth }         from '../../../hooks/useAuth'
import { ResenaCard }      from '../components/ResenaCard'
import { ResenaForm }      from '../components/ResenaForm'
import { BotonLista }      from '../components/BotonLista'
import { useBiblioteca }   from '../../../hooks/useBiblioteca'
import styles              from './AnimePage.module.css'
import { tipoAnimeLabel, traducirGenero } from '../../../lib/animeLabels'
import { Eye, Heart, Clock, Star, Share2, Users, Edit3, ChevronLeft, ChevronRight } from 'lucide-react'

export const AnimePage: React.FC = () => {
  const { id }                    = useParams<{ id: string }>()
  const location                  = useLocation()
  const navigate                  = useNavigate()
  const { initialAnime }          = location.state || {}
  const { detalle, cargando, isFetching, recargar } = useAnimeDetalle(id ?? null, initialAnime)
  const { usuario, estaAutenticado } = useAuth()
  const { lista, toggleFavorito } = useBiblioteca(usuario?.id ?? null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [loadingFav, setLoadingFav] = useState(false)
  const [isFavoritoLocal, setIsFavoritoLocal] = useState(false)
  const [favError, setFavError] = useState('')
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [sinopsisExpandida, setSinopsisExpandida] = useState(false)
  const [esMovil, setEsMovil] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowLeftScroll(scrollRef.current.scrollLeft > 0)
    }
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  // Recorta en el límite de una frase completa (nunca a mitad de frase)
  const recortarEnFrase = (texto: string, max: number): string => {
    if (texto.length <= max) return texto
    const cut = texto.slice(0, max)
    const idx = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'))
    if (idx >= max * 0.5) return cut.slice(0, idx + 1).trim()
    const space = cut.lastIndexOf(' ')
    return (space > 0 ? cut.slice(0, space) : cut).trim()
  }

  const renderSinopsis = (): string => {
    let text = (detalle?.anime?.sinopsis || '').trim();
    // Eliminar notas de fuente como "(Fuente: ...)" o "(Source: ...)"
    text = text.replace(/\(?(Fuente|Source):[^\)]+\)?/gi, '').trim();
    // Defensa: nunca mostrar mensajes de error de traducción guardados en la DB
    if (/QUERY LENGTH|MAX ALLOWED QUERY/i.test(text) || !text) {
      text = 'Sin sinopsis disponible.';
    }
    let paragraphs = text.split(/\n+/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);

    // En móvil, sin expandir, solo se muestra el primer párrafo recortado en frase completa
    if (esMovil && !sinopsisExpandida && paragraphs.length > 0) {
      return `<p>${recortarEnFrase(paragraphs[0], 240)}</p>`;
    }

    if (paragraphs.length >= 2) {
      return `<p style="margin-bottom: 12px;">${paragraphs[0]}</p><p>${paragraphs.slice(1).join(' ')}</p>`;
    }

    // Si solo hay un párrafo pero contiene <br>, lo separamos por ahí
    if (text.toLowerCase().includes('<br')) {
      paragraphs = text.split(/<br\s*\/?>/ as any).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
      if (paragraphs.length >= 2) {
        return `<p style="margin-bottom: 12px;">${paragraphs[0]}</p><p>${paragraphs.slice(1).join(' ')}</p>`;
      }
    }

    // Si no hay saltos de línea explícitos, lo dividimos en 2 mitades para cumplir la regla
    const sentences = paragraphs[0].match(/[^.!?]+[.!?]+/g) || [paragraphs[0]];
    if (sentences.length <= 1) return `<p>${paragraphs[0]}</p><p></p>`; // Demasiado corto para dividir
    const mid = Math.ceil(sentences.length / 2);
    const p1 = sentences.slice(0, mid).join(' ').trim();
    const p2 = sentences.slice(mid).join(' ').trim();
    return `<p style="margin-bottom: 12px;">${p1}</p><p>${p2}</p>`;
  }

  React.useEffect(() => {
    const entrada = lista.find(x => x.animeId === Number(id))
    if (entrada) setIsFavoritoLocal(!!entrada.esFavorito)
  }, [lista, id])

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (cargando) {
    return (
      <Layout>
        <div className={styles.pageWrapper}>
          {/* Skeleton Header/Banner */}
          <div className={styles.bannerContainer} style={{ background: 'var(--color-surface-2)', animation: 'pulse 1.5s infinite' }} />
          
          <div className={styles.mainContent}>
            {/* Sidebar Skeleton */}
            <div className={styles.sidebar}>
              <div className={styles.posterWrapper} style={{ background: 'var(--color-surface-2)', height: 350, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 40, background: 'var(--color-surface-2)', borderRadius: 8, marginTop: 16, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 40, background: 'var(--color-surface-2)', borderRadius: 8, marginTop: 8, animation: 'pulse 1.5s infinite' }} />
            </div>

            {/* Content Skeleton */}
            <div className={styles.infoCol}>
              <div style={{ height: 48, background: 'var(--color-surface-2)', borderRadius: 8, width: '70%', marginBottom: 16, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 24, background: 'var(--color-surface-2)', borderRadius: 4, width: '40%', marginBottom: 32, animation: 'pulse 1.5s infinite' }} />
              
              <div className={styles.statsContainer}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={styles.statBox} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div style={{ height: 20, width: 20, background: 'var(--color-surface-2)', borderRadius: '50%', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: 16, width: 60, background: 'var(--color-surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                  </div>
                ))}
              </div>

              <div style={{ height: 100, background: 'var(--color-surface-2)', borderRadius: 8, marginTop: 32, animation: 'pulse 1.5s infinite' }} />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </Layout>
    )
  }
  if (!detalle) return <Layout><div className={styles.cargando}>Anime no encontrado</div></Layout>

  const { anime, personajes } = detalle

  // Mostrar la calificación general
  const promedioVisual = (!anime?.calificacionPromedio || Number(anime.calificacionPromedio) === 0) 
    ? '—' 
    : Number(anime.calificacionPromedio).toFixed(2)

  return (
    <Layout>
      <div className={styles.pageWrapper}>
        {/* Backdrop Banner */}
        {anime.bannerUrl && (
          <div className={styles.backdrop}>
            <div className={styles.backdropImage} style={{ backgroundImage: `url(${anime.bannerUrl})` }} />
            <div className={styles.backdropFade} />
          </div>
        )}

        <div className={styles.container}>
          <div className={styles.layoutGrid}>
            
            {/* ── COLUMNA IZQUIERDA (Póster y Stats) ── */}
            <aside className={styles.leftCol}>
              <div className={styles.posterWrapper}>
                <img src={anime.imagenUrl} alt={anime.titulo} className={styles.poster} />
              </div>
              
              <div className={styles.statsPanel}>
                <div className={styles.statItem} title="Estrellas">
                  <span className={styles.statIconTextStar}>★</span>
                  <span>{promedioVisual}</span>
                </div>
                <div className={styles.statItem} title="Viendo">
                  <Eye size={16} color="#27ae60" />
                  <span>{anime.stats?.viendo ?? 0}</span>
                </div>
                <div className={styles.statItem} title="Por Ver">
                  <Clock size={16} className={styles.statIcon} />
                  <span>{anime.stats?.porVer ?? 0}</span>
                </div>
                <div className={styles.statItem} title="Gustan">
                  <Heart size={16} color="#ff4757" />
                  <span>{anime.stats?.favoritos ?? 0}</span>
                </div>
              </div>

              <div className={styles.leftActions}>
                <BotonLista animeId={anime.id} onListaChange={recargar} />
                <button className={styles.leftBtn} onClick={() => navigate('/comunidades')}>
                  <Users size={16} /> Ver Comunidades
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button 
                    className={`${styles.leftBtn} ${isFavoritoLocal ? styles.favBtnActive : ''}`}
                    onClick={async () => {
                      if (!estaAutenticado) {
                        return navigate('/auth', { state: { message: 'Debes iniciar sesión para acceder a esta función' } })
                      }
                      
                      const totalFavs = lista.filter((l: any) => l.esFavorito).length
                      if (!isFavoritoLocal && totalFavs >= 5) {
                        setFavError('Límite de 5 favoritos alcanzado.')
                        setTimeout(() => setFavError(''), 3000)
                        return
                      }

                      if (loadingFav) return
                      setLoadingFav(true)
                      
                      // Optimistic UI Update local
                      setIsFavoritoLocal(!isFavoritoLocal)

                      try {
                        const nuevoEstado = await toggleFavorito(anime.id)
                        setIsFavoritoLocal(nuevoEstado)
                      } catch (err: any) {
                        setIsFavoritoLocal(isFavoritoLocal) // rollback
                        setFavError(err.response?.data?.error || 'Error al actualizar favoritos')
                        setTimeout(() => setFavError(''), 3000)
                      } finally {
                        setLoadingFav(false)
                      }
                    }}
                    disabled={loadingFav}
                  >
                    <Star size={16} fill={isFavoritoLocal ? "currentColor" : "none"} /> 
                    {isFavoritoLocal ? 'Favorito' : 'Añadir Favorito'}
                  </button>
                  {favError && (
                    <span style={{ color: 'var(--color-error)', fontSize: '12px', textAlign: 'center' }}>
                      {favError}
                    </span>
                  )}
                </div>
                
                <button 
                  className={`${styles.leftBtn} ${styles.reviewBtn}`}
                  onClick={() => {
                    if (!estaAutenticado) {
                      return navigate('/auth', { state: { message: 'Debes iniciar sesión para acceder a esta función' } })
                    }
                    if (!showReviewForm) setShowReviewForm(true);
                    setTimeout(() => document.getElementById('reviewSection')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                >
                  <Edit3 size={16} /> Escribir reseña
                </button>
              </div>
            </aside>

            {/* ── COLUMNA CENTRAL (Info Principal) ── */}
            <main className={styles.mainCol} style={{ opacity: isFetching ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              <header className={styles.header}>
                <h1 className={styles.title}>{anime.titulo}</h1>
                <div className={styles.subtitle}>
                  <span className={styles.year}>{anime.anio}</span>
                  {anime.estudio && (
                    <span className={styles.director}>Dirigido por <strong>{anime.estudio}</strong></span>
                  )}
                  {anime.autor && (
                    <>
                      <span className={styles.separator}>•</span>
                      <span className={styles.director}>Creado por <strong>{anime.autor}</strong></span>
                    </>
                  )}
                </div>
              </header>

              <section className={`${styles.synopsis} ${sinopsisExpandida ? styles.sinopsisExpandida : ''}`}>
                {isFetching ? (
                  <div style={{ opacity: 0.6 }}>
                    <div style={{ height: 16, background: 'var(--color-surface-2)', borderRadius: 4, width: '100%', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: 16, background: 'var(--color-surface-2)', borderRadius: 4, width: '90%', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: 16, background: 'var(--color-surface-2)', borderRadius: 4, width: '95%', marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                  </div>
                ) : (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: renderSinopsis() }} />
                    {esMovil && (
                      <button className={styles.sinopsisToggle} onClick={() => setSinopsisExpandida(v => !v)}>
                        {sinopsisExpandida ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </>
                )}
              </section>

              <div className={styles.infoRow}>
                {/* DETAILS (Detalles Técnicos) */}
                <section className={styles.sectionNoBorder}>
                  <h3 className={styles.sectionTitle}>DETALLES</h3>
                  <div className={styles.detailsList}>
                    {anime.tipo && (
                      <span>
                        {tipoAnimeLabel(anime.tipo)}
                      </span>
                    )}
                    {anime.episodios && anime.tipo !== 'MOVIE' && <span>{anime.episodios} episodios</span>}
                    {anime.duracionMin && <span>{anime.duracionMin} mins</span>}
                    {anime.estadoEmision && <span>{anime.estadoEmision === 'RELEASING' ? 'En Emisión' : anime.estadoEmision === 'FINISHED' ? 'Finalizado' : anime.estadoEmision}</span>}
                    {anime.demografia && <span>Demografía: {anime.demografia}</span>}
                  </div>
                </section>

                {/* GENRES (Géneros) */}
                <section className={styles.sectionNoBorder}>
                  <h3 className={styles.sectionTitle}>GÉNEROS</h3>
                  <div className={styles.genresList}>
                    {isFetching && (!anime.generos || anime.generos.length === 0) ? (
                      <>
                        <span className={styles.genreBadge} style={{ background: 'var(--color-surface-2)', color: 'transparent', animation: 'pulse 1.5s infinite' }}>Cargando</span>
                        <span className={styles.genreBadge} style={{ background: 'var(--color-surface-2)', color: 'transparent', animation: 'pulse 1.5s infinite' }}>Cargando</span>
                      </>
                    ) : (
                      anime.generos?.slice(0, 8).map((g: string) => {
                        const espanol = traducirGenero(g)
                        const reverseMap: Record<string, string> = { "Acción": "Action", "Aventura": "Adventure", "Comedia": "Comedy", "Fantasía": "Fantasy", "Terror": "Horror", "Misterio": "Mystery", "Ciencia Ficción": "Sci-Fi", "Recuentos de la vida": "Slice of Life", "Deportes": "Sports", "Sobrenatural": "Supernatural", "Suspenso": "Thriller", "Psicológico": "Psychological", "Música": "Music", "Chicas Mágicas": "Mahou Shoujo" }
                        const queryG = reverseMap[espanol] || g
                        return <Link key={g} to={`/descubrir?genero=${queryG}`} className={styles.genreBadge}>{espanol}</Link>
                      })
                    )}
                  </div>
                </section>
              </div>

              {/* CAST (Personajes) */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>PERSONAJES</h3>
                <div className={styles.carouselContainer}>
                  {isFetching && (!personajes || personajes.length === 0) ? (
                    <div className={styles.castGrid}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={styles.castItem}>
                          <div className={styles.castImgWrapper} style={{ background: 'var(--color-surface-2)', animation: 'pulse 1.5s infinite' }} />
                          <div style={{ height: 12, background: 'var(--color-surface-2)', width: '70%', margin: '8px auto 0', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                        </div>
                      ))}
                    </div>
                  ) : personajes && personajes.length > 0 ? (
                    <>
                      {showLeftScroll && (
                        <button className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`} onClick={scrollLeft}>
                          <ChevronLeft size={32} />
                        </button>
                      )}
                      <button className={`${styles.scrollBtn} ${styles.scrollBtnRight}`} onClick={scrollRight}>
                        <ChevronRight size={32} />
                      </button>
                      <div className={styles.castGrid} ref={scrollRef} onScroll={handleScroll}>
                        {(personajes ?? []).map((p: any) => (
                          <div key={p.id} className={styles.castItem}>
                            <div className={styles.castImgWrapper}>
                              <img src={p.imagenUrl} alt={p.nombre} title={p.nombre} loading="lazy" decoding="async" />
                            </div>
                            <span className={styles.castName}>{p.nombre.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ color: 'var(--color-text-dim)', fontSize: 14 }}>No hay personajes registrados.</p>
                  )}
                </div>
              </section>
            </main>
          </div>

          {/* Formulario de Reseña (Toggle) */}
          {showReviewForm && estaAutenticado && (
            <div id="reviewSection" className={styles.reviewFormSection}>
              <h3 className={styles.sectionTitle}>ESCRIBE TU RESEÑA</h3>
              <ResenaForm animeId={anime.id} onCreada={() => {
                setShowReviewForm(false)
                recargar()
              }} />
            </div>
          )}

          {/* ── SECCIÓN INFERIOR (Reseñas) ── */}
          <div className={styles.reviewsSection}>
            <h3 className={styles.reviewsHeader}>RESEÑAS POPULARES</h3>
            <div className={styles.reviewsGrid}>
              {(anime.resenas ?? []).length === 0
                ? <p className={styles.vacio}>Aún no hay reseñas para este anime.</p>
                : (anime.resenas ?? []).map((r: any) => <ResenaCard key={r.id} resena={r} />)
              }
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}
