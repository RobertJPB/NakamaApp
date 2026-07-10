import React, { useState, useEffect } from 'react'
import { useParams }    from 'react-router-dom'
import { Layout }       from '../../../components/shared/Layout'
import { api }          from '../../../lib/axios'
import { useAuth }      from '../../../hooks/useAuth'
import { AnimeCard }    from '../../../components/ui/AnimeCard'
import { ResenaCard }   from '../../anime/components/ResenaCard'
import styles           from './PerfilPage.module.css'

type Tab = 'lista' | 'resenas' | 'colecciones' | 'actividad'

export const PerfilPage: React.FC = () => {
  const { username }              = useParams<{ username: string }>()
  const { usuario: yo }           = useAuth()
  const [perfil,   setPerfil]     = useState<any>(null)
  const [lista,    setLista]      = useState<any[]>([])
  const [resenas,  setResenas]    = useState<any[]>([])
  const [tab,      setTab]        = useState<Tab>('lista')
  const [filtro,   setFiltro]     = useState('todos')
  const [cargando, setCargando]   = useState(true)
  const [siguiendo, setSiguiendo] = useState(false)

  const esMiPerfil = yo && perfil && yo.id === perfil?.id

  useEffect(() => {
    if (!username) return
    setCargando(true)
    api.get(`/api/usuarios/${username}`)
      .then(({ data }) => setPerfil(data))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [username])

  useEffect(() => {
    if (!perfil) return
    api.get(`/api/biblioteca/${perfil.id}`).then(({ data }) => setLista(data.lista ?? []))
    api.get(`/api/resenas/usuario/${perfil.id}`).then(({ data }) => setResenas(data.resenas ?? []))
  }, [perfil])

  const toggleSeguir = async () => {
    if (!perfil) return
    await api.post(`/api/usuarios/${perfil.id}/seguir`)
    setSiguiendo(p => !p)
  }

  const ESTADOS = ['todos', 'viendo', 'completado', 'pendiente', 'en_pausa', 'abandonado']
  const listaFiltrada = filtro === 'todos' ? lista : lista.filter((e: any) => e.estado === filtro)

  if (cargando) return <Layout><div className={styles.cargando}>Cargando perfil...</div></Layout>
  if (!perfil)  return <Layout><div className={styles.cargando}>Usuario no encontrado</div></Layout>

  return (
    <Layout>
      {/* Banner */}
      <div className={styles.bannerWrap}>
        {perfil.bannerUrl
          ? <img src={perfil.bannerUrl} alt="" className={styles.banner} />
          : <div className={styles.bannerDefault} />
        }
      </div>

      {/* Header del perfil */}
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          {perfil.avatarUrl
            ? <img src={perfil.avatarUrl} alt={perfil.username} className={styles.avatar} />
            : <div className={styles.avatarFallback}>{perfil.username?.[0]?.toUpperCase()}</div>
          }
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.nombre}>{perfil.nombreDisplay}</h1>
              <p className={styles.username}>@{perfil.username}</p>
            </div>
            {!esMiPerfil && yo && (
              <button
                className={`${styles.btnSeguir} ${siguiendo ? styles.btnSiguiendo : ''}`}
                onClick={toggleSeguir}
              >
                {siguiendo ? '✓ Siguiendo' : '+ Seguir'}
              </button>
            )}
            {esMiPerfil && (
              <a href="/configuracion" className={styles.btnEditar}>Editar perfil</a>
            )}
          </div>

          {perfil.bio && <p className={styles.bio}>{perfil.bio}</p>}

          {/* Stats estilo Letterboxd */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{perfil.totalAnimesLista ?? lista.length}</strong>
              <span>Animes</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <strong>{perfil.totalResenas ?? resenas.length}</strong>
              <span>Reseñas</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <strong>{perfil.totalSeguidores ?? 0}</strong>
              <span>Seguidores</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <strong>{perfil.totalSiguiendo ?? 0}</strong>
              <span>Siguiendo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['lista', 'resenas', 'colecciones', 'actividad'] as Tab[]).map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActiva : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'lista'       ? 'Lista' :
             t === 'resenas'     ? 'Reseñas' :
             t === 'colecciones' ? 'Colecciones' : 'Actividad'}
          </button>
        ))}
      </div>

      <div className={styles.contenido}>

        {/* Lista */}
        {tab === 'lista' && (
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
            {listaFiltrada.length === 0
              ? <p className={styles.vacio}>No hay animes en esta sección.</p>
              : (
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

        {/* Reseñas */}
        {tab === 'resenas' && (
          <div className={styles.resenasWrap}>
            {resenas.length === 0
              ? <p className={styles.vacio}>Este usuario no ha escrito reseñas aún.</p>
              : resenas.map((r: any) => <ResenaCard key={r.id} resena={r} />)
            }
          </div>
        )}

        {/* Colecciones */}
        {tab === 'colecciones' && (
          <p className={styles.vacio}>Colecciones próximamente.</p>
        )}

        {/* Actividad */}
        {tab === 'actividad' && (
          <p className={styles.vacio}>Actividad próximamente.</p>
        )}
      </div>
    </Layout>
  )
}
