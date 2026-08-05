import React, { useState, useEffect } from 'react'
import { useParams, Link }    from 'react-router-dom'
import { Layout }       from '../../../components/shared/Layout'
import { api, getCached } from '../../../lib/axios'
import { useAuth }      from '../../../hooks/useAuth'
import { AnimeCard }    from '../../../components/ui/AnimeCard'
import { ResenaCard }   from '../../anime/components/ResenaCard'
import { PublicacionCard } from '../../comunidad/components/PublicacionCard'
import { FeedItemInteractions } from '../../feed/components/FeedItemInteractions'
import { FollowListModal } from '../components/FollowListModal'
import { Heart, Clock, Eye, CheckSquare, Layers } from 'lucide-react'
import styles           from './PerfilPage.module.css'

type Tab = 'resenas' | 'listas' | 'actividad' | 'medallas'

export const PerfilPage: React.FC = () => {
  const { username }              = useParams<{ username: string }>()
  const { usuario: yo, signOut }  = useAuth()
  const usernameLimpio = username?.startsWith('@') ? username.substring(1) : username;
  const [perfil,   setPerfil]     = useState<any>(() => getCached(`/api/usuarios/${usernameLimpio}`))
  const [lista,    setLista]      = useState<any[]>(() => {
    const cachedPerfil = getCached(`/api/usuarios/${usernameLimpio}`)
    if (cachedPerfil) return getCached(`/api/biblioteca/${cachedPerfil.id}`)?.lista ?? []
    return []
  })
  const [columnas, setColumnas]   = useState<any[]>(() => {
    const cachedPerfil = getCached(`/api/usuarios/${usernameLimpio}`)
    if (cachedPerfil) return getCached(`/api/biblioteca/${cachedPerfil.id}/columnas`)?.columnas ?? []
    return []
  })
  const [resenas,  setResenas]    = useState<any[]>(() => {
    const cachedPerfil = getCached(`/api/usuarios/${usernameLimpio}`)
    if (cachedPerfil) return getCached(`/api/resenas/usuario/${cachedPerfil.id}`)?.resenas ?? []
    return []
  })
  const [siguiendo, setSiguiendo] = useState(() => getCached(`/api/usuarios/${usernameLimpio}`)?.esSeguido ?? false)
  const [tab,      setTab]        = useState<Tab>('resenas')
  const [filtro,   setFiltro]     = useState('todos')
  const [errorNotFound, setErrorNotFound] = useState(false)
  const [cargandoResenas, setCargandoResenas] = useState(() => {
    const cachedPerfil = getCached(`/api/usuarios/${usernameLimpio}`)
    if (!cachedPerfil) return true
    const cachedResenas = getCached(`/api/resenas/usuario/${cachedPerfil.id}`)
    return !cachedResenas
  })
  
  const [actividadFeed, setActividadFeed] = useState<any[]>([])
  const [cargandoActividad, setCargandoActividad] = useState(false)

  // Modal followers state
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalTipo, setModalTipo] = useState<'seguidores' | 'siguiendo'>('seguidores')
  const [modalTitulo, setModalTitulo] = useState('Seguidores')

  const openModal = (tipo: 'seguidores' | 'siguiendo') => {
    if (!perfil) return
    setModalTipo(tipo)
    setModalTitulo(tipo === 'seguidores' ? 'Seguidores' : 'Siguiendo')
    setModalAbierto(true)
  }

  useEffect(() => {
    if (!username) return
    let cancelled = false
    
    // Solo reseteamos errorNotFound si vamos a buscar de nuevo
    if (!getCached(`/api/usuarios/${usernameLimpio}`)) {
      setErrorNotFound(false)
    }

    // Fetch perfil first, then immediately fetch lista + resenas in parallel
    api.get(`/api/usuarios/${usernameLimpio}`)
      .then(async ({ data: perfilData }) => {
        if (cancelled) return
        setSiguiendo(perfilData.esSeguido ?? false)
        
        // Fetch lista + resenas + columnas in parallel using perfil.id
        const [listaRes, resenasRes, columnasRes] = await Promise.all([
          api.get(`/api/biblioteca/${perfilData.id}`).catch(() => ({ data: { lista: [] } })),
          api.get(`/api/resenas/usuario/${perfilData.id}`).catch(() => ({ data: { resenas: [] } })),
          api.get(`/api/biblioteca/${perfilData.id}/columnas`).catch(() => ({ data: [] }))
        ])
        
        if (cancelled) return
        setLista(listaRes.data.lista ?? [])
        setResenas(resenasRes.data.resenas ?? [])
        setColumnas(columnasRes.data.columnas ?? [])
        setCargandoResenas(false)
        setPerfil(perfilData) // Set perfil LAST so page renders once everything is ready
      })
      .catch((err) => {
        console.error("Error loading profile:", err)
        if (!cancelled && !getCached(`/api/usuarios/${usernameLimpio}`)) {
          setErrorNotFound(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [usernameLimpio])

  useEffect(() => {
    if (tab === 'actividad' && usernameLimpio && actividadFeed.length === 0) {
      setCargandoActividad(true)
      api.get(`/api/usuarios/${usernameLimpio}/actividad`)
        .then(res => {
          setActividadFeed(res.data)
        })
        .catch(err => console.error('Error fetching activity', err))
        .finally(() => setCargandoActividad(false))
    }
  }, [tab, usernameLimpio])

  const handleToggleLikeActividad = async (id: string, tipo: 'resena'|'publicacion') => {
    try {
      const res = await api.post(`/api/feed/${tipo}/${id}/like`)
      if (res.data.accion) {
        setActividadFeed(prev => prev.map(a => 
          a.id === id 
            ? { ...a, hasLiked: res.data.accion === 'liked', totalLikes: res.data.accion === 'liked' ? a.totalLikes + 1 : a.totalLikes - 1 }
            : a
        ))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const esMiPerfil = yo && perfil && yo.id === perfil.id
  const columnasVisibles = esMiPerfil ? columnas : columnas.filter(c => !c.esPrivada)
  const filtrosListas = ['todos', ...columnasVisibles.map(c => c.nombre)]
  
  const listaPublica = esMiPerfil ? lista : lista.filter(e => {
    if (!e.estados || e.estados.length === 0) return true;
    return e.estados.some((est: string) => columnasVisibles.some(c => c.nombre === est))
  })
  
  const listaFiltrada = filtro === 'todos' ? listaPublica : listaPublica.filter((e: any) => e.estados?.includes(filtro))

  const toggleSeguir = async () => {
    if (!perfil) return
    
    // Optimistic Update
    const prevSiguiendo = siguiendo
    setSiguiendo(!prevSiguiendo)
    setPerfil((p: any) => ({
      ...p,
      totalSeguidores: p.totalSeguidores + (prevSiguiendo ? -1 : 1)
    }))

    try {
      await api.post(`/api/usuarios/${perfil.id}/seguir`)
    } catch (error) {
      // Revert if error
      setSiguiendo(prevSiguiendo)
      setPerfil((p: any) => ({
        ...p,
        totalSeguidores: p.totalSeguidores + (prevSiguiendo ? 1 : -1)
      }))
    }
  }

  if (errorNotFound) return (
    <Layout>
      <div className={styles.cargando}>
        Usuario {usernameLimpio ? `@${usernameLimpio}` : ''} no encontrado
      </div>
    </Layout>
  )
  // Show skeleton while loading all data (perfil + lista + resenas together)
  if (!perfil) return (
    <Layout>
      <div className={styles.bannerWrap}><div className={styles.bannerDefault} /></div>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatarFallback} style={{ background: 'var(--color-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div className={styles.headerInfo} style={{ gap: 8 }}>
          <div style={{ height: 28, width: 220, background: 'var(--color-surface-2)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 16, width: 120, background: 'var(--color-surface-2)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ display: 'flex', gap: 24 }}>
            {[80, 100, 90].map((w, i) => <div key={i} style={{ height: 16, width: w, background: 'var(--color-surface-2)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
          </div>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      {/* Banner */}
      <div className={styles.bannerWrap}>
        {perfil.bannerUrl ? (
          <div 
            className={styles.bannerDefault} 
            style={{ 
              background: (perfil.bannerUrl.startsWith('/') || perfil.bannerUrl.startsWith('http')) 
                ? `url('${perfil.bannerUrl}') center 30% / cover no-repeat` 
                : perfil.bannerUrl 
            }} 
          />
        ) : (
          <div className={styles.bannerDefault} />
        )}
      </div>

      {/* Header del perfil */}
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          {perfil.avatarUrl
            ? <img src={perfil.avatarUrl} alt={perfil.username} className={styles.avatar} />
            : <div className={styles.avatarFallback}>{(perfil.nombreDisplay?.[0] || perfil.username?.[0] || 'U').toUpperCase()}</div>
          }
          {perfil.marcoUrl && (
            <img src={perfil.marcoUrl} alt="Marco" className={styles.marcoOverlay} />
          )}
        </div>

        <div className={styles.headerInfo}>
          <div className={styles.namesRow}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h1 className={styles.nombre}>{perfil.nombreDisplay || perfil.username}</h1>
              {esMiPerfil && (
                <Link to="/perfil/editar" className={`${styles.btnAction} ${styles.btnActionOutlined}`} style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '12px', minWidth: 'auto' }}>Editar perfil</Link>
              )}
            </div>
            <p className={styles.username}>@{perfil.username}</p>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <strong>{perfil ? (perfil.totalResenas ?? resenas.length) : (cargandoResenas ? '—' : resenas.length)}</strong> reseñas
            </div>
            <div className={`${styles.statItem} ${styles.statClickable}`} onClick={() => openModal('seguidores')}>
              <strong>{perfil ? (perfil.totalSeguidores ?? 0) : '—'}</strong> seguidores
            </div>
            <div className={`${styles.statItem} ${styles.statClickable}`} onClick={() => openModal('siguiendo')}>
              <strong>{perfil ? (perfil.totalSiguiendo ?? 0) : '—'}</strong> siguiendo
            </div>
          </div>

          {perfil.bio && <p className={styles.bio}>{perfil.bio}</p>}

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
                <a href={`/anime/${f.anime.externalId}`} key={f.animeId} className={styles.favItem} title={f.anime.titulo}>
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
            {cargandoResenas ? (
              // Skeleton mientras cargan las reseñas
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{
                    background: 'var(--color-surface-2)',
                    borderRadius: 12,
                    height: 120,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`
                  }} />
                ))}
              </div>
            ) : resenas.length === 0 ? (
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
              {filtrosListas.map(e => {
                const nombreLower = e.toLowerCase()
                let Icon = null
                let color = 'currentColor'
                if (nombreLower === 'todos') { Icon = Layers; }
                else if (nombreLower.includes('favorito') || nombreLower.includes('me gusta')) { Icon = Heart; color = '#ff4757'; }
                else if (nombreLower.includes('por ver') || nombreLower.includes('plan to watch')) { Icon = Clock; color = '#ffa502'; }
                else if (nombreLower.includes('viendo') || nombreLower.includes('watching')) { Icon = Eye; color = '#2ed573'; }
                else if (nombreLower.includes('terminado') || nombreLower.includes('completed')) { Icon = CheckSquare; color = '#1e90ff'; }

                return (
                  <button
                    key={e}
                    className={`${styles.filtro} ${filtro === e ? styles.filtroActivo : ''}`}
                    onClick={() => setFiltro(e)}
                  >
                    {Icon && <Icon size={14} color={color} />}
                    {e === 'todos' ? 'Todos' : e}
                  </button>
                )
              })}
              
              {!esMiPerfil && filtro !== 'todos' && yo && (
                <button
                  onClick={async () => {
                    const col = columnasVisibles.find(c => c.nombre === filtro)
                    if (col) {
                      try {
                        await api.post(`/api/biblioteca/columnas/${col.id}/guardar`)
                        alert('Lista guardada en tu biblioteca.')
                      } catch (e: any) {
                        alert(e.response?.data?.mensaje || 'Error al guardar lista')
                      }
                    }
                  }}
                  style={{
                    marginLeft: 'auto', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--color-texto)',
                    fontWeight: 600, fontSize: 'var(--text-sm)', padding: '6px 12px',
                    border: 'none', borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  Guardar Lista
                </button>
              )}
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
                      externalId={entrada.anime?.externalId}
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
          <div className={styles.feedActividad} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {cargandoActividad ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: 120, background: 'var(--color-surface-2)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
              ))
            ) : actividadFeed.length === 0 ? (
              <div className={styles.vacioWrap}>
                <p className={styles.vacio}>Aún no hay actividad reciente.</p>
              </div>
            ) : (
              actividadFeed.map((entrada: any) => (
                <PublicacionCard 
                  key={`${entrada.tipo}-${entrada.id}`} 
                  publicacion={{
                    ...entrada,
                    usuario: {
                      id: entrada.actorId,
                      username: entrada.actorUsername,
                      nombreDisplay: entrada.actorNombre,
                      avatarUrl: entrada.actorAvatar,
                      marcoUrl: entrada.actorMarco,
                    },
                    resena: entrada.tipo === 'resena' ? {
                      anime: {
                        titulo: entrada.animeTitulo,
                        externalId: entrada.externalId,
                        imagenUrl: entrada.animeImagen,
                      },
                      calificacion: entrada.calificacion,
                    } : null
                  }}
                  onComentado={() => {}}
                  onVotar={() => {}}
                />
              ))
            )}
          </div>
        )}

        {/* Medallas */}
        {tab === 'medallas' && (
          <div className={styles.vacioWrap}>
            <p className={styles.vacio}>Sistema de medallas próximamente. ¡Sigue interactuando para conseguirlas!</p>
          </div>
        )}
      </div>

      <FollowListModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        usuarioId={perfil.id}
        tipo={modalTipo}
        titulo={modalTitulo}
      />
    </Layout>
  )
}
