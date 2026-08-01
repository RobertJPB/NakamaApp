import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Tv, 
  Star, 
  Trophy, 
  MessageCircle,
} from 'lucide-react'
import { Layout } from '../../../components/shared/Layout'
import { NewsSection } from '../../feed/components/NewsSection'
import styles from './HomePage.module.css'
import { useAuth } from '../../../hooks/useAuth'
import { useAnimes } from '../../../hooks/useAnimes'
import { prefetchAnimeDetalle } from '../../../hooks/useAnime'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../../lib/axios'

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes}m`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

/* ─── Animes destacados (hero rotativo - 3D Stack) ─────────────────────────── */
const FEATURED = [
  {
    id: 41370,
    badge: 'Anime destacado',
    titulo: 'Kimetsu no Yaiba',
    subtitulo: 'Demon Slayer: Kimetsu no Yaiba',
    descripcion:
      'En el Japón de la era Taisho, Tanjiro Kamado se convierte en cazador de demonios para salvar a su hermana Nezuko, convertida en demonio tras el ataque que destruyó a su familia.',
    anio: '2019',
    episodios: '26 eps',
    genero: 'Acción · Sobrenatural',
    puntuacion: '9.0',
    imagen: 'https://i.blogs.es/e2f53f/kimetsu/1200_800.webp',
    color: 'rgba(160, 28, 28, 0.4)',
    slug: 'kimetsu-no-yaiba',
  },
  {
    id: 42765,
    badge: 'Muy valorado',
    titulo: 'Jujutsu Kaisen',
    subtitulo: 'Jujutsu Kaisen',
    descripcion:
      'Yuji Itadori ingresa al mundo de los hechiceros al tragarse un dedo de Ryomen Sukuna, el rey de las maldiciones, para proteger a sus amigos de seres sobrenaturales.',
    anio: '2020',
    episodios: '24 eps',
    genero: 'Acción · Oscuro',
    puntuacion: '8.8',
    imagen: 'https://static0.colliderimages.com/wordpress/wp-content/uploads/2023/10/jujutsu-kaisen-poster.jpg?q=50&fit=crop&w=1232&h=693&dpr=1.5',
    color: 'rgba(18, 70, 160, 0.4)',
    slug: 'jujutsu-kaisen',
  },
  {
    id: 12,
    badge: 'Clásico',
    titulo: 'One Piece',
    subtitulo: 'One Piece',
    descripcion:
      'Monkey D. Luffy lidera a los Sombreros de Paja en busca del One Piece, el legendario tesoro que convertirá a su portador en el Rey de los Piratas.',
    anio: '1999',
    episodios: '1000+ eps',
    genero: 'Aventura · Comedia',
    puntuacion: '8.7',
    imagen: 'https://5motivi.it/wp-content/uploads/2025/04/One-Piece-Cappello-di-Paglia-cose-da-sapere-ciurma-Monkey-D-Luffy-1-1024x576.jpg',
    color: 'rgba(160, 100, 18, 0.4)',
    slug: 'one-piece',
  },
]

/* ─── Pinned / Fast Launch (Seguimiento Rápido en Sidebar) ──────────────── */
const FAST_LAUNCH = [
  { id: 41370, titulo: 'Demon Slayer', ep: 'Ep 12/26', pct: 46, imagen: 'https://i.blogs.es/e2f53f/kimetsu/1200_800.webp' },
  { id: 42765, titulo: 'Jujutsu Kaisen', ep: 'Ep 22/24', pct: 91, imagen: 'https://static0.colliderimages.com/wordpress/wp-content/uploads/2023/10/jujutsu-kaisen-poster.jpg?q=50&fit=crop&w=1232&h=693&dpr=1.5' },
  { id: 12, titulo: 'One Piece', ep: 'Ep 950/1000', pct: 95, imagen: 'https://5motivi.it/wp-content/uploads/2025/04/One-Piece-Cappello-di-Paglia-cose-da-sapere-ciurma-Monkey-D-Luffy-1-1024x576.jpg' },
]



/* ─── Populares (top 10) ────────────────────────────────────────── */
const POPULARES = [
  { id: 3936,   titulo: 'Fullmetal Alchemist: Brotherhood', genero: 'Acción · Aventura',    nota: '9.2' },
  { id: 5646,   titulo: 'Steins;Gate',                      genero: 'Sci-Fi · Thriller',     nota: '9.1' },
  { id: 46474, titulo: 'Frieren',                          genero: 'Fantasía · Drama',      nota: '9.1' },
  { id: 41370, titulo: 'Kimetsu no Yaiba',                 genero: 'Acción · Sobrenatural', nota: '9.0' },
  { id: 7442,  titulo: 'Attack on Titan',                  genero: 'Acción · Drama',        nota: '9.0' },
  { id: 6448,  titulo: 'Hunter x Hunter (2011)',           genero: 'Aventura · Fantasía',   nota: '8.9' },
  { id: 45857, titulo: 'Jujutsu Kaisen 2',                 genero: 'Acción · Oscuro',       nota: '8.9' },
  { id: 12230,  titulo: 'Violet Evergarden',                genero: 'Drama · Slice of Life', nota: '8.8' },
  { id: 41084, titulo: 'Vinland Saga',                     genero: 'Acción · Historia',     nota: '8.8' },
  { id: 13273,  titulo: 'Made in Abyss',                    genero: 'Aventura · Oscuro',     nota: '8.7' },
]



export const HomePage: React.FC = () => {
  const [featuredIdx,  setFeaturedIdx]  = useState(0)
  const [tabActivo,    setTabActivo]    = useState<'hoy' | 'semana' | 'mes'>('hoy')
  const { usuario, estaAutenticado, signOut } = useAuth()
  const { animes, cargando, error, pagina, setPagina, totalPaginas } = useAnimes()
  const navigate = useNavigate()
  
  const animesMostrados = React.useMemo(() => {
    if (tabActivo === 'hoy') return animes
    if (tabActivo === 'semana') return [...animes].reverse()
    if (tabActivo === 'mes') {
      const mitad = Math.floor(animes.length / 2)
      return [...animes.slice(mitad), ...animes.slice(0, mitad)]
    }
    return animes
  }, [animes, tabActivo])
  
  const [resenasRecientes, setResenasRecientes] = useState<any[]>([])
  const [cargandoResenas, setCargandoResenas] = useState(true)

  useEffect(() => {
    api.get('/api/resenas/recientes')
      .then(res => setResenasRecientes(res.data))
      .catch(err => console.error('Error al cargar reseñas recientes:', err))
      .finally(() => setCargandoResenas(false))
  }, [])

  // Auto-avance del carrusel cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIdx((prev) => (prev + 1) % FEATURED.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  console.log('[DEBUG] HomePage render -> animes.length:', animes.length, 'cargando:', cargando, 'error:', error)

  const nextSlide = () => {
    setFeaturedIdx((prev) => (prev + 1) % FEATURED.length)
  }

  const prevSlide = () => {
    setFeaturedIdx((prev) => (prev - 1 + FEATURED.length) % FEATURED.length)
  }

  return (
    <Layout>
      {/* 3D CAROUSEL BANNERS */}
        <section className={styles.carouselSection}>
          <div className={styles.carouselContainer}>
            {FEATURED.map((item, idx) => {
              // Calculate positioning classes relative to active slide
              let positionClass = styles.slideHidden
              if (idx === featuredIdx) {
                positionClass = styles.slideActive
              } else if (idx === (featuredIdx + 1) % FEATURED.length) {
                positionClass = styles.slideNext
              } else if (idx === (featuredIdx - 1 + FEATURED.length) % FEATURED.length) {
                positionClass = styles.slidePrev
              }

              return (
                <div 
                  key={item.id} 
                  className={`${styles.carouselCard} ${positionClass}`}
                  onClick={() => idx !== featuredIdx && setFeaturedIdx(idx)}
                >
                  <img src={item.imagen} alt={item.titulo} className={styles.cardBgImage} />
                  <div className={styles.cardOverlayGlow} style={{ background: `linear-gradient(to top, rgba(6, 5, 10, 0.99) 25%, rgba(6, 5, 10, 0.7) 60%, rgba(6, 5, 10, 0.2) 100%)` }} />
                  
                  {idx === featuredIdx && (
                    <div className={styles.cardContent}>
                      <span className={styles.cardBadge}>{item.badge}</span>
                      <h2 className={styles.cardTitle}>{item.titulo}</h2>
                      <p className={styles.cardSub}>{item.subtitulo}</p>
                      
                      <div className={styles.cardMeta}>
                        <span className={styles.metaItem}>
                          <Calendar size={13} /> {item.anio}
                        </span>
                        <span className={styles.metaItem}>
                          <Tv size={13} /> {item.episodios}
                        </span>
                        <span className={styles.metaItem}>
                          <Star className={styles.starYellow} size={13} fill="currentColor" /> {item.puntuacion}
                        </span>
                      </div>
                      
                      <p className={styles.cardDesc}>{item.descripcion}</p>
                      
                      <div className={styles.cardActions}>
                        <Link 
                          to={`/anime/${item.id}`} 
                          state={{ initialAnime: { externalId: item.id, titulo: item.titulo, imagenUrl: item.imagen, calificacionPromedio: Number(item.puntuacion), sinopsis: item.descripcion } }}
                          className={styles.btnPrimary}
                          onMouseEnter={() => prefetchAnimeDetalle(String(item.id))}
                        >
                          Ver Ficha
                        </Link>
                        <button className={styles.btnSecondary}>Seguir Actividad</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button className={`${styles.sliderArrow} ${styles.arrowLeft}`} onClick={prevSlide}>‹</button>
          <button className={`${styles.sliderArrow} ${styles.arrowRight}`} onClick={nextSlide}>›</button>
        </section>

        {/* BOTTOM SECTIONS */}
        <section className={styles.bottomGrid}>
          <div className={styles.mainGridContent}>
            
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>¡Popular esta semana!</h2>
              <div className={styles.tabs}>
                {(['hoy', 'semana', 'mes'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`${styles.tab} ${tabActivo === tab ? styles.tabActivo : ''}`}
                    onClick={() => setTabActivo(tab)}
                  >
                    {tab === 'hoy' ? 'Hoy' : tab === 'semana' ? 'Semana' : 'Mes'}
                  </button>
                ))}
              </div>
            </div>


            {/* Anime Grid */}
            {error && (
              <p className={styles.apiError}>⚠ {error}</p>
            )}
            <div className={styles.animeGrid}>
              {cargando
                ? Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className={`${styles.animeCard} ${styles.skeletonCard}`}>
                      <div className={styles.skeletonPoster} />
                      <div className={styles.cardInfo}>
                        <div className={styles.skeletonText} />
                        <div className={styles.skeletonTextSm} />
                      </div>
                    </div>
                  ))
                : animesMostrados.map(anime => (
                    <Link 
                      to={`/anime/${anime.externalId}`} 
                      state={{ initialAnime: anime }} 
                      key={anime.externalId} 
                      className={styles.animeCard}
                      onMouseEnter={() => prefetchAnimeDetalle(anime.externalId)}
                    >
                      <div className={styles.cardPoster}>
                        <img
                          src={anime.imagenUrl ?? '/hero-kimetsu.jpg'}
                          alt={anime.titulo}
                          className={styles.cardPosterImg}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className={styles.cardInfo}>
                        <p className={styles.cardName}>{anime.titulo}</p>
                        <div className={styles.cardRating}>
                          <Star className={styles.starYellow} size={13} fill="currentColor" />
                          <span className={styles.ratingText}>
                            {anime.calificacionPromedio ? Number(anime.calificacionPromedio).toFixed(1) : '—'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
              }
            </div>

            {/* Paginación */}
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPagina(Math.max(1, pagina - 1))}
                disabled={pagina === 1 || cargando}
              >‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`${styles.pageBtn} ${pagina === num ? styles.pageBtnActive : ''}`}
                  onClick={() => setPagina(num)}
                  disabled={cargando}
                >{num}</button>
              ))}
              <button
                className={styles.pageBtn}
                onClick={() => setPagina(pagina + 1)}
                disabled={cargando}
              >›</button>
            </div>

          </div>

          {/* TOP 10 RANKING — full list */}
          <aside className={styles.rankingsSidebar}>
            <h3 className={styles.sidebarTitle}>
              <Trophy className={styles.trophyIcon} size={16} fill="currentColor" /> Mejor Valorados
            </h3>
            <div className={styles.rankingList}>
              {POPULARES.map((anime, index) => (
                <div 
                  key={anime.id} 
                  className={styles.rankingItem}
                  onClick={() => navigate(`/anime/${anime.id}`)}
                >
                  <span className={`${styles.rankNumber} ${index < 3 ? styles.rankTop3 : ''}`}>{String(index + 1).padStart(2, '0')}</span>
                  <div className={styles.rankDetails}>
                    <p className={styles.rankName}>{anime.titulo}</p>
                    <p className={styles.rankGenre}>{anime.genero}</p>
                  </div>
                  <span className={styles.rankScore}>
                    <Star className={styles.starYellow} size={11} fill="currentColor" /> {anime.nota}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/ranking" className={styles.rankingViewMore} style={{ marginTop: 8 }}>Ver ranking completo</Link>
          </aside>
        </section>

        {/* RESEÑAS RECIENTES */}
        <section className={styles.resenasSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <MessageCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#ffc107' }} />
              Reseñas Recientes
            </h2>
            <Link to="/feed" className={styles.rankingViewMore}>Ver todas</Link>
          </div>
          <div className={styles.resenasGrid}>
            {cargandoResenas ? (
              <p style={{ color: 'var(--color-texto-muted)', fontSize: 'var(--text-sm)' }}>Cargando reseñas...</p>
            ) : resenasRecientes.length === 0 ? (
              <p style={{ color: 'var(--color-texto-muted)', fontSize: 'var(--text-sm)' }}>No hay reseñas aún.</p>
            ) : (
              resenasRecientes.slice(0, 6).map(r => (
                <article key={r.id} className={styles.resenaCard}>
                  <div className={styles.resenaHeader}>
                    <div className={styles.resenaAvatar}>
                      {r.usuario.avatarUrl ? <img src={r.usuario.avatarUrl} alt="" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : r.usuario.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.resenaUserInfo}>
                      <span className={styles.resenaUsuario}>{r.usuario.username}</span>
                      <span className={styles.resenaAnime}>{r.anime.titulo}</span>
                    </div>
                    <div className={styles.resenaStars}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const estrellas = Math.round(((r.calificacion ?? 0) / 10) * 5);
                        return <Star key={i} size={12} className={i < estrellas ? styles.starYellow : styles.starEmpty} fill={i < estrellas ? '#ffc107' : 'none'} />
                      })}
                    </div>
                  </div>
                  <p className={styles.resenaTexto}>{r.contenido}</p>
                  <span className={styles.resenaHace}>{getTimeAgo(r.creadoEn)}</span>
                </article>
              ))
            )}
          </div>
        </section>

        {/* NOTICIAS */}
        <NewsSection />
    </Layout>
  )
}
