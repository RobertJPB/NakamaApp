import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, MessageSquare, User, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import styles from './BottomNav.module.css'

export const BottomNav: React.FC = () => {
  const location = useLocation()
  const { usuario } = useAuth()
  const [showMenu, setShowMenu] = React.useState(false)
  
  const perfilPath = usuario?.username ? `/perfil/${usuario.username}` : (usuario ? '/perfil/editar' : '/auth')

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false
    return location.pathname.startsWith(path)
  }

  // Cierra el menú al cambiar de ruta
  React.useEffect(() => {
    setShowMenu(false)
  }, [location.pathname])

  return (
    <nav className={styles.bottomNav}>
      {/* Inicio */}
      <Link to="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
        <div className={styles.iconWrap}>
          <Home size={22} strokeWidth={isActive('/') ? 2.5 : 1.8} />
        </div>
        <span className={styles.label}>Inicio</span>
      </Link>

      {/* Descubrir */}
      <Link to="/descubrir" className={`${styles.navItem} ${isActive('/descubrir') ? styles.active : ''}`}>
        <div className={styles.iconWrap}>
          <Compass size={22} strokeWidth={isActive('/descubrir') ? 2.5 : 1.8} />
        </div>
        <span className={styles.label}>Descubrir</span>
      </Link>

      {/* Feed */}
      <Link to="/feed" className={`${styles.navItem} ${isActive('/feed') ? styles.active : ''}`}>
        <div className={styles.iconWrap}>
          <MessageSquare size={22} strokeWidth={isActive('/feed') ? 2.5 : 1.8} />
        </div>
        <span className={styles.label}>Feed</span>
      </Link>



      {/* Perfil */}
      <Link to={perfilPath} className={`${styles.navItem} ${(isActive('/perfil') || isActive('/auth')) ? styles.active : ''}`}>
        <div className={styles.iconWrap}>
          {usuario?.avatarUrl ? (
            <img
              src={usuario.avatarUrl}
              alt="perfil"
              className={`${styles.avatarThumb} ${(isActive('/perfil') || isActive('/auth')) ? styles.avatarActive : ''}`}
            />
          ) : (
            <div className={`${styles.avatarFallback} ${(isActive('/perfil') || isActive('/auth')) ? styles.avatarActive : ''}`}>
              {(usuario?.nombreDisplay?.[0] || usuario?.username?.[0] || '?').toUpperCase()}
            </div>
          )}
        </div>
        <span className={styles.label}>Perfil</span>
      </Link>
    </nav>
  )
}
