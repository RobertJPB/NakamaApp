import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { api } from '../../../lib/axios'
import { useAuth } from '../../../hooks/useAuth'
import styles from './FollowListModal.module.css'

interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  usuarioId: string
  tipo: 'seguidores' | 'siguiendo' | 'sugeridos'
  titulo: string
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, usuarioId, tipo, titulo }) => {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const { estaAutenticado, usuario: currentUser } = useAuth()
  const [siguiendoMap, setSiguiendoMap] = useState<Record<string, boolean>>({})

  // Fetch initial follows logic
  const loadInitialFollows = async (usersList: any[]) => {
    if (!estaAutenticado || !currentUser) return
    
    // Si estamos viendo "siguiendo" de nuestro propio perfil, los seguimos a todos por defecto
    if (tipo === 'siguiendo' && usuarioId === currentUser.id) {
      const newMap: Record<string, boolean> = {}
      usersList.forEach(u => newMap[u.id] = true)
      setSiguiendoMap(newMap)
      return
    }

    try {
      const { data } = await api.get(`/api/usuarios/${currentUser.id}/siguiendo`)
      const followedIds = new Set(data.usuarios.map((u: any) => u.id))
      const newMap: Record<string, boolean> = {}
      usersList.forEach(u => {
        newMap[u.id] = followedIds.has(u.id)
      })
      setSiguiendoMap(newMap)
    } catch (e) {}
  }

  useEffect(() => {
    if (!isOpen) return
    setCargando(true)
    const endpoint = tipo === 'sugeridos' ? '/api/usuarios/sugeridos?all=true' : `/api/usuarios/${usuarioId}/${tipo}`;
    api.get(endpoint)
      .then(({ data }) => {
        const list = data.usuarios || []
        setUsuarios(list)
        loadInitialFollows(list)
      })
      .catch(err => console.error(err))
      .finally(() => setCargando(false))
  }, [isOpen, usuarioId, tipo])

  if (!isOpen) return null

  const usuariosFiltrados = usuarios.filter(u => 
    u.username.toLowerCase().includes(busqueda.toLowerCase()) || 
    (u.nombreDisplay && u.nombreDisplay.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const handleFollow = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!estaAutenticado) return
    
    const isCurrentlyFollowing = siguiendoMap[targetId]
    setSiguiendoMap(prev => ({ ...prev, [targetId]: !isCurrentlyFollowing }))

    try {
      await api.post(`/api/usuarios/${targetId}/seguir`)
    } catch (error) {
      setSiguiendoMap(prev => ({ ...prev, [targetId]: isCurrentlyFollowing }))
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.titulo}>{titulo}</h2>
          <button className={styles.btnClose} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className={styles.lista}>
          {cargando ? (
            <div className={styles.cargando}>Cargando...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className={styles.vacio}>
              {usuarios.length === 0 ? "Aún no hay usuarios." : "No se encontraron usuarios."}
            </div>
          ) : (
            usuariosFiltrados.map(user => (
              <div key={user.id} className={styles.userRow}>
                <Link to={`/perfil/${user.username}`} className={styles.avatarWrap} onClick={onClose}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarFallback}>{user.username[0].toUpperCase()}</div>
                  )}
                </Link>
                <div className={styles.userInfo}>
                  <Link to={`/perfil/${user.username}`} className={styles.userName} onClick={onClose}>
                    {user.nombreDisplay || user.username}
                  </Link>
                  <span className={styles.userHandle}>@{user.username}</span>
                  {user.bio && <span className={styles.userBio}>{user.bio}</span>}
                </div>
                {currentUser?.id !== user.id && (
                  <button 
                    className={`${styles.followBtn} ${siguiendoMap[user.id] ? styles.following : ''}`}
                    onClick={(e) => handleFollow(user.id, e)}
                  >
                    {siguiendoMap[user.id] ? 'Siguiendo' : 'Seguir'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
