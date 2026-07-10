import React from 'react'
import { AnimeCard } from './AnimeCard'
import styles from './AnimeGrid.module.css'

interface AnimeGridProps {
  animes:   any[]
  titulo?:  string
  cargando?: boolean
}

export const AnimeGrid: React.FC<AnimeGridProps> = ({ animes, titulo, cargando }) => (
  <section className={styles.seccion}>
    {titulo && <h2 className={styles.titulo}>{titulo}</h2>}
    {cargando ? (
      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    ) : (
      <div className={styles.grid}>
        {animes.map((anime) => (
          <AnimeCard key={anime.anilistId} {...anime} />
        ))}
      </div>
    )}
  </section>
)
