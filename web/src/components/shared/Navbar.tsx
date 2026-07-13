import React, { useState, useRef, useEffect } from 'react'
import { useAuth }    from '../../hooks/useAuth'
import { useBusqueda } from '../../hooks/useAnime'
import styles         from './Navbar.module.css'

export const Navbar: React.FC = () => {
  const { usuario, estaAutenticado, signOut } = useAuth()
  const [query,         setQuery]         = useState('')
  const [menuPerfil,    setMenuPerfil]    = useState(false)
  const [buscadorFocus, setBuscadorFocus] = useState(false)
  const [scrolled,      setScrolled]      = useState(false)
  const { resultados, cargando }          = useBusqueda(query)
  const refMenu     = useRef<HTMLDivElement>(null)
  const refBuscador = useRef<HTMLDivElement>(null)

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (refMenu.current     && !refMenu.current.contains(e.target as Node))     setMenuPerfil(false)
      if (refBuscador.current && !refBuscador.current.contains(e.target as Node)) setBuscadorFocus(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Detectar scroll para cambiar fondo
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const ruta = window.location.pathname

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : styles.navbarTransparente}`}>
      <div className={styles.inner}>

        {/* Logo */}
        <a href="/" className={styles.logo}>
          <img src="/nakama-cat.png" alt="Nakama" className={styles.logoIcon} />
          <span className={styles.logoText}>Nakama</span>
        </a>

        {/* Navegación */}
        <nav className={styles.nav}>
          {[
            { href: '/descubrir',   label: 'Descubrir'   },
            { href: '/ranking',     label: 'Ranking'     },
            { href: '/resenas',     label: 'Reseñas'     },
            { href: '/comunidades', label: 'Comunidades' },
            { href: '/colecciones', label: 'Colecciones' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={`${styles.navLink} ${ruta.startsWith(href) ? styles.navActivo : ''}`}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Buscador con dropdown */}
        <div className={styles.buscadorWrap} ref={refBuscador}>
          <input
            className={styles.buscador}
            type="text"
            placeholder="Buscar anime..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setBuscadorFocus(true)}
          />
          {query && <button className={styles.limpiar} onClick={() => setQuery('')}>✕</button>}

          {/* Dropdown resultados */}
          {buscadorFocus && query.trim() && (
            <div className={styles.buscadorDrop}>
              {cargando ? (
                <p className={styles.dropMsg}>Buscando...</p>
              ) : resultados.length === 0 ? (
                <p className={styles.dropMsg}>Sin resultados para "{query}"</p>
              ) : (
                resultados.slice(0, 6).map((anime: any) => (
                  <a
                    key={anime.anilistId}
                    href={`/anime/${anime.anilistId}`}
                    className={styles.dropItem}
                    onClick={() => { setQuery(''); setBuscadorFocus(false) }}
                  >
                    <img src={anime.imagenUrl} alt={anime.titulo} className={styles.dropImg} />
                    <div className={styles.dropInfo}>
                      <p className={styles.dropTitulo}>{anime.titulo}</p>
                      <p className={styles.dropMeta}>{[anime.tipo, anime.anio].filter(Boolean).join(' · ')}</p>
                    </div>
                  </a>
                ))
              )}
              <a href={`/descubrir?q=${encodeURIComponent(query)}`} className={styles.dropVerTodo}>
                Ver todos los resultados →
              </a>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className={styles.acciones}>
          {estaAutenticado ? (
            <>
              <a href="/feed" className={styles.btnIcono}>Feed</a>
              <a href="/mi-lista" className={styles.btnLista}>Mi Lista</a>

              {/* Menú de perfil */}
              <div className={styles.menuWrap} ref={refMenu}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setMenuPerfil(p => !p)}
                >
                  <div className={styles.avatarCircle}>
                    {usuario?.user_metadata?.nombre?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                </button>

                {menuPerfil && (
                  <div className={styles.menuDrop}>
                    <a href={`/perfil/${usuario?.user_metadata?.username}`} className={styles.menuItem}>
                      Mi perfil
                    </a>
                    <a href="/mi-lista"      className={styles.menuItem}>Mi biblioteca</a>
                    <a href="/configuracion" className={styles.menuItem}>Configuración</a>
                    <div className={styles.menuDiv} />
                    <button className={`${styles.menuItem} ${styles.menuSalir}`} onClick={signOut}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a href="/auth" className={styles.btnEntrar}>Entrar</a>
              <a href="/auth" className={styles.btnLista}>Registrarse</a>
            </>
          )}
        </div>

      </div>
    </header>
  )
}
