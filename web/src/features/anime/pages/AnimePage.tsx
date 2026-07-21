import React, { useState, useRef } from 'react'
import { useParams }       from 'react-router-dom'
import { Layout }          from '../../../components/shared/Layout'
import { useAnimeDetalle } from '../../../hooks/useAnime'
import { useAuth }         from '../../../hooks/useAuth'
import { ResenaCard }      from '../components/ResenaCard'
import { ResenaForm }      from '../components/ResenaForm'
import { PersonajeCard }   from '../components/PersonajeCard'
import { BotonLista }      from '../components/BotonLista'
import { useBiblioteca }   from '../../../hooks/useBiblioteca'
import styles              from './AnimePage.module.css'
import { Eye, Heart, Clock, Star, Share2, Users, Edit3, ChevronLeft, ChevronRight } from 'lucide-react'

export const AnimePage: React.FC = () => {
  const { id }                    = useParams<{ id: string }>()
  const { detalle, cargando, recargar } = useAnimeDetalle(Number(id))
  const { usuario, estaAutenticado } = useAuth()
  const { lista, toggleFavorito } = useBiblioteca(usuario?.id ?? null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [loadingFav, setLoadingFav] = useState(false)
  const [isFavoritoLocal, setIsFavoritoLocal] = useState(false)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  React.useEffect(() => {
    const entrada = lista.find(x => x.animeId === Number(id))
    if (entrada) setIsFavoritoLocal(!!entrada.esFavorito)
  }, [lista, id])

  if (cargando) return <Layout><div className={styles.cargando}>Cargando...</div></Layout>
  if (!detalle) return <Layout><div className={styles.cargando}>Anime no encontrado</div></Layout>

  const { anime, personajes } = detalle

  // Mostrar la calificación general (MyAnimeList)
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
                <BotonLista animeId={anime.id} />
                <button className={styles.leftBtn}>
                  <Users size={16} /> Ver Comunidades
                </button>
                <button 
                  className={`${styles.leftBtn} ${isFavoritoLocal ? styles.favBtnActive : ''}`}
                  onClick={async () => {
                    if (!estaAutenticado) return alert('Debes iniciar sesión')
                    if (loadingFav) return
                    setLoadingFav(true)
                    
                    // Optimistic UI Update local
                    setIsFavoritoLocal(!isFavoritoLocal)

                    try {
                      const nuevoEstado = await toggleFavorito(anime.id)
                      setIsFavoritoLocal(nuevoEstado)
                    } catch (err: any) {
                      setIsFavoritoLocal(isFavoritoLocal) // rollback
                      alert(err.response?.data?.error || 'Error al actualizar favoritos')
                    } finally {
                      setLoadingFav(false)
                    }
                  }}
                  disabled={loadingFav}
                >
                  <Star size={16} fill={isFavoritoLocal ? "currentColor" : "none"} /> 
                  {isFavoritoLocal ? 'Favorito' : 'Añadir Favorito'}
                </button>
                
                <button 
                  className={`${styles.leftBtn} ${styles.reviewBtn}`}
                  onClick={() => {
                    if (!showReviewForm) setShowReviewForm(true);
                    setTimeout(() => document.getElementById('reviewSection')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                >
                  <Edit3 size={16} /> Escribir reseña
                </button>
              </div>
            </aside>

            {/* ── COLUMNA CENTRAL (Info Principal) ── */}
            <main className={styles.mainCol}>
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

              <div className={styles.synopsis}>
                {anime.sinopsis ? (
                  <div dangerouslySetInnerHTML={{ __html: (() => {
                    let text = anime.sinopsis.replace(/<br\s*\/?>/gi, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                    if (sentences.length <= 1) return `<p>${text}</p>`;
                    const mid = Math.ceil(sentences.length / 2);
                    const p1 = sentences.slice(0, mid).join(' ').trim();
                    const p2 = sentences.slice(mid).join(' ').trim();
                    return `<p style="margin-bottom: 12px;">${p1}</p><p>${p2}</p>`;
                  })() }}></div>
                ) : (
                  <p>Sin sinopsis disponible.</p>
                )}
              </div>


              <div className={styles.infoRow}>
                {/* DETAILS (Detalles Técnicos) */}
                <section className={styles.sectionNoBorder}>
                  <h3 className={styles.sectionTitle}>DETALLES</h3>
                  <div className={styles.detailsList}>
                    {anime.tipo && (
                      <span>
                        {anime.tipo === 'MOVIE' ? 'Película' : 
                         anime.tipo === 'TV' ? 'Serie TV' : 
                         anime.tipo === 'TV_SHORT' ? 'Corto TV' : 
                         anime.tipo === 'SPECIAL' ? 'Especial' : 
                         anime.tipo}
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
                    {anime.generos?.map((g: string) => (
                      <a key={g} href={`/descubrir?genero=${g}`} className={styles.genreBadge}>{g}</a>
                    ))}
                  </div>
                </section>
              </div>

              {/* CAST (Personajes) */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>PERSONAJES</h3>
                <div className={styles.carouselContainer}>
                  {personajes && personajes.length > 0 && (
                    <>
                      {showLeftScroll && (
                        <button className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`} onClick={scrollLeft}>
                          <ChevronLeft size={32} />
                        </button>
                      )}
                      <button className={`${styles.scrollBtn} ${styles.scrollBtnRight}`} onClick={scrollRight}>
                        <ChevronRight size={32} />
                      </button>
                    </>
                  )}
                  <div className={styles.castGrid} ref={scrollRef} onScroll={handleScroll}>
                  {(personajes ?? []).map((p: any) => (
                    <div key={p.id} className={styles.castItem}>
                      <div className={styles.castImgWrapper}>
                        <img src={p.imagenUrl} alt={p.nombre} title={p.nombre} />
                      </div>
                      <span className={styles.castName}>{p.nombre.split(' ')[0]}</span>
                    </div>
                  ))}
                  </div>
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
