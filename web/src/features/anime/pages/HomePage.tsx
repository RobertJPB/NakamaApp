import React, { useState, useEffect } from 'react'
import { Star, Trophy, MessageCircle } from 'lucide-react'
import { Layout } from '../../../components/shared/Layout'
import { NewsSection } from '../../feed/components/NewsSection'
import { FeaturedCarousel } from '../../anime/components/FeaturedCarousel'
import styles from './HomePage.module.css'
import { useAnimes } from '../../../hooks/useAnimes'
import { prefetchAnimeDetalle, usePrefetchAnimeDetalleOnView } from '../../../hooks/useAnime'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../../lib/axios'
import { tipoAnimeLabel } from '../../../lib/animeLabels'

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

export const HomePage: React.FC = () => {
  const [tabActivo, setTabActivo] = useState<'hoy' | 'semana' | 'mes'>('hoy')
  const { animes, cargando, error, pagina, setPagina, totalPaginas } = useAnimes()
  const navigate = useNavigate()
  const refForCard = usePrefetchAnimeDetalleOnView(12)
  
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
  const [topRanking, setTopRanking] = useState<any[]>([])
  const [cargandoRanking, setCargandoRanking] = useState(true)

  useEffect(() => {
    api.get('/api/ranking', { params: { limit: 10 } })
      .then(res => setTopRanking(res.data))
      .catch(err => console.error('Error al cargar ranking:', err))
      .finally(() => setCargandoRanking(false))

    api.get('/api/resenas/recientes')
      .then(res => setResenasRecientes(res.data))
      .catch(err => console.error('Error al cargar reseñas recientes:', err))
      .finally(() => setCargandoResenas(false))
  }, [])

  return (
    <Layout>

      {/* 3D CAROUSEL BANNERS */}
      <FeaturedCarousel />
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
                : (window.innerWidth <= 768 ? animesMostrados.slice(0, 10) : animesMostrados).map(anime => (
                    <Link 
                      to={`/anime/${anime.externalId}`} 
                      state={{ initialAnime: anime }} 
                      key={anime.externalId} 
                      className={styles.animeCard}
                      ref={refForCard}
                      data-external-id={anime.externalId}
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
              {cargandoRanking ? (
                <p style={{ color: 'var(--color-texto-muted)', fontSize: 'var(--text-sm)', padding: '16px 0', textAlign: 'center' }}>Cargando ranking...</p>
              ) : topRanking.map((anime, index) => (
                <div 
                  key={anime.externalId} 
                  className={styles.rankingItem}
                  onClick={() => navigate(`/anime/${anime.externalId}`)}
                  onMouseEnter={() => prefetchAnimeDetalle(String(anime.externalId))}
                >
                  <span className={`${styles.rankNumber} ${index < 3 ? styles.rankTop3 : ''}`}>{String(index + 1).padStart(2, '0')}</span>
                  <div className={styles.rankDetails}>
                    <p className={styles.rankName}>{anime.titulo}</p>
                    <p className={styles.rankGenre}>{[tipoAnimeLabel(anime.tipo), anime.anio].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={styles.rankScore}>
                    <Star className={styles.starYellow} size={11} fill="currentColor" /> {Number(anime.calificacionPromedio).toFixed(1)}
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
                    <Link to={`/perfil/${r.usuario.username}`} className={styles.resenaAvatar} style={{ textDecoration: 'none' }}>
                      {r.usuario.avatarUrl ? <img src={r.usuario.avatarUrl} alt="" loading="lazy" decoding="async" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : r.usuario.username.charAt(0).toUpperCase()}
                    </Link>
                    <div className={styles.resenaUserInfo}>
                      <Link to={`/perfil/${r.usuario.username}`} className={styles.resenaUsuario} style={{ textDecoration: 'none' }}>{r.usuario.username}</Link>
                      <Link to={`/anime/${r.anime.externalId}`} className={styles.resenaAnime} style={{ textDecoration: 'none' }}>{r.anime.titulo}</Link>
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
