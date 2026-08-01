import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, MessageSquare, Trophy, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import styles from './BottomNav.module.css'

export const BottomNav: React.FC = () => {
  const location = useLocation()
  const { usuario } = useAuth()
  
  const perfilPath = usuario?.username ? `/perfil/${usuario.username}` : (usuario ? '/perfil/editar' : '/auth')

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/', icon: <Home size={24} />, label: 'Inicio' },
    { path: '/descubrir', icon: <Compass size={24} />, label: 'Descubrir' },
    { path: '/feed', icon: <MessageSquare size={24} />, label: 'Feed' },
    { path: '/ranking', icon: <Trophy size={24} />, label: 'Ranking' },
    { path: perfilPath, icon: <User size={24} />, label: 'Perfil' }
  ]

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const active = isActive(item.path)
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`${styles.navItem} ${active ? styles.active : ''}`}
            title={item.label}
          >
            <div className={styles.iconContainer}>
              {item.icon}
            </div>
            <span className={styles.label}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
