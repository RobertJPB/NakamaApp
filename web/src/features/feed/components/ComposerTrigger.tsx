import React from 'react'
import { useAuthStore } from '../../../store/authStore'
import styles from './ComposerTrigger.module.css'

interface ComposerTriggerProps {
  onClick: () => void
}

export const ComposerTrigger: React.FC<ComposerTriggerProps> = ({ onClick }) => {
  const usuario = useAuthStore(s => s.usuario)

  if (!usuario) return null

  return (
    <div className={styles.container} onClick={onClick}>
      <div className={styles.avatarWrap}>
        <div className={styles.avatar}>
          {usuario.avatarUrl || usuario.user_metadata?.avatar_url ? (
            <img src={usuario.avatarUrl || usuario.user_metadata?.avatar_url} alt="Avatar" />
          ) : (
            <span>{usuario.nombreDisplay?.charAt(0).toUpperCase() || usuario.username?.charAt(0).toUpperCase() || usuario.user_metadata?.username?.charAt(0).toUpperCase() || '?'}</span>
          )}
        </div>
        {usuario.marcoUrl && (
          <img src={usuario.marcoUrl} alt="Marco" className={styles.marcoOverlay} />
        )}
      </div>
      <div className={styles.inputBox}>
        <span>¿Tienes algo en mente?</span>
      </div>
    </div>
  )
}
