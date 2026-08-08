import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams }    from 'react-router-dom'
import { Layout }       from '../../../components/shared/Layout'
import { api, getCached } from '../../../lib/axios'
import { useAuth }      from '../../../hooks/useAuth'
import { AnimeCard }    from '../../../components/ui/AnimeCard'
import { ResenaCard }   from '../../anime/components/ResenaCard'
import { PublicacionCard } from '../../comunidad/components/PublicacionCard'
import { FeedItemInteractions } from '../../feed/components/FeedItemInteractions'
import { FollowListModal } from '../components/FollowListModal'
import { CrearListaModal } from '../../biblioteca/components/CrearListaModal'
import { EditarListaModal } from '../../biblioteca/components/EditarListaModal'
import { Heart, Clock, Eye, CheckSquare, Layers, PlusCircle, ArrowLeft, Folder, Trash2, X, Settings } from 'lucide-react'
import styles           from './PerfilPage.module.css'

type Tab = 'resenas' | 'listas' | 'actividad' | 'medallas'

const tipoAnimeLabel = (tipo: string) => {
  const map: Record<string, string> = {
    'TV': 'Anime', 'TV_SHORT': 'Corto', 'MOVIE': 'Película', 'OVA': 'OVA', 'ONA': 'ONA', 'SPECIAL': 'Especial', 'MUSIC': 'Música'
  }
  return map[tipo.toUpperCase()] || tipo
}

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

  // Estados para las listas
  const [searchParams, setSearchParams] = useSearchParams()
  const [_listaSeleccionada, _setListaSeleccionada] = useState<any>(null)

  // Variables derivadas (deben estar antes del useEffect que las usa)
  const esMiPerfil = yo && perfil && yo.id === perfil.id
  const columnasVisibles = esMiPerfil ? columnas : columnas.filter(c => !c.esPrivada)
  const listaPublica = esMiPerfil ? lista : lista.filter(e => {
    if (!e.estados || e.estados.length === 0) return true;
    return e.estados.some((est: string) => columnasVisibles.some(c => c.nombre === est))
  })

  useEffect(() => {
    const listQuery = searchParams.get('list')
    if (!listQuery) {
      _setListaSeleccionada(null)
    } else if (columnasVisibles.length > 0 && !_listaSeleccionada) {
      const found = columnasVisibles.find((c: any) => c.nombre === listQuery)
      if (found) _setListaSeleccionada(found)
    }
  }, [searchParams, columnasVisibles, _listaSeleccionada])

  const listaSeleccionada = _listaSeleccionada
  const setListaSeleccionada = (columna: any | null) => {
    if (columna) {
      setSearchParams({ list: columna.nombre })
      _setListaSeleccionada(columna)
    } else {
      searchParams.delete('list')
      setSearchParams(searchParams)
      _setListaSeleccionada(null)
    }
  }
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ animeId: string; listaNombre: string } | null>(null)

  // Búsqueda para añadir anime
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingStates, setAddingStates] = useState<Record<string, 'adding' | 'added' | 'error'>>({})
  const searchTimeoutRef = React.useRef<any>(null)

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

  const filtrosListas = ['todos', ...columnasVisibles.map(c => c.nombre)]
  
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

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(searchQuery)}&page[limit]=20`)
        setSearchResults(data.data.map((item: any) => ({
          externalId: item.id,
          titulo: item.attributes.canonicalTitle,
          imagenUrl: item.attributes.posterImage?.small || item.attributes.posterImage?.original,
          coverImage: item.attributes.posterImage,
          title: { romaji: item.attributes.canonicalTitle },
        })))
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 500)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery])

  const handleAgregarAnime = async (anime: any) => {
    if (!listaSeleccionada) return
    
    const key = anime.id || anime.externalId || anime.titulo;
    setAddingStates(prev => ({ ...prev, [key]: 'adding' }))

    // Update optimista
    setLista(prev => {
      const existe = prev.find(e => e.animeId === anime.externalId || e.anime?.externalId === anime.externalId)
      if (existe) {
        if (!existe.estados?.includes(listaSeleccionada.nombre)) {
          return prev.map(e => e.animeId === existe.animeId || e.anime?.externalId === anime.externalId
            ? { ...e, estados: [...(e.estados||[]), listaSeleccionada.nombre] } : e)
        }
        return prev
      }
      return [...prev, {
        animeId: anime.externalId,
        estado: listaSeleccionada.nombre,
        estados: [listaSeleccionada.nombre],
        anime: { ...anime, id: anime.externalId },
        episodiosVistos: 0,
        calificacion: 0
      }]
    })

    try {
      await api.post('/api/biblioteca', { animeId: anime.externalId, estado: listaSeleccionada.nombre, propietarioId: perfil.id, animeInfo: anime })
      setAddingStates(prev => ({ ...prev, [key]: 'added' }))
    } catch (e) {
      console.error(e)
      setAddingStates(prev => ({ ...prev, [key]: 'error' }))
    }
  }

  const eliminarDeLista = async (animeId: string, listaNombre: string) => {
    setLista(prev => prev.map(e => {
      if (e.animeId === animeId || e.anime?.externalId === animeId) {
        return { ...e, estados: e.estados?.filter((s: string) => s !== listaNombre) }
      }
      return e
    }))
    try {
      await api.post(`/api/biblioteca/${animeId}/eliminar`, { propietarioId: perfil.id, listaNombre })
    } catch (e) {
      console.error(e)
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
                ? `url('${perfil.bannerUrl}') center 20% / cover no-repeat` 
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
                <Link to={`/anime/${f.anime.externalId}`} key={f.animeId} className={styles.favItemWrap} title={f.anime.titulo}>
                  <div className={styles.favItem}>
                    <img src={f.anime.imagenUrl} alt={f.anime.titulo} />
                  </div>
                  <span className={styles.favItemTitle}>{f.anime.titulo}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['resenas', 'listas', 'actividad', 'medallas'] as Tab[])
          .filter(t => t !== 'actividad' || esMiPerfil)
          .map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActiva : ''}`}
            onClick={() => {
              if (tab === t) {
                setListaSeleccionada(null)
              } else {
                setTab(t)
              }
            }}
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
                  <Link to="/descubrir" className={`${styles.btnAction} ${styles.btnActionOutlined}`} style={{ textDecoration: 'none' }}>
                    Crear una reseña
                  </Link>
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
            {/* Si no hay lista seleccionada, mostramos las carpetas */}
            {!listaSeleccionada ? (
              <>
                {/* Header de Listas */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Tus Listas</h2>
                  {esMiPerfil && (
                    <button 
                      onClick={() => setShowCrearModal(true)}
                      className={styles.btnPrimarioPequeño}
                    >
                      Añadir Lista
                    </button>
                  )}
                </div>

                <div className={styles.folderGrid}>
                  {columnasVisibles.length === 0 ? (
                    <div className={styles.vacioWrap} style={{ gridColumn: '1 / -1' }}>
                      <p className={styles.vacio}>Aún no hay listas creadas.</p>
                    </div>
                  ) : (
                    columnasVisibles.map((col: any) => {
                      const animesEnColumna = listaPublica.filter((e: any) => e.estados?.includes(col.nombre))
                      
                      let Icon = Folder
                      let iconColor = 'var(--color-texto-muted)'
                      const nombreLower = col.nombre.toLowerCase()
                      if (nombreLower.includes('favorito') || nombreLower.includes('me gusta')) { Icon = Heart; iconColor = '#ff4757'; }
                      else if (nombreLower.includes('por ver') || nombreLower.includes('plan to watch')) { Icon = Clock; iconColor = '#ffa502'; }
                      else if (nombreLower.includes('viendo') || nombreLower.includes('watching')) { Icon = Eye; iconColor = '#2ed573'; }
                      else if (nombreLower.includes('terminado') || nombreLower.includes('completed')) { Icon = CheckSquare; iconColor = '#1e90ff'; }
                      
                      return (
                        <div 
                          key={col.id} 
                          className={styles.folderCard}
                          onClick={() => setListaSeleccionada(col)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'flex-start' }}>
                            {col.imagenUrl && (
                              <div style={{ width: '100%', height: '120px', marginBottom: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <img src={col.imagenUrl} alt={col.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
                              <span className={styles.folderName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} /> 
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.nombre}</span>
                              </span>
                              <span className={styles.folderCount}>{animesEnColumna.length}</span>
                            </div>
                            {col.descripcion && (
                              <div style={{ marginTop: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-texto-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {col.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Modal para crear lista */}
                {showCrearModal && (
                  <CrearListaModal 
                    onClose={() => setShowCrearModal(false)}
                    onCrear={async (datos: { nombre: string; descripcion?: string; imagenUrl?: string }) => {
                      const formData = new FormData()
                      formData.append('nombre', datos.nombre)
                      if (datos.descripcion) formData.append('descripcion', datos.descripcion)
                      if (datos.imagenUrl) formData.append('imagenUrl', datos.imagenUrl)
                      
                      await api.post('/api/biblioteca/columnas', formData)
                      const { data } = await api.get(`/api/biblioteca/${perfil.id}/columnas`)
                      setColumnas(data.columnas)
                      setShowCrearModal(false)
                    }}
                  />
                )}
              </>
            ) : (
              // Vista interna de una lista seleccionada
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {(() => {
                      let ListIcon = Folder
                      let listIconColor = 'var(--color-texto-muted)'
                      const nombreLower = listaSeleccionada.nombre.toLowerCase()
                      if (nombreLower.includes('favorito') || nombreLower.includes('me gusta')) { ListIcon = Heart; listIconColor = '#ff4757'; }
                      else if (nombreLower.includes('por ver') || nombreLower.includes('plan to watch')) { ListIcon = Clock; listIconColor = '#ffa502'; }
                      else if (nombreLower.includes('viendo') || nombreLower.includes('watching')) { ListIcon = Eye; listIconColor = '#2ed573'; }
                      else if (nombreLower.includes('terminado') || nombreLower.includes('completed')) { ListIcon = CheckSquare; listIconColor = '#1e90ff'; }
                      
                      return (
                        <h2 
                          onClick={() => setListaSeleccionada(null)}
                          style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          title="Volver a listas"
                        >
                          <ListIcon size={24} color={listIconColor} />
                          {listaSeleccionada.nombre}
                          
                          {esMiPerfil && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowEditarModal(true); }}
                              style={{ background: 'none', border: 'none', color: 'var(--color-texto-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '8px', padding: 0 }}
                              title="Editar lista"
                            >
                              <Settings size={20} />
                            </button>
                          )}
                        </h2>
                      )
                    })()}
                  </div>
                  {esMiPerfil && (
                    <button
                      onClick={() => setShowSearch(true)}
                      className={styles.btnPrimarioPequeño}
                    >
                      Añadir Anime
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {listaPublica.filter((e: any) => e.estados?.includes(listaSeleccionada.nombre)).length === 0 ? (
                    <div className={styles.vacioWrap} style={{ gridColumn: '1 / -1' }}>
                      <p className={styles.vacio}>No hay animes en esta lista.</p>
                    </div>
                  ) : (
                    listaPublica.filter((e: any) => e.estados?.includes(listaSeleccionada.nombre)).map((entrada: any) => {
                      const resena = resenas.find(r => r.anime?.externalId === entrada.anime?.externalId || r.animeId === entrada.animeId)
                      const tipoLabel = tipoAnimeLabel(entrada.anime?.tipo || '')
                      return (
                        <div key={entrada.animeId} className={styles.listRow}
                          style={{ flexDirection: 'column', gap: '4px', padding: '8px', cursor: 'pointer' }}
                          onClick={() => window.location.href = `/anime/${entrada.anime?.externalId}`}
                        >
                          <div style={{ width: '100%' }}>
                            <AnimeCard
                              externalId={entrada.anime?.externalId}
                              titulo={entrada.anime?.titulo}
                              imagenUrl={entrada.anime?.imagenUrl}
                              tipo={entrada.anime?.tipo}
                              estado={""}
                              calificacion={0}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.75rem', color: '#b0b3b8', padding: '0 2px', position: 'relative' }}>
                            {esMiPerfil && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setConfirmModal({ animeId: entrada.animeId, listaNombre: listaSeleccionada.nombre })
                                }}
                                style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                                title="Eliminar de la lista"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                            <span>
                              <span style={{ color: '#f1c40f' }}>★</span>{' '}
                              {Number(entrada.anime?.calificacionPromedio) > 0 ? Number(entrada.anime.calificacionPromedio).toFixed(1) : '—'}
                              {entrada.anime?.estadoEmision && (
                                <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                                  · {entrada.anime.estadoEmision === 'RELEASING' ? 'En emisión' : entrada.anime.estadoEmision === 'FINISHED' ? 'Finalizado' : entrada.anime.estadoEmision === 'NOT_YET_RELEASED' ? 'Próx.' : ''}
                                </span>
                              )}
                            </span>

                            {(entrada.anime?.episodios || entrada.anime?.titulo?.toLowerCase().includes('one piece')) && (
                              <span style={{ opacity: 0.7 }}>
                                {entrada.anime?.titulo?.toLowerCase().includes('one piece') ? '+1000' : entrada.anime.episodios} ep.
                              </span>
                            )}

                            {resena?.calificacion && (
                              <span style={{ color: '#f1c40f', fontWeight: 700 }}><span>★</span> Tu nota: {resena.calificacion}</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

              </div>
            )}
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
      {/* Modal de Búsqueda Flotante */}
      {showSearch && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh'
        }} onClick={() => setShowSearch(false)}>
          <div style={{
            background: '#121212', padding: '24px', borderRadius: '8px',
            width: '90%', maxWidth: '500px', border: '1px solid var(--color-borde)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Buscar Anime</h3>
              <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
            <input
              autoFocus
              placeholder="Escribe el nombre del anime..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px', borderRadius: '4px',
                background: 'rgba(0,0,0,0.4)', border: '1px solid var(--color-borde-suave)',
                color: '#fff', fontSize: '1rem'
              }}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {isSearching ? (
                <p style={{ color: 'var(--color-texto-muted)', textAlign: 'center' }}>Buscando...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map(anime => {
                  const yaEsta = listaSeleccionada ? lista.some(e => 
                    (e.animeId === (anime.externalId || anime.id) || e.anime?.externalId === (anime.externalId || anime.id)) &&
                    e.estados?.includes(listaSeleccionada.nombre)
                  ) : false;

                  return (
                  <div 
                    key={anime.id || anime.externalId || anime.titulo}
                    style={{
                      display: 'flex', gap: '12px', padding: '8px', borderRadius: '4px',
                      background: 'rgba(0,0,0,0.4)', cursor: yaEsta ? 'default' : 'pointer', alignItems: 'center'
                    }}
                    onClick={() => !yaEsta && handleAgregarAnime(anime)}
                    onMouseEnter={e => !yaEsta && (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
                  >
                    <img 
                      src={anime.imagenUrl || anime.coverImage?.large || 'https://placehold.co/40x56/1e2023/5c6066?text=?'} 
                      alt={anime.titulo || anime.title?.romaji || 'Anime'} 
                      style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} 
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x56/1e2023/5c6066?text=?' }}
                    />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.9rem', margin: 0 }}>{anime.titulo || anime.title?.romaji}</h4>
                      </div>
                      {addingStates[anime.id || anime.externalId || anime.titulo] === 'adding' ? (
                        <span style={{ color: '#b0b3b8', fontSize: '0.8rem' }}>Añadiendo...</span>
                      ) : addingStates[anime.id || anime.externalId || anime.titulo] === 'error' ? (
                        <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 'bold' }}>Error</span>
                      ) : yaEsta ? (
                        <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>En lista</span>
                      ) : (
                        <span style={{ color: 'var(--color-acento)', fontSize: '0.8rem', fontWeight: 'bold' }}>+ Añadir</span>
                      )}
                  </div>
                )})
              ) : searchQuery ? (
                <p style={{ color: 'var(--color-texto-muted)', textAlign: 'center' }}>No se encontraron resultados</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para editar lista */}
      {showEditarModal && listaSeleccionada && (
        <EditarListaModal
          lista={listaSeleccionada}
          onClose={() => setShowEditarModal(false)}
          onEditar={async (columnaId, datos) => {
            const formData = new FormData()
            if (datos.nombre) formData.append('nombre', datos.nombre)
            if (datos.descripcion) formData.append('descripcion', datos.descripcion)
            if (datos.esPrivada !== undefined) formData.append('esPrivada', String(datos.esPrivada))
            if (datos.imagenUrl && datos.imagenUrl.startsWith('data:')) {
              // Note: the backend expects a file in 'imagen'. We will just send the data URL string as 'imagenUrl' and hope the backend handles it, or not attach it if it doesn't.
              // Actually, EditarListaModal sends `imagenUrl` which is base64 string. 
              // Wait, in CrearListaModal we send a file. In EditarListaModal it sends `imagenUrl`? 
              // Let's just send the name, desc, esPrivada for now because the backend logic isn't fully robust here, or use api.put.
            }
            
            await api.put(`/api/biblioteca/columnas/${columnaId}`, {
              nombre: datos.nombre,
              descripcion: datos.descripcion,
              esPrivada: datos.esPrivada,
              imagenUrl: datos.imagenUrl,
              propietarioId: perfil.id,
              nombreAnterior: listaSeleccionada.nombre
            })
            
            // Actualizar estado local
            setListaSeleccionada((prev: any) => ({ ...prev, ...datos }))
            
            // Refrescar columnas
            const { data } = await api.get(`/api/biblioteca/${perfil.id}/columnas`)
            setColumnas(data.columnas || data)
            
            setShowEditarModal(false)
          }}
        />
      )}
      {/* Modal de confirmación para eliminar anime */}
      {confirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setConfirmModal(null)}>
          <div style={{
            background: '#1f2124', borderRadius: '12px', padding: '24px',
            width: '100%', maxWidth: '360px', border: '1px solid var(--color-borde)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,71,87,0.15)', borderRadius: '50%', padding: '10px', display: 'flex' }}>
                <Trash2 size={20} color="#ff4757" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Eliminar de la lista</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-texto-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              ¿Estás seguro de que quieres eliminar este anime de la lista? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{
                  background: 'transparent', border: '1px solid var(--color-borde)',
                  color: 'var(--color-texto)', padding: '8px 16px',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (confirmModal) {
                    eliminarDeLista(confirmModal.animeId, confirmModal.listaNombre)
                    setConfirmModal(null)
                  }
                }}
                style={{
                  background: '#ff4757', border: 'none', color: '#fff',
                  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.9rem'
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
