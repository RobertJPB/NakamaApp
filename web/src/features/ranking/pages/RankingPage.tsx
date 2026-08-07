import React, { useEffect, useState } from 'react'
import { Layout }    from '../../../components/shared/Layout'
import { useNavigate } from 'react-router-dom'
import { api, getCached } from '../../../lib/axios'
import { Star, Eye, Heart } from 'lucide-react'
import { tipoAnimeLabel } from '../../../lib/animeLabels'
import styles        from './RankingPage.module.css'

type Tab = 'puntuados' | 'vistos' | 'gustados'

const TAB_CONFIG: Record<Tab, { label: string; icon: React.ReactNode; endpoint: string }> = {
  puntuados: {
    label:    'Mejor Puntuados',
    icon:     <Star  size={14} />,
    endpoint: '/api/ranking',
  },
  vistos: {
    label:    'Más Vistos',
    icon:     <Eye   size={14} />,
    endpoint: '/api/ranking/mas-vistos',
  },
  gustados: {
    label:    'Más Gustados',
    icon:     <Heart size={14} />,
    endpoint: '/api/ranking/mas-gustados',
  },
}

// Normaliza la respuesta al mismo formato interno
function normalizar(data: any[], tab: Tab): { externalId: string; titulo: string; imagenUrl: string; tipo?: string; anio?: number; calificacion: number; count?: number }[] {
  if (tab === 'puntuados') {
    return (data as any[]).map(a => ({
      externalId:   a.externalId,
      titulo:      a.titulo,
      imagenUrl:   a.imagenUrl,
      tipo:        a.tipo,
      anio:        a.anio,
      calificacion: Number(a.calificacionPromedio),
    }))
  }
  // mas-vistos / mas-gustados → { anime: {...}, count: number }
  return (data as any[]).map(r => ({
    externalId:   r.anime.externalId,
    titulo:      r.anime.titulo,
    imagenUrl:   r.anime.imagenUrl,
    tipo:        r.anime.tipo,
    anio:        r.anime.anio,
    calificacion: Number(r.anime.calificacionPromedio),
    count:        r.count,
  }))
}

// Estrellas a escala 5 basadas en calificación (0–10)
function renderEstrellas(cal: number) {
  const filled = Math.round(cal / 2)
  const empty  = 5 - filled
  return (
    <span className={styles.filaEstrellas}>
      {'★'.repeat(filled)}{'☆'.repeat(empty)}
    </span>
  )
}

export const RankingPage: React.FC = () => {
  const navigate = useNavigate()
  const [tab,      setTab]      = useState<Tab>('puntuados')
  const [items,    setItems]    = useState<ReturnType<typeof normalizar>>(() => {
    const cached = getCached(TAB_CONFIG['puntuados'].endpoint, { limit: 100 })
    return cached ? normalizar(Array.isArray(cached) ? cached : [], 'puntuados') : []
  })
  const [cargando, setCargando] = useState(() => !getCached(TAB_CONFIG['puntuados'].endpoint, { limit: 100 }))

  useEffect(() => {
    const cfg = TAB_CONFIG[tab]
    const cached = getCached(cfg.endpoint, { limit: 100 })
    
    if (cached) {
      setItems(normalizar(Array.isArray(cached) ? cached : [], tab))
      setCargando(false)
    } else {
      setItems([])
      setCargando(true)
    }

    const timeout = setTimeout(() => setCargando(false), 15000)

    api.get(cfg.endpoint, { params: { limit: 100, _t: Date.now() } })
      .then(({ data }) => setItems(normalizar(Array.isArray(data) ? data : [], tab)))
      .catch(() => { if (!cached) setItems([]) })
      .finally(() => { setCargando(false); clearTimeout(timeout) })

    return () => clearTimeout(timeout)
  }, [tab])

    const cfg = TAB_CONFIG[tab]
    const visibleItems = items.filter(anime => tab === 'puntuados' || (anime.count ?? 0) > 0)

  return (
    <Layout>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Ranking</h1>
            <p className={styles.subtitulo}>
              {tab === 'puntuados' && 'Los 100 animes mejor calificados de la comunidad'}
              {tab === 'vistos'    && 'Los animes que más usuarios están viendo ahora'}
              {tab === 'gustados'  && 'Los animes con más likes de la comunidad'}
            </p>
          </div>
          <div className={styles.toggles}>
            {(Object.entries(TAB_CONFIG) as [Tab, typeof TAB_CONFIG[Tab]][]).map(([key, c]) => (
              <button
                key={key}
                className={`${styles.toggle} ${tab === key ? styles.toggleActivo : ''}`}
                onClick={() => {
                  setTab(key as Tab)
                  if (!getCached(c.endpoint, { limit: 100 })) {
                    setCargando(true)
                  }
                }}
              >
                <span className={styles.tabIcon}>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className={styles.skeletonList}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className={styles.vacio}>
            {tab === 'puntuados' ? (
              <>
                <p>No se pudo cargar el ranking global.</p>
                <span>Vuelve a intentarlo en unos minutos.</span>
              </>
            ) : (
              <>
                <p>No hay datos suficientes todavía.</p>
                <span>Agrega animes a tus listas para que aparezcan aquí.</span>
              </>
            )}
          </div>
        ) : (
          <div className={styles.lista}>
            {visibleItems.map((anime, index) => (
              <div
                key={anime.externalId}
                className={styles.fila}
                onClick={() => navigate(`/anime/${anime.externalId}`, { state: { initialAnime: { externalId: anime.externalId, titulo: anime.titulo, imagenUrl: anime.imagenUrl, calificacionPromedio: anime.calificacion } } })}
                role="link"
              >
                {/* Posición */}
                <span className={`${styles.posicion} ${index < 3 ? styles.top3 : ''}`}>
                  {index + 1}
                </span>

                {/* Poster */}
                <div className={styles.poster}>
                  <img src={anime.imagenUrl} alt={anime.titulo} loading="lazy" />
                </div>

                {/* Info */}
                <div className={styles.filaDatos}>
                  <p className={styles.filaTitulo}>{anime.titulo}</p>
                  <p className={styles.filaMeta}>{[tipoAnimeLabel(anime.tipo), anime.anio].filter(Boolean).join(' · ')}</p>

                  <div className={styles.filaRating}>
                    {renderEstrellas(anime.calificacion)}
                    <span className={styles.filaNumero}>{anime.calificacion.toFixed(1)}</span>
                    <span className={styles.filaTotal}>/10</span>
                  </div>
                </div>

                {/* Métrica principal según tab */}
                <div className={styles.metrica}>
                  {tab === 'puntuados' && (
                    <>
                      <span className={styles.metricaValor}>{anime.calificacion.toFixed(2)}</span>
                      <span className={styles.metricaLabel}>puntuación</span>
                    </>
                  )}
                  {tab === 'vistos' && (
                    <>
                      <span className={styles.metricaValor}>{anime.count ?? 0}</span>
                      <span className={styles.metricaLabel}>viendo</span>
                    </>
                  )}
                  {tab === 'gustados' && (
                    <>
                      <span className={styles.metricaValor}>{anime.count ?? 0}</span>
                      <span className={styles.metricaLabel}>Me Gusta</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
