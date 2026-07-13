import React from 'react'
import styles from './ColeccionCard.module.css'

interface Props { coleccion: any; onClick?: () => void }

export const ColeccionCard: React.FC<Props> = ({ coleccion, onClick }) => (
  <article className={styles.card} onClick={onClick} role={onClick ? 'button' : undefined}>
    {/* Mosaico de portadas */}
    <div className={styles.mosaico}>
      {(coleccion.animes ?? []).slice(0, 4).map((ca: any, i: number) => (
        <div key={i} className={styles.mosaicoItem}>
          {ca.anime?.imagenUrl
            ? <img src={ca.anime.imagenUrl} alt="" />
            : <div className={styles.mosaicoVacio} />
          }
        </div>
      ))}
      {(coleccion.animes?.length ?? 0) === 0 && (
        <div className={styles.mosaicoPlaceholder}>📚</div>
      )}
      <div className={styles.mosaicoOverlay} />
      {coleccion.esEditorial && (
        <span className={styles.editorialBadge}>✦ Editorial</span>
      )}
    </div>

    {/* Info */}
    <div className={styles.info}>
      <h3 className={styles.titulo}>{coleccion.titulo}</h3>
      {coleccion.descripcion && (
        <p className={styles.desc}>{coleccion.descripcion}</p>
      )}
      <div className={styles.meta}>
        <span className={styles.total}>{coleccion.totalAnimes} animes</span>
        {coleccion.usuario && (
          <span className={styles.autor}>por @{coleccion.usuario.username}</span>
        )}
      </div>
    </div>
  </article>
)
