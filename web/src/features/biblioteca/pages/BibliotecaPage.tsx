import React, { useState, useEffect } from 'react'
import { Layout }          from '../../../components/shared/Layout'
import { useBiblioteca }   from '../../../hooks/useBiblioteca'
import { useAuthStore }    from '../../../store/authStore'
import { api }             from '../../../lib/axios'
import styles              from './BibliotecaPage.module.css'
import { AnimeCard }       from '../../../components/ui/AnimeCard'
import { ReviewModal }     from '../../anime/components/ReviewModal'
import { CrearListaModal } from '../components/CrearListaModal'
import { Heart, Clock, Eye, CheckSquare, Tv, Film, Folder, Trash2, ChevronLeft } from 'lucide-react'

// Función para determinar el ícono según el nombre de la lista
const getIconForList = (nombre: string) => {
  const nombreLower = nombre.toLowerCase()
  if (nombreLower.includes('me gusta')) return <Heart size={20} className={styles.folderIcon} color="#ff4757" />
  if (nombreLower.includes('por ver') || nombreLower.includes('plan to watch')) return <Clock size={20} className={styles.folderIcon} color="#ffa502" />
  if (nombreLower.includes('viendo') || nombreLower.includes('watching')) return <Eye size={20} className={styles.folderIcon} color="#27ae60" />
  if (nombreLower.includes('terminado') || nombreLower.includes('completed')) return <CheckSquare size={20} className={styles.folderIcon} color="#1e90ff" />
  if (nombreLower.includes('series')) return <Tv size={20} className={styles.folderIcon} color="#9c88ff" />
  if (nombreLower.includes('películas') || nombreLower.includes('peliculas') || nombreLower.includes('movies')) return <Film size={20} className={styles.folderIcon} color="#ff6b81" />
  return null
}

export const BibliotecaPage: React.FC = () => {
  const usuario = useAuthStore(s => s.usuario)
  const { lista, columnas, cargando, eliminar, crearLista, agregar } = useBiblioteca(usuario?.id ?? null)
  
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [listaSeleccionada, setListaSeleccionada] = useState<string | null>(null)

  // Modal de búsqueda
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Reseñas del usuario
  const [resenas, setResenas] = useState<any[]>([])
  const [reviewingAnime, setReviewingAnime] = useState<any>(null)

  useEffect(() => {
    if (usuario?.id) {
      api.get(`/api/resenas/usuario/${usuario.id}`)
        .then(res => setResenas(res.data.resenas || []))
        .catch(err => console.error('Error cargando reseñas', err))
    }
  }, [usuario])

  const handleCrearColumna = (datos: { nombre: string; descripcion?: string; imagenUrl?: string }) => {
    crearLista(datos)
    setShowCrearModal(false)
  }

  // Búsqueda en tiempo real (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await api.get(`/api/anime/buscar?q=${encodeURIComponent(searchQuery)}`)
        setSearchResults(data.slice(0, 5)) // Solo los primeros 5 resultados rápidos
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleAgregarAnime = async (anime: any) => {
    if (!listaSeleccionada) return
    await agregar(anime.id || anime.anilistId, listaSeleccionada)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // Render Vista Principal (Carpetas con nombres)
  if (!listaSeleccionada) {
    return (
      <Layout>
        <div className={styles.wrap}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.titulo}>Mi Tablero</h1>
              <p className={styles.subtitulo}>Tus listas personalizadas</p>
            </div>
            {!cargando && (
                <button 
                  style={{
                    background: 'var(--color-acento)',
                    color: '#1f2124',
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    minWidth: 'auto',
                    marginBottom: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-acento-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-acento)'}
                  onClick={() => setShowCrearModal(true)}
                >
                  Agregar Lista
                </button>
            )}
          </div>


          <div className={styles.folderGrid}>
            {cargando && columnas.length === 0 ? (
              <div className={styles.folderCard}>Cargando...</div>
            ) : (
              columnas.map((col: any) => {
                const animesEnColumna = lista.filter((e: any) => e.estados?.includes(col.nombre))
                
                return (
                  <div 
                    key={col.id} 
                    className={styles.folderCard}
                    onClick={() => setListaSeleccionada(col.nombre)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 'var(--space-4)', cursor: 'pointer', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-borde-suave)' }}
                  >
                    {col.imagenUrl && (
                      <div style={{ width: '100%', height: '120px', marginBottom: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <img src={col.imagenUrl} alt={col.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div className={styles.folderName}>
                        {getIconForList(col.nombre)} {col.nombre}
                      </div>
                      <span className={styles.folderCount}>{animesEnColumna.length}</span>
                    </div>
                    {col.descripcion && (
                      <div style={{ marginTop: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-texto-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {col.descripcion}
                      </div>
                    )}

                    {animesEnColumna.length > 0 && (
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', borderTop: '1px solid var(--color-borde-suave)', paddingTop: '12px' }}>
                        {animesEnColumna.map((entrada: any) => (
                          <span key={entrada.animeId} style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entrada.anime?.titulo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
        {showCrearModal && (
          <CrearListaModal 
            onClose={() => setShowCrearModal(false)}
            onCrear={handleCrearColumna}
          />
        )}
      </Layout>
    )
  }

  // Render Vista de Animes dentro de la Lista
  const animesEnColumna = lista.filter((e: any) => e.estados?.includes(listaSeleccionada))

  return (
    <Layout>
      <div className={styles.wrap}>
        <div className={styles.listHeader} style={{ justifyContent: 'flex-start' }}>
          <div>
            <button className={styles.btnVolver} onClick={() => setListaSeleccionada(null)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronLeft size={18} />
              Volver a mis listas
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
              <h1 className={styles.titulo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getIconForList(listaSeleccionada)} {listaSeleccionada}
              </h1>
              <button 
                onClick={() => setShowSearch(true)}
                style={{
                  background: 'var(--color-acento)',
                  color: '#1f2124',
                  fontWeight: 700,
                  fontSize: 'var(--text-sm)',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-acento-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-acento)'}
              >
                Añadir Anime
              </button>
            </div>
          </div>
        </div>

        {animesEnColumna.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-texto-muted)' }}>
            <p>Esta lista está vacía.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {animesEnColumna.map((entrada: any) => {
              const resena = resenas.find(r => r.anime?.anilistId === entrada.anime?.anilistId || r.animeId === entrada.animeId)
              
              return (
                <div key={entrada.animeId} style={{ 
                  display: 'flex', gap: '24px', background: 'var(--color-fondo)', 
                  padding: '16px', borderRadius: '6px', border: '1px solid var(--color-borde)',
                  position: 'relative'
                }}>
                  <div style={{ width: '150px', flexShrink: 0 }}>
                    <AnimeCard
                      anilistId={entrada.anime?.anilistId}
                      titulo={entrada.anime?.titulo}
                      imagenUrl={entrada.anime?.imagenUrl}
                      estado={""}
                      calificacion={entrada.calificacion}
                      onClick={() => window.location.href = `/anime/${entrada.anime?.anilistId}`}
                    />
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', gap: '24px' }}>
                    {/* Detalles */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '20px' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                        {entrada.anime?.titulo}
                      </h2>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--color-texto-muted)', fontSize: '0.9rem' }}>
                        {entrada.anime?.tipo && (
                          <span>
                            <strong>Formato:</strong> {
                              entrada.anime.tipo === 'TV' ? 'Serie' :
                              entrada.anime.tipo === 'MOVIE' ? 'Película' :
                              entrada.anime.tipo === 'SPECIAL' ? 'Especial' :
                              entrada.anime.tipo
                            }
                          </span>
                        )}
                        {entrada.anime?.estadoEmision && (
                          <span>
                            <strong>Estado:</strong> {
                              entrada.anime.estadoEmision === 'RELEASING' ? 'En Emisión' :
                              entrada.anime.estadoEmision === 'FINISHED' ? 'Finalizado' :
                              entrada.anime.estadoEmision === 'NOT_YET_RELEASED' ? 'Próximamente' :
                              entrada.anime.estadoEmision === 'CANCELLED' ? 'Cancelado' :
                              entrada.anime.estadoEmision
                            }
                          </span>
                        )}
                        <span><strong>Episodios:</strong> {
                          entrada.anime?.episodios ? entrada.anime.episodios : 
                          (entrada.anime?.titulo?.toLowerCase().includes('one piece') ? '+1000' : '?')
                        }</span>
                        {entrada.anime?.demografia && <span><strong>Demografía:</strong> {entrada.anime.demografia}</span>}
                        <span>
                          <strong>Nota General:</strong> ★ {Number(entrada.anime?.calificacionPromedio) > 0 ? Number(entrada.anime.calificacionPromedio).toFixed(1) + '/10' : '?'}
                        </span>
                        {entrada.episodiosVistos > 0 && <span><strong>Vistos:</strong> {entrada.episodiosVistos}</span>}
                      </div>
                    </div>

                    {/* Reseña */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-texto)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        Mi Reseña
                      </h3>
                      {resena ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ color: '#f1c40f', fontWeight: '900', fontSize: '2rem', lineHeight: 1 }}>★ {resena.calificacion}<span style={{ fontSize: '1rem', color: 'var(--color-texto-muted)' }}>/10</span></span>
                            <span style={{ color: 'var(--color-texto-muted)', fontSize: '0.85rem', marginLeft: '8px' }}>
                              {new Date(resena.creadoEn).toLocaleDateString()}
                            </span>
                          </div>
                          {resena.contenido ? (
                            <p style={{ margin: 0, color: 'var(--color-texto-suave)', fontSize: '1rem', lineHeight: 1.6, fontStyle: 'italic', maxWidth: '600px' }}>
                              "{resena.contenido}"
                            </p>
                          ) : (
                            <p style={{ margin: 0, color: 'var(--color-texto-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                              Solo calificación
                            </p>
                          )}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--color-texto-muted)', fontSize: '0.9rem', margin: 0 }}>
                          <span style={{ fontStyle: 'italic' }}>No has escrito ninguna reseña.</span>{' '}
                          <button 
                            onClick={() => setReviewingAnime(entrada.anime)}
                            style={{ 
                              background: 'none', border: 'none', padding: 0, 
                              color: 'var(--color-acento)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' 
                            }}
                          >
                            ¿Quieres escribir una?
                          </button>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    style={{
                      position: 'absolute', top: 16, right: 16,
                      background: 'transparent', color: 'var(--color-texto-muted)', border: 'none',
                      padding: '4px 8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff4757' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-texto-muted)' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      eliminar(entrada.animeId)
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Búsqueda Flotante */}
        {showSearch && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setShowSearch(false)}>
            <div style={{
              background: 'var(--color-surface)', padding: '24px', borderRadius: '16px',
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
                  width: '100%', padding: '12px', borderRadius: '8px',
                  background: 'var(--color-surface-2)', border: '1px solid var(--color-borde)',
                  color: '#fff', fontSize: '1rem'
                }}
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {isSearching ? (
                  <p style={{ color: 'var(--color-texto-muted)', textAlign: 'center' }}>Buscando...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map(anime => (
                    <div 
                      key={anime.id}
                      style={{
                        display: 'flex', gap: '12px', padding: '8px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.02)', cursor: 'pointer', alignItems: 'center'
                      }}
                      onClick={() => handleAgregarAnime(anime)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    >
                      <img src={anime.imagenUrl || anime.coverImage?.large} alt={anime.titulo || anime.title?.romaji} style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }} />
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
      </div>

      {reviewingAnime && (
        <ReviewModal
          animeIdInicial={reviewingAnime.anilistId?.toString()}
          animeInicial={reviewingAnime}
          onClose={() => setReviewingAnime(null)}
          onSaved={(res) => {
            setResenas(prev => [...prev, res])
            setReviewingAnime(null)
          }}
        />
      )}
      {showCrearModal && (
        <CrearListaModal 
          onClose={() => setShowCrearModal(false)}
          onCrear={handleCrearColumna}
        />
      )}
    </Layout>
  )
}
