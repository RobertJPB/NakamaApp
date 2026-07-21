import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Compass,
  MessageSquare,
  Trophy,
  User,
  Settings,
  BookMarked,
  LayoutGrid,
  Users,
  Dices,
  Kanban
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import styles from './Sidebar.module.css'

const FAST_LAUNCH = [
  { id: 1, titulo: 'Demon Slayer', ep: 'Ep 12/26', pct: 46, imagen: '/hero-kimetsu.jpg' },
  { id: 2, titulo: 'Jujutsu Kaisen', ep: 'Ep 22/24', pct: 91, imagen: 'https://static0.colliderimages.com/wordpress/wp-content/uploads/2023/10/jujutsu-kaisen-poster.jpg?q=50&fit=crop&w=1232&h=693&dpr=1.5' },
  { id: 3, titulo: 'One Piece', ep: 'Ep 950/1000', pct: 95, imagen: '/hero-onepiece.jpg' },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { usuario } = useAuth()
  
  const perfilPath = usuario?.username ? `/perfil/${usuario.username}` : (usuario ? '/perfil/editar' : '/auth')

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false
    return location.pathname.startsWith(path)
  }

  return (
    <aside className={styles.sidebar}>
      <Link to="/" className={styles.sidebarBrand} style={{ textDecoration: 'none' }}>
        <img src="/nakama-cat.png" alt="Nakama Logo" className={styles.logoIconImg} />
        <span className={styles.logoText}>Nakama</span>
      </Link>

      <nav className={styles.sidebarMenu}>
        <Link to="/" className={`${styles.menuLink} ${isActive('/') ? styles.menuLinkActive : ''}`}>
          <Home className={styles.menuIcon} size={18} /> Inicio
        </Link>
        <Link to="/feed" className={`${styles.menuLink} ${isActive('/feed') ? styles.menuLinkActive : ''}`}>
          <MessageSquare className={styles.menuIcon} size={18} /> Feed
        </Link>
        <Link to="/descubrir" className={`${styles.menuLink} ${isActive('/descubrir') ? styles.menuLinkActive : ''}`}>
          <Compass className={styles.menuIcon} size={18} /> Descubrir
        </Link>
        <Link to="/mi-lista" className={`${styles.menuLink} ${isActive('/mi-lista') ? styles.menuLinkActive : ''}`}>
          <Kanban className={styles.menuIcon} size={18} /> Mis Listas
        </Link>
        <Link to="/comunidad" className={`${styles.menuLink} ${isActive('/comunidad') ? styles.menuLinkActive : ''}`}>
          <Users className={styles.menuIcon} size={18} /> Comunidad
        </Link>
        <Link to="/ruleta" className={`${styles.menuLink} ${isActive('/ruleta') ? styles.menuLinkActive : ''}`}>
          <Dices className={styles.menuIcon} size={18} /> Ruleta
        </Link>
        <Link to="/ranking" className={`${styles.menuLink} ${isActive('/ranking') ? styles.menuLinkActive : ''}`}>
          <Trophy className={styles.menuIcon} size={18} /> Ranking
        </Link>

        <div className={styles.menuDivider} />

        <Link to={perfilPath} className={`${styles.menuLink} ${isActive('/perfil') ? styles.menuLinkActive : ''}`}>
          <User className={styles.menuIcon} size={18} /> Perfil
        </Link>
        <Link to="/configuracion" className={`${styles.menuLink} ${isActive('/configuracion') ? styles.menuLinkActive : ''}`}>
          <Settings className={styles.menuIcon} size={18} /> Configuración
        </Link>
      </nav>

      <div className={styles.fastLaunch}>
        <p className={styles.sidebarSectionTitle}>SEGUIMIENTO RÁPIDO</p>
        <div className={styles.fastLaunchList}>
          {FAST_LAUNCH.map((item) => (
            <div key={item.id} className={styles.fastLaunchItem}>
              <img src={item.imagen} alt={item.titulo} className={styles.fastLaunchThumb} />
              <div className={styles.fastLaunchInfo}>
                <p className={styles.fastLaunchName}>{item.titulo}</p>
                <p className={styles.fastLaunchEp}>{item.ep}</p>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFill} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
