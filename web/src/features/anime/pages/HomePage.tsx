import React, { useState } from 'react'
import { 
  Home, 
  Compass, 
  MessageSquare, 
  Heart, 
  Bell, 
  Calendar, 
  Tv, 
  Star, 
  Trophy, 
  Search, 
  Sliders,
  BookMarked,
  Users,
  Shuffle,
  Settings,
  MessageCircle,
  BarChart2
} from 'lucide-react'
import { Layout } from '../../../components/shared/Layout'
import { NewsSection } from '../../feed/components/NewsSection'
import styles from './HomePage.module.css'
import { useAuth } from '../../../hooks/useAuth'
import { useAnimes } from '../../../hooks/useAnimes'

/* ─── Animes destacados (hero rotativo - 3D Stack) ─────────────────────────── */
const FEATURED = [
  {
    id: 101922,
    badge: 'Anime destacado',
    titulo: 'Kimetsu no Yaiba',
    subtitulo: 'Demon Slayer: Kimetsu no Yaiba',
    descripcion:
      'En el Japón de la era Taisho, Tanjiro Kamado se convierte en cazador de demonios para salvar a su hermana Nezuko, convertida en demonio tras el ataque que destruyó a su familia.',
    anio: '2019',
    episodios: '26 eps',
    genero: 'Acción · Sobrenatural',
    puntuacion: '9.0',
    imagen: '/hero-kimetsu.jpg',
    color: 'rgba(160, 28, 28, 0.4)',
    slug: 'kimetsu-no-yaiba',
  },
  {
    id: 113415,
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
    id: 21,
    badge: 'Clásico',
    titulo: 'One Piece',
    subtitulo: 'One Piece',
    descripcion:
      'Monkey D. Luffy lidera a los Sombreros de Paja en busca del One Piece, el legendario tesoro que convertirá a su portador en el Rey de los Piratas.',
    anio: '1999',
    episodios: '1000+ eps',
    genero: 'Aventura · Comedia',
    puntuacion: '8.7',
    imagen: '/hero-onepiece.jpg',
    color: 'rgba(160, 100, 18, 0.4)',
    slug: 'one-piece',
  },
]

/* ─── Pinned / Fast Launch (Seguimiento Rápido en Sidebar) ──────────────── */
const FAST_LAUNCH = [
  { id: 1, titulo: 'Demon Slayer', ep: 'Ep 12/26', pct: 46, imagen: '/hero-kimetsu.jpg' },
  { id: 2, titulo: 'Jujutsu Kaisen', ep: 'Ep 22/24', pct: 91, imagen: 'https://static0.colliderimages.com/wordpress/wp-content/uploads/2023/10/jujutsu-kaisen-poster.jpg?q=50&fit=crop&w=1232&h=693&dpr=1.5' },
  { id: 3, titulo: 'One Piece', ep: 'Ep 950/1000', pct: 95, imagen: '/hero-onepiece.jpg' },
]



/* ─── Populares (top 10) ────────────────────────────────────────── */
const POPULARES = [
  { id: 1,  titulo: 'Fullmetal Alchemist: Brotherhood', genero: 'Acción · Aventura',    nota: '9.2' },
  { id: 2,  titulo: 'Steins;Gate',                      genero: 'Sci-Fi · Thriller',     nota: '9.1' },
  { id: 3,  titulo: 'Frieren',                          genero: 'Fantasía · Drama',      nota: '9.1' },
  { id: 4,  titulo: 'Kimetsu no Yaiba',                 genero: 'Acción · Sobrenatural', nota: '9.0' },
  { id: 5,  titulo: 'Attack on Titan',                  genero: 'Acción · Drama',        nota: '9.0' },
  { id: 6,  titulo: 'Hunter x Hunter (2011)',            genero: 'Aventura · Fantasía',   nota: '8.9' },
  { id: 7,  titulo: 'Jujutsu Kaisen 2',                 genero: 'Acción · Oscuro',       nota: '8.9' },
  { id: 8,  titulo: 'Violet Evergarden',                genero: 'Drama · Slice of Life', nota: '8.8' },
  { id: 9,  titulo: 'Vinland Saga',                     genero: 'Acción · Historia',     nota: '8.8' },
  { id: 10, titulo: 'Made in Abyss',                    genero: 'Aventura · Oscuro',     nota: '8.7' },
]

/* ─── Reseñas recientes ─────────────────────────────────────────── */
const RESENAS_RECIENTES = [
  { id: 1, usuario: 'xX_Guts_Xx',  avatar: 'G', anime: 'Frieren',           nota: 5, texto: 'bro pensé que me iba a aburrir porque es puro diálogo pero terminé llorando a las 3 am 😭 10/10', hace: 'hace 2h' },
  { id: 2, usuario: 'SatoruFan99', avatar: 'S', anime: 'Jujutsu Kaisen 2',  nota: 4, texto: 'uf la animacion en el capitulo de sukuna vs mahoraga es una locura, mappa carreado a la industria de nuevo', hace: 'hace 5h' },
  { id: 3, usuario: 'kiritokun',   avatar: 'K', anime: 'Sword Art Online',  nota: 3, texto: 'el primer arco goood, despues se vuelve un zzz zzz la verdad, solo lo veo por la nostalgia', hace: 'hace 1d' },
  { id: 4, usuario: 'AnyaPeanuts', avatar: 'A', anime: 'Spy x Family',      nota: 5, texto: 'Anya es literalmente yo jajajaja que anime más wholesome por dios, necesito 5 temporadas más', hace: 'hace 1d' },
  { id: 5, usuario: 'eren_tatakae',avatar: 'E', anime: 'Attack on Titan',   nota: 5, texto: 'simplemente peak fiction. dejen de pelear por el final y disfruten el tremendo viaje q nos dio isayama', hace: 'hace 2d' },
  { id: 6, usuario: 'ChainsawBro', avatar: 'C', anime: 'Chainsaw Man',      nota: 4, texto: 'muy buena adaptacion pero sigo esperando q animen el arco de bomb girl plsss', hace: 'hace 2d' },
]

export const HomePage: React.FC = () => {
  const [featuredIdx,  setFeaturedIdx]  = useState(0)
  const [tabActivo,    setTabActivo]    = useState<'hoy' | 'semana' | 'mes'>('hoy')
  const { usuario, estaAutenticado, signOut } = useAuth()
  const { animes, cargando, error, pagina, setPagina, totalPaginas } = useAnimes()

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
                        <a href={`/anime/${item.id}`} className={styles.btnPrimary}>Ver Ficha</a>
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
                : animes.slice(0, Math.floor(animes.length / 6) * 6).map(anime => (
                    <a href={`/anime/${anime.anilistId}`} key={anime.anilistId} className={styles.animeCard}>
                      <div className={styles.cardPoster}>
                        <img
                          src={anime.imagenUrl ?? '/hero-kimetsu.jpg'}
                          alt={anime.titulo}
                          className={styles.cardPosterImg}
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
                    </a>
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
              <Trophy className={styles.trophyIcon} size={16} /> Mejor Valorados
            </h3>
            <div className={styles.rankingList}>
              {POPULARES.map((anime, index) => (
                <div key={anime.id} className={styles.rankingItem}>
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
            <a href="/ranking" className={styles.rankingViewMore} style={{ marginTop: 8 }}>Ver ranking completo</a>
          </aside>
        </section>

        {/* RESEÑAS RECIENTES */}
        <section className={styles.resenasSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <MessageCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#ffc107' }} />
              Reseñas Recientes
            </h2>
            <a href="/feed" className={styles.rankingViewMore}>Ver todas</a>
          </div>
          <div className={styles.resenasGrid}>
            {RESENAS_RECIENTES.map(r => (
              <article key={r.id} className={styles.resenaCard}>
                <div className={styles.resenaHeader}>
                  <div className={styles.resenaAvatar}>{r.avatar}</div>
                  <div className={styles.resenaUserInfo}>
                    <span className={styles.resenaUsuario}>{r.usuario}</span>
                    <span className={styles.resenaAnime}>{r.anime}</span>
                  </div>
                  <div className={styles.resenaStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < r.nota ? styles.starYellow : styles.starEmpty} fill={i < r.nota ? '#ffc107' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className={styles.resenaTexto}>{r.texto}</p>
                <span className={styles.resenaHace}>{r.hace}</span>
              </article>
            ))}
          </div>
        </section>

        {/* NOTICIAS */}
        <section className={styles.resenasSection}>
          <NewsSection />
        </section>
    </Layout>
  )
}
