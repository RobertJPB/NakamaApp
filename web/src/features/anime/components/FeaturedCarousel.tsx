import React, { useState, useEffect, useRef } from 'react'
import { Calendar, Tv, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { prefetchAnimeDetalle } from '../../../hooks/useAnime'
import styles from '../pages/HomePage.module.css'

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
    imagen: 'https://media.kitsu.app/anime/41370/cover_image/7958f9c01b57c980636386d124553791.jpg',
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
    imagen: 'https://media.kitsu.app/anime/cover_images/42765/original.jpeg',
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
    imagen: 'https://media.kitsu.app/anime/12/cover_image/21ecb556255bd46b95aea4779d19789f.jpg',
    color: 'rgba(160, 100, 18, 0.4)',
    slug: 'one-piece',
  },
]

export const FeaturedCarousel: React.FC = () => {
  const [featuredIdx, setFeaturedIdx] = useState(0)

  // Pre-cargar TODOS los slides al montar para que el primer clic sea instantáneo
  useEffect(() => {
    FEATURED.forEach(item => prefetchAnimeDetalle(String(item.id)))
  }, [])

  // Pre-calentar también el siguiente slide cuando cambia la selección
  useEffect(() => {
    const nextIdx = (featuredIdx + 1) % FEATURED.length
    prefetchAnimeDetalle(String(FEATURED[nextIdx].id))
  }, [featuredIdx])

  // Auto-avance del carrusel cada 5 segundos (aislado: no re-renderiza la página)
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIdx((prev) => (prev + 1) % FEATURED.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const nextSlide = () => {
    setFeaturedIdx((prev) => (prev + 1) % FEATURED.length)
  }

  const prevSlide = () => {
    setFeaturedIdx((prev) => (prev - 1 + FEATURED.length) % FEATURED.length)
  }

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide()
    } else if (touchStartX.current - touchEndX.current < -50) {
      prevSlide()
    }
  }

  return (
    <section className={styles.carouselSection}>
      <div
        className={styles.carouselContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {FEATURED.map((item, idx) => {
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
                    <Link
                      to={`/anime/${item.id}`}
                      state={{ initialAnime: { externalId: item.id, titulo: item.titulo, imagenUrl: item.imagen, calificacionPromedio: Number(item.puntuacion), sinopsis: item.descripcion } }}
                      className={styles.btnSecondary}
                      onMouseEnter={() => prefetchAnimeDetalle(String(item.id))}
                    >
                      Añadir a Lista
                    </Link>
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
  )
}
