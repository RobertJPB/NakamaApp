import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { api } from '../../../lib/axios'
import { FollowListModal } from '../../perfil/components/FollowListModal'
import styles from './SuggestedUsers.module.css'

interface SuggestedUsersProps {
  forceLoading?: boolean
}

export const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ forceLoading }) => {
  const [sugeridos, setSugeridos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const { estaAutenticado, usuario } = useAuth()
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [siguiendo, setSiguiendo] = useState<Record<string, boolean>>({})

  const fetchSugeridos = async (signal?: AbortSignal) => {
    try {
      const { data } = await api.get('/api/usuarios/sugeridos', { signal, timeout: 8000 })
      let users = Array.isArray(data) ? data : []
      // Petición del usuario: ocultar a Maria Teresa y olasbb de las sugerencias
      users = users.filter((u: any) => {
        const username = u.username?.toLowerCase() || ''
        const nombreDisplay = u.nombreDisplay?.toLowerCase() || ''
        return !username.includes('maria teresa') && !nombreDisplay.includes('maria teresa') &&
               !username.includes('olasbb') && !nombreDisplay.includes('olasbb')
      })
      setSugeridos(users)
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return
      console.error('Error fetching suggested users:', error)
      setSugeridos([])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchSugeridos(controller.signal)
    return () => controller.abort()
  }, [estaAutenticado])

  const handleFollow = async (userId: string) => {
    if (!estaAutenticado) return
    
    // Optistic UI update
    const isCurrentlyFollowing = siguiendo[userId]
    setSiguiendo(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }))

    try {
      await api.post(`/api/usuarios/${userId}/seguir`)
    } catch (error) {
      // Revert if error
      setSiguiendo(prev => ({ ...prev, [userId]: isCurrentlyFollowing }))
    }
  }

  if (cargando || forceLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div style={{ height: 20, width: 120, background: 'var(--color-surface-2)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.userRow}>
              <div className={styles.avatarContainer} style={{ background: 'var(--color-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div className={styles.userInfo}>
                <div style={{ height: 16, width: 80, background: 'var(--color-surface-2)', borderRadius: 4, marginBottom: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 12, width: 120, background: 'var(--color-surface-2)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (sugeridos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>Sugerencias para ti</span>
        </div>
        <div className={styles.list} style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-texto-muted)', fontSize: '13px' }}>
          No hay más usuarios por descubrir.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Sugerencias para ti</span>
        <button className={styles.seeAll} onClick={() => setModalAbierto(true)}>Ver todos</button>
      </div>

      <div className={styles.list}>
        {sugeridos.slice(0, 4).map((user, idx) => {
          const isFollowing = siguiendo[user.id]
          
          return (
            <div key={user.id} className={styles.userRow}>
              <Link to={`/perfil/${user.username}`} className={styles.avatarContainer}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className={styles.avatarImg} />
                ) : (
                  <span>{user.username[0].toUpperCase()}</span>
                )}
              </Link>
              
              <div className={styles.userInfo}>
                <Link to={`/perfil/${user.username}`} className={styles.userName}>
                  {user.nombreDisplay || user.username}
                </Link>
              </div>

              {estaAutenticado && (
                <button 
                  className={`${styles.btnFollow} ${isFollowing ? styles.btnFollowed : ''}`}
                  onClick={() => handleFollow(user.id)}
                >
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <FollowListModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        usuarioId={usuario?.id || ''}
        tipo="sugeridos"
        titulo="Sugerencias para ti"
      />
    </div>
  )
}
