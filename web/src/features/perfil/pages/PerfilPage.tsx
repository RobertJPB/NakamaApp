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
import { Heart, Clock, Eye, CheckSquare, Layers, PlusCircle, ArrowLeft, Folder, Trash2, Settings } from 'lucide-react'
import styles           from './PerfilPage.module.css'

type Tab = 'resenas' | 'listas' | 'actividad' | 'medallas'

const tipoAnimeLabel = (tipo: string) => {
  const map: Record<string, string> = {
    'TV': 'TV', 'MOVIE': 'Película', 'OVA': 'OVA', 'ONA': 'ONA', 'SPECIAL': 'Especial', 'MUSIC': 'Música'
  }
  return map[tipo] || tipo
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

  // Lista única generada dinámicamente de estados
  const listaPublica = lista.filter((l: any) => !l.esPrivado)
  const esMiPerfil = yo?.id === perfil?.id
  const estadosUnicos = Array.from(new Set(listaPublica.flatMap((e: any) => e.estados || [])))
  
  // Combina las columnas de la BD con las dinámicas generadas por estado para que se pueda abrir cualquier lista por URL
  const columnasVisibles = [...columnas, ...estadosUnicos.filter((e: any) => !columnas.some(c => c.nombre === e)).map((e: any) => ({ nombre: e, esPrivada: false }))]

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

  // Búsqueda para añadir anime
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
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
        const { data } = await api.get(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(searchQuery)}&page[limit]=5`)
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
    
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])

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
    } catch (e) {
      console.error(e)
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
                      style={{ 
                        border: 'none', 
                        padding: '6px 12px', 
                        background: 'var(--color-acento)', 
                        color: '#000', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                      }}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <span className={styles.folderName}><Icon size={18} color={iconColor} /> {col.nombre}</span>
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
                    onCrear={async (n, d, p, i) => {
                      const formData = new FormData()
                      formData.append('nombre', n)
                      if (d) formData.append('descripcion', d)
                      formData.append('esPrivada', String(p))
                      if (i) formData.append('imagen', i)
                      
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
                      style={{
                        background: 'var(--color-acento)', color: '#1f2124',
                        fontWeight: 700, fontSize: 'var(--text-sm)',
                        padding: '6px 12px', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', transition: 'background var(--transition-fast)',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-acento-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-acento)'}
                    >
                      Añadir Anime
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {listaPublica.filter((e: any) => e.estados?.includes(listaSeleccionada.nombre)).length === 0 ? (
                    <div className={styles.vacioWrap}>
                      <p className={styles.vacio}>No hay animes en esta lista.</p>
                    </div>
                  ) : (
                    listaPublica.filter((e: any) => e.estados?.includes(listaSeleccionada.nombre)).map((entrada: any) => {
                      const resena = resenas.find(r => r.anime?.externalId === entrada.anime?.externalId || r.animeId === entrada.animeId)
                      return (
                        <div key={entrada.animeId} className={styles.listRow}>
                          <div className={styles.listRowLeft}>
                            <AnimeCard
                              externalId={entrada.anime?.externalId}
                              titulo={entrada.anime?.titulo}
                              imagenUrl={entrada.anime?.imagenUrl}
                              estado={""}
                              calificacion={entrada.calificacion}
                            />
                          </div>
                          <div className={styles.listRowRight}>
                            <div className={styles.listRowDetails} style={{ paddingRight: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                                {esMiPerfil && (
                                  <button
                                    className={styles.btnEliminarItem}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (window.confirm('¿Estás seguro de que quieres eliminar este anime de la lista?')) {
                                        eliminarDeLista(entrada.animeId, listaSeleccionada.nombre)
                                      }
                                    }}
                                    title="Eliminar de la lista"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                              <div className={styles.listRowMetadata} style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--color-texto-muted)', fontSize: '0.8rem' }}>
                                {entrada.anime?.tipo && (
                                  <span><strong>Formato:</strong> {tipoAnimeLabel(entrada.anime.tipo)}</span>
                                )}
                                {entrada.anime?.estadoEmision && (
                                  <span><strong>Estado:</strong> {
                                    entrada.anime.estadoEmision === 'RELEASING' ? 'En Emisión' :
                                    entrada.anime.estadoEmision === 'FINISHED' ? 'Finalizado' :
                                    entrada.anime.estadoEmision === 'NOT_YET_RELEASED' ? 'Próximamente' :
                                    entrada.anime.estadoEmision === 'CANCELLED' ? 'Cancelado' :
                                    entrada.anime.estadoEmision
                                  }</span>
                                )}
                                <span><strong>Episodios:</strong> {entrada.anime?.episodios || '?'}</span>
                                {entrada.anime?.demografia && <span><strong>Demografía:</strong> {entrada.anime.demografia}</span>}
                                <span><strong>Nota General:</strong> ★ {Number(entrada.anime?.calificacionPromedio) > 0 ? Number(entrada.anime.calificacionPromedio).toFixed(1) + '/10' : '?'}</span>
                                {entrada.episodiosVistos > 0 && <span><strong>Vistos:</strong> {entrada.episodiosVistos}</span>}
                              </div>
                            </div>
                            <div className={styles.listRowReview}>
                              <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-texto)', marginBottom: '8px' }}>Mi Reseña</h3>
                              {resena ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ color: '#f1c40f', fontWeight: '900', fontSize: '1.25rem', lineHeight: 1 }}>★ {resena.calificacion}<span style={{ fontSize: '0.8rem', color: 'var(--color-texto-muted)' }}>/10</span></span>
                                    <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>{new Date(resena.creadoEn).toLocaleDateString()}</span>
                                  </div>
                                  {resena.contenido ? (
                                    <p style={{ margin: 0, color: 'var(--color-texto-suave)', fontSize: '0.85rem', lineHeight: 1.4, maxWidth: '600px' }}>{resena.contenido}</p>
                                  ) : (
                                    <p style={{ margin: 0, color: 'var(--color-texto-muted)', fontSize: '0.8rem' }}>Solo calificación</p>
                                  )}
                                </div>
                              ) : (
                                <p style={{ color: 'var(--color-texto-muted)', fontSize: '0.8rem', margin: 0 }}>No has escrito ninguna reseña.</p>
                              )}
                            </div>
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
          display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                searchResults.map(anime => (
                  <div 
                    key={anime.id || anime.externalId || anime.titulo}
                    style={{
                      display: 'flex', gap: '12px', padding: '8px', borderRadius: '4px',
                      background: 'rgba(0,0,0,0.4)', cursor: 'pointer', alignItems: 'center'
                    }}
                    onClick={() => handleAgregarAnime(anime)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
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
                    <span style={{ color: 'var(--color-acento)', fontSize: '0.8rem', fontWeight: 'bold' }}>+ Añadir</span>
                  </div>
                ))
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
            setListaSeleccionada(prev => ({ ...prev, ...datos }))
            
            // Refrescar columnas
            const { data } = await api.get(`/api/biblioteca/${perfil.id}/columnas`)
            setColumnas(data.columnas || data)
            
            setShowEditarModal(false)
          }}
        />
      )}
    </Layout>
  )
}
