import React, { useEffect, useState } from 'react'
import { Layout }    from '../../../components/shared/Layout'
import { AnimeCard } from '../../../components/ui/AnimeCard'
import { api }       from '../../../lib/axios'
import styles        from './RankingPage.module.css'

type Tipo = 'global' | 'temporada'

export const RankingPage: React.FC = () => {
  const [animes,   setAnimes]   = useState<any[]>([])
  const [tipo,     setTipo]     = useState<Tipo>('global')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    const endpoint = tipo === 'temporada' ? '/api/ranking/temporada' : '/api/ranking'
    api.get(endpoint)
      .then(({ data }) => setAnimes(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [tipo])

  return (
    <Layout>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Ranking</h1>
            <p className={styles.subtitulo}>Los animes mejor calificados por la comunidad</p>
          </div>
          <div className={styles.toggles}>
            <button
              className={`${styles.toggle} ${tipo === 'global' ? styles.toggleActivo : ''}`}
              onClick={() => setTipo('global')}
            >
              Global
            </button>
            <button
              className={`${styles.toggle} ${tipo === 'temporada' ? styles.toggleActivo : ''}`}
              onClick={() => setTipo('temporada')}
            >
              En emisión
            </button>
          </div>
        </div>

        {cargando ? (
          <div className={styles.grid}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : (
          <div className={styles.lista}>
            {animes.map((anime: any, index: number) => (
              <div key={anime.id ?? anime.anilistId} className={styles.fila}>
                <span className={`${styles.posicion} ${index < 3 ? styles.top3 : ''}`}>
                  {index + 1}
                </span>
                <div className={styles.cardWrap}>
                  <AnimeCard
                    anilistId={anime.anilistId}
                    titulo={anime.titulo}
                    imagenUrl={anime.imagenUrl}
                    tipo={anime.tipo}
                    anio={anime.anio}
                    calificacion={Number(anime.calificacionPromedio)}
                  />
                </div>
                <div className={styles.filaDatos}>
                  <p className={styles.filaTitulo}>{anime.titulo}</p>
                  <p className={styles.filaMeta}>{[anime.tipo, anime.anio].filter(Boolean).join(' · ')}</p>
                  <div className={styles.filaRating}>
                    <span className={styles.filaEstrellas}>
                      {'★'.repeat(Math.round(Number(anime.calificacionPromedio) / 2))}
                      {'☆'.repeat(5 - Math.round(Number(anime.calificacionPromedio) / 2))}
                    </span>
                    <span className={styles.filaNumero}>{Number(anime.calificacionPromedio).toFixed(1)}</span>
                    <span className={styles.filaTotal}>{anime.totalResenas} reseñas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
