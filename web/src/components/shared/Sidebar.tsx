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
  Library,
  Table2,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { RuletaIcon } from '../icons/RuletaIcon'
import { useAuth } from '../../hooks/useAuth'
import { api, getCached } from '../../lib/axios'
import styles from './Sidebar.module.css'

// Prefetch data when user hovers over a nav link
const prefetchMap: Record<string, string[]> = {
  '/':          ['/api/animes/populares'],
  '/descubrir': ['/api/animes/populares', '/api/animes/populares?genero=Action', '/api/animes/populares?genero=Romance'],
  '/ranking':   ['/api/animes/populares'],
  '/feed':      ['/api/feed'],
}

function prefetch(path: string) {
  const urls = prefetchMap[path]
  if (!urls) return
  urls.forEach(url => {
    if (!getCached(url)) {
      api.get(url).catch(() => {}) // silent prefetch
    }
  })
}

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
    <aside className={`${styles.sidebar} ${styles.sidebarCollapsed}`}>
      <Link to="/" className={styles.sidebarBrand} style={{ textDecoration: 'none' }}>
        <img src="/nakama-cat.png" alt="Nakama Logo" className={styles.logoIconImg} />
      </Link>

      <nav className={styles.sidebarMenu}>
        <Link to="/" onMouseEnter={() => prefetch('/')} className={`${styles.menuLink} ${isActive('/') ? styles.menuLinkActive : ''}`} title="Inicio">
          <Home className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/feed" onMouseEnter={() => prefetch('/feed')} className={`${styles.menuLink} ${isActive('/feed') ? styles.menuLinkActive : ''}`} title="Feed">
          <MessageSquare className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/descubrir" onMouseEnter={() => prefetch('/descubrir')} className={`${styles.menuLink} ${isActive('/descubrir') ? styles.menuLinkActive : ''}`} title="Descubrir">
          <Compass className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/mi-lista" className={`${styles.menuLink} ${isActive('/mi-lista') ? styles.menuLinkActive : ''}`} title="Mis Listas">
          <Library className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/comunidades" className={`${styles.menuLink} ${isActive('/comunidades') ? styles.menuLinkActive : ''}`} title="Comunidad">
          <Users className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/ruleta" className={`${styles.menuLink} ${isActive('/ruleta') ? styles.menuLinkActive : ''}`} title="Ruleta">
          <RuletaIcon className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/tierlist" className={`${styles.menuLink} ${isActive('/tierlist') ? styles.menuLinkActive : ''}`} title="Tier Lists">
          <Table2 className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/ranking" onMouseEnter={() => prefetch('/ranking')} className={`${styles.menuLink} ${isActive('/ranking') ? styles.menuLinkActive : ''}`} title="Ranking">
          <Trophy className={styles.menuIcon} size={18} />
        </Link>

        <div className={styles.menuDivider} />

        <Link to={perfilPath} className={`${styles.menuLink} ${isActive('/perfil') ? styles.menuLinkActive : ''}`} title="Perfil">
          <User className={styles.menuIcon} size={18} />
        </Link>
        <Link to="/configuracion" className={`${styles.menuLink} ${isActive('/configuracion') ? styles.menuLinkActive : ''}`} title="Configuración">
          <Settings className={styles.menuIcon} size={18} />
        </Link>
      </nav>


    </aside>
  )
}
