import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, MessageSquare, LayoutGrid, X, Users, Table2, Library } from 'lucide-react'
import { Trophy } from 'lucide-react'
import { RuletaIcon } from '../icons/RuletaIcon'
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

      {/* Feed — botón central destacado */}
      <Link to="/feed" className={`${styles.navItem} ${styles.navItemCenter} ${isActive('/feed') ? styles.active : ''}`}>
        <div className={styles.centerBtn}>
          <MessageSquare size={22} strokeWidth={2} />
        </div>
        <span className={styles.label}>Feed</span>
      </Link>

      {/* Botón Menú (Abre Bottom Sheet) */}
      <button 
        className={`${styles.navItem} ${styles.menuBtn} ${showMenu ? styles.active : ''}`}
        onClick={() => setShowMenu(true)}
      >
        <div className={styles.iconWrap}>
          <LayoutGrid size={22} strokeWidth={showMenu ? 2.5 : 1.8} />
        </div>
        <span className={styles.label}>Explorar</span>
      </button>

      {/* Perfil — muestra avatar si está logueado */}
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

      {/* Bottom Sheet Modal */}
      {showMenu && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowMenu(false)}>
          <div className={styles.bottomSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h3>Explorar Nakama</h3>
              <button className={styles.closeSheetBtn} onClick={() => setShowMenu(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.sheetGrid}>
              <Link to="/ranking" className={styles.sheetItem}>
                <div className={`${styles.sheetIcon} ${styles.bgGold}`}><Trophy size={20} /></div>
                <span>Ranking</span>
              </Link>
              <Link to="/comunidades" className={styles.sheetItem}>
                <div className={`${styles.sheetIcon} ${styles.bgBlue}`}><Users size={20} /></div>
                <span>Comunidades</span>
              </Link>
              <Link to="/ruleta" className={styles.sheetItem}>
                <div className={`${styles.sheetIcon} ${styles.bgPurple}`}><RuletaIcon size={20} /></div>
                <span>Ruleta</span>
              </Link>
              <Link to="/tierlist" className={styles.sheetItem}>
                <div className={`${styles.sheetIcon} ${styles.bgGreen}`}><Table2 size={20} /></div>
                <span>Tier Lists</span>
              </Link>
              <Link to="/mi-lista" className={styles.sheetItem}>
                <div className={`${styles.sheetIcon} ${styles.bgOrange}`}><Library size={20} /></div>
                <span>Mi Lista</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
