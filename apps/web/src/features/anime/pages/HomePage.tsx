import React, { useState, useEffect } from 'react'
import { Navbar } from '../../../components/shared/Navbar'
import styles from './HomePage.module.css'

/* ─── Animes destacados (hero rotativo) ─────────────────────────── */
const FEATURED = [
  {
    id: 1,
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
    color: 'rgba(160, 28, 28, 0.3)',
    slug: 'kimetsu-no-yaiba',
  },
  {
    id: 2,
    badge: 'Muy valorado',
    titulo: 'Jujutsu Kaisen',
    subtitulo: 'Jujutsu Kaisen',
    descripcion:
      'Yuji Itadori ingresa al mundo de los hechiceros al tragarse un dedo de Ryomen Sukuna, el rey de las maldiciones, para proteger a sus amigos de seres sobrenaturales.',
    anio: '2020',
    episodios: '24 eps',
    genero: 'Acción · Oscuro',
    puntuacion: '8.8',
    imagen: '/hero-jujutsu.jpg',
    color: 'rgba(18, 70, 160, 0.3)',
    slug: 'jujutsu-kaisen',
  },
  {
    id: 3,
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
    color: 'rgba(160, 100, 18, 0.3)',
    slug: 'one-piece',
  },
]

/* ─── Reseñas recientes (sidebar del hero) ──────────────────────── */
const RESENAS_RECIENTES = [
  { usuario: 'marta.gz',     anime: 'Vinland Saga',     stars: 5, texto: 'me dejó sin palabras el final del arco de Askeladd, no esperaba eso' },
  { usuario: 'diego_rv',     anime: 'Steins;Gate',       stars: 5, texto: 'la vi 3 veces y sigo llorando igual, es demasiado buena' },
  { usuario: 'pablodev',     anime: 'FMA Brotherhood',   stars: 5, texto: 'Ed y Al merecen el mundo entero bro' },
  { usuario: 'caro.m',       anime: 'Spy x Family',      stars: 4, texto: 'anya es lo mejor que le pasó al anime este año' },
]

/* ─── Grid de animes (sección principal) ────────────────────────── */
const GRID_ANIMES = [
  { id: 1, titulo: 'Demon Slayer',        anio: 2019, eps: 26,  nota: '9.0', imagen: '/hero-kimetsu.jpg' },
  { id: 2, titulo: 'Jujutsu Kaisen',      anio: 2020, eps: 24,  nota: '8.8', imagen: '/hero-jujutsu.jpg' },
  { id: 3, titulo: 'One Piece',           anio: 1999, eps: 1000,nota: '8.7', imagen: '/hero-onepiece.jpg' },
  { id: 4, titulo: 'Attack on Titan',     anio: 2013, eps: 87,  nota: '9.0', imagen: '/hero-anime.jpg' },
  { id: 5, titulo: 'Jujutsu Kaisen 2',    anio: 2023, eps: 23,  nota: '8.9', imagen: '/hero-jujutsu.jpg' },
  { id: 6, titulo: 'Demon Slayer S2',     anio: 2021, eps: 18,  nota: '8.7', imagen: '/hero-kimetsu.jpg' },
  { id: 7, titulo: 'One Piece Wano',      anio: 2019, eps: 190, nota: '8.8', imagen: '/hero-onepiece.jpg' },
  { id: 8, titulo: 'Attack on Titan S4',  anio: 2020, eps: 28,  nota: '9.1', imagen: '/hero-anime.jpg' },
  { id: 9, titulo: 'Jujutsu Kaisen Movie',anio: 2021, eps: 1,   nota: '8.5', imagen: '/hero-jujutsu.jpg' },
  { id: 10,titulo: 'Demon Slayer Movie',  anio: 2020, eps: 1,   nota: '8.9', imagen: '/hero-kimetsu.jpg' },
]

/* ─── Populares (ranking lateral) ───────────────────────────────── */
const POPULARES = [
  { id: 1, titulo: 'Fullmetal Alchemist: Brotherhood', genero: 'Acción · Aventura',    nota: '9.2' },
  { id: 2, titulo: 'Steins;Gate',                      genero: 'Sci-Fi · Thriller',     nota: '9.1' },
  { id: 3, titulo: 'Kimetsu no Yaiba',                 genero: 'Acción · Sobrenatural', nota: '9.0' },
  { id: 4, titulo: 'Hunter x Hunter (2011)',            genero: 'Aventura · Fantasía',   nota: '8.9' },
  { id: 5, titulo: 'Frieren',                          genero: 'Fantasía · Drama',      nota: '9.1' },
]

/* ─── Helpers ────────────────────────────────────────────────────── */
const Estrellas: React.FC<{ n: number }> = ({ n }) => (
  <span className={styles.estrellas}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
)

export const HomePage: React.FC = () => {
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const [animando,    setAnimando]    = useState(false)
  const [tabActivo,   setTabActivo]   = useState<'hoy' | 'semana' | 'mes'>('hoy')
  const featured = FEATURED[featuredIdx]

  useEffect(() => {
    const t = setInterval(() => irA((featuredIdx + 1) % FEATURED.length), 7000)
    return () => clearInterval(t)
  }, [featuredIdx])

  const irA = (idx: number) => {
    setAnimando(true)
    setTimeout(() => { setFeaturedIdx(idx); setAnimando(false) }, 280)
  }

  return (
    <div className={styles.home}>
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO — imagen de fondo + info del anime
          ══════════════════════════════════════════ */}
      <section className={styles.hero}>
        <div
          className={`${styles.heroBg} ${animando ? styles.heroBgFade : ''}`}
          style={{ backgroundImage: `url(${featured.imagen})` }}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroOverlayColor} style={{ background: featured.color }} />

        <div className={styles.heroContent}>

          {/* ── Texto izquierda ── */}
          <div className={`${styles.heroTexto} ${animando ? styles.heroFade : ''}`}>

            <h1 className={styles.heroTitulo}>{featured.titulo}</h1>
            <p className={styles.heroSubtitulo}>{featured.subtitulo}</p>

            <div className={styles.heroMeta}>
              <span>{featured.anio}</span>
              <span className={styles.heroPunto}>·</span>
              <span>{featured.episodios}</span>
              <span className={styles.heroPunto}>·</span>
              <span>{featured.genero}</span>
            </div>

            <div className={styles.heroPuntuacion}>
              <Estrellas n={Math.round(parseFloat(featured.puntuacion) / 2)} />
              <span className={styles.heroPuntuacionNum}>{featured.puntuacion} / 10</span>
            </div>

            <p className={styles.heroDescripcion}>{featured.descripcion}</p>

            <div className={styles.heroAcciones}>
              <a href={`/descubrir`} className={styles.heroBtnPrimary}>
                Ver ficha completa
              </a>
              <a href="/auth" className={styles.heroBtnSecondary}>
                Añadir a mi lista
              </a>
            </div>
          </div>

          {/* ── Sidebar derecha — Reseñas recientes ── */}
          <aside className={styles.heroLista}>
            <p className={styles.heroListaTitulo}>Reseñas recientes</p>
            {RESENAS_RECIENTES.map((r, i) => (
              <div key={i} className={styles.resenaItem}>
                <div className={styles.resenaAvatar}>
                  {r.usuario[0].toUpperCase()}
                </div>
                <div className={styles.resenaInfo}>
                  <p className={styles.resenaUsuario}>{r.usuario}</p>
                  <p className={styles.resenaAnime}>{r.anime}</p>
                  <Estrellas n={r.stars} />
                  <p className={styles.resenaTexto}>"{r.texto}"</p>
                </div>
              </div>
            ))}
            <a href="/auth" className={styles.heroListaVerTodo}>
              Ver toda la actividad →
            </a>
          </aside>
        </div>

        {/* Dots + flechas */}
        <div className={styles.heroDots}>
          {FEATURED.map((_, i) => (
            <button key={i} className={`${styles.heroDot} ${i === featuredIdx ? styles.heroDotActivo : ''}`} onClick={() => irA(i)} />
          ))}
        </div>
        <button className={`${styles.heroArrow} ${styles.heroArrowLeft}`}  onClick={() => irA((featuredIdx - 1 + FEATURED.length) % FEATURED.length)}>‹</button>
        <button className={`${styles.heroArrow} ${styles.heroArrowRight}`} onClick={() => irA((featuredIdx + 1) % FEATURED.length)}>›</button>
      </section>

      {/* ══════════════════════════════════════════
          GRID — Descubre nuevos animes
          ══════════════════════════════════════════ */}
      <section className={styles.seccion}>
        <div className={styles.seccionInner}>

          <div className={styles.seccionHeader}>
            <h2 className={styles.seccionTitulo}>Lo que la comunidad está viendo</h2>
            <div className={styles.tabs}>
              {(['hoy', 'semana', 'mes'] as const).map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${tabActivo === tab ? styles.tabActivo : ''}`}
                  onClick={() => setTabActivo(tab)}
                >
                  {tab === 'hoy' ? 'Hoy' : tab === 'semana' ? 'Esta semana' : 'Este mes'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de animes — 2 columnas: cards + sidebar ranking */}
          <div className={styles.gridLayout}>

            {/* Cards de animes */}
            <div className={styles.animeGrid}>
              {GRID_ANIMES.map(anime => (
                <article
                  key={anime.id}
                  className={styles.animeCard}
                >
                  <div className={styles.cardPoster}>
                    <img src={anime.imagen} alt={anime.titulo} className={styles.cardPosterImg} />
                    <div className={styles.cardOverlay}>
                      <div className={styles.cardAcciones}>
                        <button className={styles.cardBtnLista}>+ Mi lista</button>
                        <a href="/descubrir" className={styles.cardBtnFicha}>Ver ficha</a>
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardTitulo}>{anime.titulo}</p>
                    <div className={styles.cardRating}>
                      <Estrellas n={Math.round(parseFloat(anime.nota) / 2)} />
                      <span className={styles.cardRatingScore}>{anime.nota}</span>
                    </div>
                    <p className={styles.cardMeta}>{anime.anio} · {anime.eps} eps</p>
                  </div>
                </article>
              ))}
            </div>

            {/* Sidebar ranking */}
            <aside className={styles.rankingSidebar}>
              <h3 className={styles.sidebarTitulo}>
                <span className={styles.acento}>♛</span> Mejor valorados
              </h3>
              <div className={styles.rankingLista}>
                {POPULARES.map(anime => (
                  <div key={anime.id} className={styles.rankingItem}>
                    <span className={styles.rankingNum}>{String(anime.id).padStart(2, '0')}</span>
                    <div className={styles.rankingInfo}>
                      <p className={styles.rankingTitulo}>{anime.titulo}</p>
                      <p className={styles.rankingGenero}>{anime.genero}</p>
                    </div>
                    <span className={styles.rankingScore}>★ {anime.nota}</span>
                  </div>
                ))}
                <a href="/ranking" className={styles.verTodo}>Ver ranking completo →</a>
              </div>
            </aside>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA — Únete a Nakama
          ══════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <img src="/nakama-cat.png" alt="Nakama" className={styles.ctaLogo} />
          <h2 className={styles.ctaTitulo}>Tu diario de anime</h2>
          <p className={styles.ctaDesc}>
            Lleva el registro de lo que ves, escribe reseñas, sigue a otros fans y descubre anime nuevo cada día.
          </p>
          <div className={styles.ctaAcciones}>
            <a href="/auth" className={styles.heroBtnPrimary}>Crear cuenta gratis</a>
            <a href="/descubrir" className={styles.heroBtnSecondary}>Explorar catálogo</a>
          </div>
        </div>
      </section>

    </div>
  )
}
