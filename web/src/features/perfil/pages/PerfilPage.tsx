import React, { useState, useEffect } from 'react'
import { useParams }    from 'react-router-dom'
import { Layout }       from '../../../components/shared/Layout'
import { api }          from '../../../lib/axios'
import { useAuth }      from '../../../hooks/useAuth'
import { AnimeCard }    from '../../../components/ui/AnimeCard'
import { ResenaCard }   from '../../anime/components/ResenaCard'
import styles           from './PerfilPage.module.css'

type Tab = 'resenas' | 'listas' | 'actividad' | 'medallas'

export const PerfilPage: React.FC = () => {
  const { username }              = useParams<{ username: string }>()
  const { usuario: yo, signOut }  = useAuth()
  const [perfil,   setPerfil]     = useState<any>(null)
  const [lista,    setLista]      = useState<any[]>([])
  const [resenas,  setResenas]    = useState<any[]>([])
  const [tab,      setTab]        = useState<Tab>('resenas')
  const [filtro,   setFiltro]     = useState('todos')
  const [cargando, setCargando]   = useState(true)
  const [siguiendo, setSiguiendo] = useState(false)

  // Usar los datos cacheados de la sesión si es mi propio perfil para que cargue instantáneamente
  const perfilMostrar = perfil || (yo && yo.username === username ? yo : null)
  const esMiPerfil = yo && perfilMostrar && yo.id === perfilMostrar.id

  useEffect(() => {
    if (!username) return
    setCargando(true)
    api.get(`/api/usuarios/${username}`)
      .then(({ data }) => {
        setPerfil(data)
        setSiguiendo(data.esSeguido ?? false)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [username])

  useEffect(() => {
    if (!perfil) return
    api.get(`/api/biblioteca/${perfil.id}`).then(({ data }) => setLista(data.lista ?? []))
    api.get(`/api/resenas/usuario/${perfil.id}`).then(({ data }) => setResenas(data.resenas ?? []))
  }, [perfil])

  const ESTADOS = ['todos', 'viendo', 'completado', 'pendiente', 'en_pausa', 'abandonado']
  const listaFiltrada = filtro === 'todos' ? lista : lista.filter((e: any) => e.estado === filtro)

  const toggleSeguir = async () => {
    if (!perfilMostrar) return
    await api.post(`/api/usuarios/${perfilMostrar.id}/seguir`)
    setSiguiendo(p => !p)
  }

  if (cargando && !perfilMostrar) return <Layout><div className={styles.cargando}>Cargando perfil...</div></Layout>
  if (!perfilMostrar && !cargando)  return <Layout><div className={styles.cargando}>Usuario no encontrado</div></Layout>

  return (
    <Layout>
      {/* Banner */}
      <div className={styles.bannerWrap}>
        {perfilMostrar.bannerUrl ? (
          <div 
            className={styles.bannerDefault} 
            style={{ 
              background: (perfilMostrar.bannerUrl.startsWith('/') || perfilMostrar.bannerUrl.startsWith('http')) 
                ? `url('${perfilMostrar.bannerUrl}') center 30% / cover no-repeat` 
                : perfilMostrar.bannerUrl 
            }} 
          />
        ) : (
          <div className={styles.bannerDefault} />
        )}
      </div>

      {/* Header del perfil */}
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          {perfilMostrar.avatarUrl
            ? <img src={perfilMostrar.avatarUrl} alt={perfilMostrar.username} className={styles.avatar} />
            : <div className={styles.avatarFallback}>{(perfilMostrar.nombreDisplay?.[0] || perfilMostrar.username?.[0] || 'U').toUpperCase()}</div>
          }
          {perfilMostrar.marcoUrl && (
            <img src={perfilMostrar.marcoUrl} alt="Marco" className={styles.marcoOverlay} />
          )}
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.namesRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <h1 className={styles.nombre}>{perfilMostrar.nombreDisplay || perfilMostrar.username}</h1>
              {esMiPerfil && (
                <a href="/perfil/editar" className={`${styles.btnAction} ${styles.btnActionOutlined}`} style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '12px' }}>Editar perfil</a>
              )}
            </div>
            <p className={styles.username}>@{perfilMostrar.username}</p>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <strong>{perfilMostrar.totalResenas ?? resenas.length}</strong> reseñas
            </div>
            <div className={styles.statItem}>
              <strong>{perfilMostrar.totalSeguidores ?? 0}</strong> seguidores
            </div>
            <div className={styles.statItem}>
              <strong>{perfilMostrar.totalSiguiendo ?? 0}</strong> siguiendo
            </div>
          </div>

          {perfilMostrar.bio && <p className={styles.bio}>{perfilMostrar.bio}</p>}

          <div className={styles.actionsRow}>
            {!esMiPerfil && yo && (
              <button
                className={`${styles.btnAction} ${siguiendo ? styles.btnActionOutlined : styles.btnActionSolid}`}
                onClick={toggleSeguir}
              >
                {siguiendo ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>

        {lista.filter((x: any) => x.esFavorito).length > 0 && (
          <div className={styles.favoritosWrap}>
            <h3 className={styles.favoritosTitle}>Favoritos</h3>
            <div className={styles.favoritosList}>
              {lista.filter((x: any) => x.esFavorito).map((f: any) => (
                <a href={`/anime/${f.anime.anilistId}`} key={f.animeId} className={styles.favItem} title={f.anime.titulo}>
                  <img src={f.anime.imagenUrl} alt={f.anime.titulo} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['resenas', 'listas', 'actividad', 'medallas'] as Tab[]).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActiva : ''}`}
            onClick={() => setTab(t)}
            style={t === 'medallas' ? { marginLeft: 'var(--space-8)' } : {}}
          >
            {t === 'resenas' ? 'Reseñas' : t === 'listas' ? 'Listas' : t === 'actividad' ? 'Actividad' : 'Medallas'}
          </button>
        ))}
      </div>

      <div className={styles.contenido}>

        {/* Reseñas */}
        {tab === 'resenas' && (
          <div className={styles.resenasWrap}>
            {resenas.length === 0 ? (
              <div className={styles.vacioWrap}>
                <p className={styles.vacio}>Este usuario no ha escrito reseñas aún.</p>
                {esMiPerfil && (
                  <a href="/descubrir" className={`${styles.btnAction} ${styles.btnActionOutlined}`} style={{ textDecoration: 'none' }}>
                    Crear una reseña
                  </a>
                )}
              </div>
            ) : (
              resenas.map((r: any) => <ResenaCard key={r.id} resena={r} />)
            )}
          </div>
        )}

        {/* Listas */}
        {tab === 'listas' && (
          <div className={styles.listaWrap}>
            <div className={styles.filtros}>
              {ESTADOS.map(e => (
                <button
                  key={e}
                  className={`${styles.filtro} ${filtro === e ? styles.filtroActivo : ''}`}
                  onClick={() => setFiltro(e)}
                >
                  {e === 'todos' ? 'Todos' :
                   e === 'en_pausa' ? 'En pausa' :
                   e.charAt(0).toUpperCase() + e.slice(1)}
                </button>
              ))}
            </div>
            {listaFiltrada.length === 0 ? (
              <div className={styles.vacioWrap}>
                <p className={styles.vacio}>No hay animes en esta sección.</p>
                {esMiPerfil && (
                  <a href="/descubrir" className={`${styles.btnAction} ${styles.btnActionOutlined}`} style={{ textDecoration: 'none' }}>
                    Crear una lista
                  </a>
                )}
              </div>
            ) : (
                <div className={styles.grid}>
                  {listaFiltrada.map((entrada: any) => (
                    <AnimeCard
                      key={entrada.animeId}
                      anilistId={entrada.anime?.anilistId}
                      titulo={entrada.anime?.titulo}
                      imagenUrl={entrada.anime?.imagenUrl}
                      estado={entrada.estado}
                      calificacion={entrada.calificacion}
                    />
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* Actividad */}
        {tab === 'actividad' && (
          <div className={styles.vacioWrap}>
            <p className={styles.vacio}>Aún no hay actividad reciente.</p>
          </div>
        )}

        {/* Medallas */}
        {tab === 'medallas' && (
          <div className={styles.vacioWrap}>
            <p className={styles.vacio}>Sistema de medallas próximamente. ¡Sigue interactuando para conseguirlas!</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
