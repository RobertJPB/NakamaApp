import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Search, Sliders, Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/axios'
import styles from './Header.module.css'

export const Header: React.FC = () => {
  const { usuario, estaAutenticado, signOut } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [buscando, setBuscando] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (busqueda.trim().length < 3) {
      setResultados([])
      return
    }
    const timer = setTimeout(() => {
      setBuscando(true)
      api.get(`/api/animes?busqueda=${busqueda}&limit=5`)
        .then(res => setResultados(Array.isArray(res.data) ? res.data : (res.data.animes ?? [])))
        .catch(() => {})
        .finally(() => setBuscando(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResultados([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ya no navegamos a descubrir. Todo se maneja en el dropdown.
    if (e.key === 'Enter' && busqueda.trim()) {
      // Puedes forzar la búsqueda o simplemente no hacer nada y dejar que el dropdown haga su trabajo
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.searchBarWrapper} ref={dropdownRef}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Buscar animes..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button className={styles.filterBtn} onClick={() => navigate('/descubrir')}>
            <Sliders size={18} />
          </button>
        </div>
        
        {(resultados.length > 0 || buscando) && (
          <div className={styles.searchDropdown}>
            {buscando ? (
              <div className={styles.searchLoading}>Buscando...</div>
            ) : (
              resultados.map(anime => (
                <div 
                  key={anime.id || anime.anilistId} 
                  className={styles.searchResultItem}
                  onClick={() => {
                    setResultados([])
                    setBusqueda('')
                    navigate(`/anime/${anime.anilistId}`)
                  }}
                >
                  <img src={anime.imagenUrl} alt={anime.titulo} className={styles.searchResultImg} />
                  <div className={styles.searchResultInfo}>
                    <div className={styles.searchResultTitle}>{anime.titulo}</div>
                    <div className={styles.searchResultYear}>{anime.temporadaAnio || anime.estadoEmision}</div>
                  </div>
                </div>
              ))
            )}
            {!buscando && resultados.length > 0 && (
              <div 
                className={styles.searchVerTodos}
                onClick={() => {
                  setResultados([])
                  navigate(`/descubrir?q=${encodeURIComponent(busqueda.trim())}`)
                }}
              >
                Ver todos los resultados
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.headerRight}>
        <button className={styles.headerActionBtn} title="Notificaciones">
          <Bell size={18} />
          <span className={styles.badgeCount}>3</span>
        </button>
        
        {estaAutenticado ? (
          <div className={styles.profileWidgetContainer}>
            <Link to={usuario?.username || usuario?.user_metadata?.username ? `/perfil/${usuario?.username || usuario?.user_metadata?.username}` : "/perfil/editar"} className={styles.profileWidgetBtn}>
              <div className={styles.profileWidget}>
                <div className={`${styles.profileAvatar} ${!usuario?.avatarUrl ? styles.profileAvatarFallback : ''}`}>
                  {usuario?.avatarUrl
                    ? <img
                        src={usuario?.avatarUrl}
                        alt="avatar"
                        className={styles.avatarImg}
                      />
                    : (usuario?.nombreDisplay?.[0] || usuario?.user_metadata?.nombre?.[0] || usuario?.user_metadata?.full_name?.[0] || usuario?.user_metadata?.name?.[0] || usuario?.user_metadata?.username?.[0] || usuario?.user_metadata?.preferred_username?.[0] || 'U').toUpperCase()
                  }
                  {usuario?.user_metadata?.marco && (
                    <img src={usuario.user_metadata.marco} alt="" className={styles.marcoOverlayNav} />
                  )}
                </div>
                <div className={styles.profileMeta}>
                  <p className={styles.profileName}>
                    {usuario?.username ? `@${usuario.username}` : 'Mi perfil'}
                  </p>
                </div>
              </div>
            </Link>
            
            {/* Dropdown Menu */}
            <div className={styles.profileDropdown}>
              <Link to={usuario?.username || usuario?.user_metadata?.username ? `/perfil/${usuario?.username || usuario?.user_metadata?.username}` : "/perfil/editar"} className={styles.dropdownItem}>
                Ver perfil
              </Link>
              <Link to="/perfil/editar" className={styles.dropdownItem}>
                Configuración
              </Link>
              <div className={styles.dropdownDivider}></div>
              <button onClick={() => signOut()} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.authButtons}>
            <Link to="/auth" className={styles.btnLogin}>Entrar</Link>
            <Link to="/auth?register=true" className={styles.btnRegister}>Registrarse</Link>
          </div>
        )}
      </div>
    </header>
  )
}
