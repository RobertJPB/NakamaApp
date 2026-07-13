import React from 'react'
import styles from './PersonajeCard.module.css'

interface PersonajeCardProps { personaje: any }

export const PersonajeCard: React.FC<PersonajeCardProps> = ({ personaje }) => (
  <div className={styles.card}>
    <div className={styles.imagen}>
      {personaje.image?.large
        ? <img src={personaje.image.large} alt={personaje.name?.full} />
        : <div className={styles.placeholder}>{personaje.name?.full?.[0]}</div>
      }
      {personaje.rol === 'MAIN' && <span className={styles.rolBadge}>Principal</span>}
    </div>
    <div className={styles.info}>
      <p className={styles.nombre}>{personaje.name?.full}</p>
      {personaje.name?.native && <p className={styles.nativo}>{personaje.name.native}</p>}
    </div>
  </div>
)
