import React from 'react'
import styles from './AnimeCard.module.css'

interface AnimeCardProps {
  anilistId:   number
  titulo:      string
  imagenUrl:   string
  tipo?:       string
  anio?:       number
  calificacion?: number
  estado?:     string
  onClick?:    () => void
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  titulo, imagenUrl, tipo, anio, calificacion, estado, onClick
}) => (
  <article className={styles.card} onClick={onClick} role={onClick ? 'button' : undefined}>
    <div className={styles.poster}>
      <img src={imagenUrl} alt={titulo} loading="lazy" />
      {calificacion && (
        <span className={styles.badge}>
          ★ {calificacion.toFixed(1)}
        </span>
      )}
      {estado && <span className={styles.estado}>{estado}</span>}
      <div className={styles.overlay}>
        <span className={styles.verMas}>Ver detalle</span>
      </div>
    </div>
    <div className={styles.info}>
      <h3 className={styles.titulo}>{titulo}</h3>
      {(tipo || anio) && (
        <p className={styles.meta}>
          {[tipo, anio].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  </article>
)
