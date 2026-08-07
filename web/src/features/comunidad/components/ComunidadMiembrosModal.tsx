import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { X, Crown, ShieldAlert, UserMinus } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import styles from './ComunidadMiembrosModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  miembros: any[]
  miRol: 'admin' | 'moderador' | 'miembro' | null
  onExpulsar: (usuarioId: string) => void
  onCambiarRol: (usuarioId: string, rol: string) => void
}

export const ComunidadMiembrosModal: React.FC<Props> = ({ 
  isOpen, onClose, miembros, miRol, onExpulsar, onCambiarRol 
}) => {
  const { usuario } = useAuth()

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Miembros de la Comunidad</h2>
          <button className={styles.btnClose} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.content}>
          {miembros.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--color-texto-muted)' }}>
              No hay miembros que mostrar.
            </p>
          )}

          {miembros.map(m => {
            const u = m.usuario
            const isMe = u.id === usuario?.id
            
            // Permisos
            const canKick = !isMe && (miRol === 'admin' || (miRol === 'moderador' && m.rol === 'miembro'))
            const canMod = !isMe && miRol === 'admin'

            return (
              <div key={u.id} className={styles.miembroRow}>
                <Link to={`/perfil/${u.username}`} className={styles.avatarContainer} onClick={onClose}>
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.username} className={styles.avatarImg} />
                  ) : (
                    <span>{u.username[0].toUpperCase()}</span>
                  )}
                </Link>
                
                <div className={styles.userInfo}>
                  <Link to={`/perfil/${u.username}`} className={styles.userName} onClick={onClose}>
                    {u.nombreDisplay || u.username}
                  </Link>
                  <span className={`${styles.roleBadge} ${styles['role_' + m.rol]}`}>
                    {m.rol}
                  </span>
                </div>

                <div className={styles.actions}>
                  {canMod && m.rol === 'miembro' && (
                    <button 
                      className={styles.btnAction} 
                      onClick={() => onCambiarRol(u.id, 'moderador')}
                      title="Nombrar Moderador"
                    >
                      <Crown size={16} />
                    </button>
                  )}
                  {canMod && m.rol === 'moderador' && (
                    <button 
                      className={styles.btnAction} 
                      onClick={() => onCambiarRol(u.id, 'miembro')}
                      title="Quitar Moderador"
                    >
                      <ShieldAlert size={16} />
                    </button>
                  )}
                  {canKick && (
                    <button 
                      className={`${styles.btnAction} ${styles.btnDanger}`} 
                      onClick={() => onExpulsar(u.id)}
                      title="Expulsar"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
