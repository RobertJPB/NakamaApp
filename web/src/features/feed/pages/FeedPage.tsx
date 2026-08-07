import React, { useEffect, useState } from 'react'
import { Layout }   from '../../../components/shared/Layout'
import { Link }     from 'react-router-dom'
import { api, getCached } from '../../../lib/axios'
import { useAuthStore } from '../../../store/authStore'
import { ComposerTrigger } from '../components/ComposerTrigger'
import { ReviewModal } from '../../anime/components/ReviewModal'
import { FeedItemInteractions } from '../components/FeedItemInteractions'
import { NewsSection } from '../components/NewsSection'
import { SuggestedUsers } from '../components/SuggestedUsers'
import styles       from './FeedPage.module.css'
import { Star, StarHalf, MoreHorizontal, Pencil, Trash2, Flag } from 'lucide-react'

const TIPO_LABEL: Record<string, { emoji: string; texto: string }> = {
  resena:       { emoji: '', texto: 'dejó una reseña de' },
  lista_update: { emoji: '📋', texto: 'actualizó su lista:' },
  texto:        { emoji: '', texto: 'publicó' },
  encuesta:     { emoji: '', texto: 'creó una encuesta' },
  coleccion:    { emoji: '📚', texto: 'creó una colección:' },
}

const SpoilerText: React.FC<{ contenido: string, contieneSpoiler: boolean }> = ({ contenido, contieneSpoiler }) => {
  const [mostrar, setMostrar] = useState(false);
  
  if (contieneSpoiler && !mostrar) {
    return (
      <div className={styles.spoilerWrap}>
        <p className={styles.spoilerAviso}>⚠ Esta publicación contiene spoilers</p>
        <button className={styles.spoilerBtn} onClick={() => setMostrar(true)}>
          Mostrar de todas formas
        </button>
      </div>
    );
  }
  return <p className={styles.entradaResena}>{contenido}</p>;
}

export const FeedPage: React.FC = () => {
  const usuario              = useAuthStore(s => s.usuario)

  // Load from cache immediately if available
  const [feed, setFeed]  = useState<any[]>(() => getCached('/api/feed') ?? [])
  const [cargando, setCargando] = useState(() => !getCached('/api/feed'))
  const [hayMas, setHayMas] = useState<boolean>(() => {
    const c = getCached('/api/feed')
    return !c || c.length >= 20
  })
  const [cargandoMas, setCargandoMas] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null)
  
  // Edit State
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editContenido, setEditContenido] = useState('')
  const [editingResena, setEditingResena] = useState<any>(null)

  const handleVote = async (publicacionId: string, opcionId: string) => {
    // Buscar la publicación y determinar la acción localmente (Optimistic Update)
    const pub = feed.find(e => e.id === publicacionId)
    if (!pub) return
    const opciones = pub.referencia?.opciones || pub.opciones
    if (!opciones) return

    const votedOption = opciones.find((o: any) => o.hasVoted)
    let accion = 'voted'
    if (votedOption) {
      accion = votedOption.id === opcionId ? 'unvoted' : 'changed'
    }

    // Actualizar estado local inmediatamente
    setFeed(prev => prev.map(entrada => {
      if (entrada.id === publicacionId && (entrada.opciones || entrada.referencia?.opciones)) {
        const isRef = !!entrada.referencia?.opciones
        const opts = isRef ? entrada.referencia.opciones : entrada.opciones
        const updatedOptions = opts.map((o: any) => {
          if (accion === 'unvoted') {
            if (o.id === opcionId) return { ...o, votos: Math.max(0, o.votos - 1), hasVoted: false }
          } else if (accion === 'changed') {
            if (o.id === opcionId) return { ...o, votos: o.votos + 1, hasVoted: true }
            if (o.hasVoted) return { ...o, votos: Math.max(0, o.votos - 1), hasVoted: false }
          } else if (accion === 'voted') {
            if (o.id === opcionId) return { ...o, votos: o.votos + 1, hasVoted: true }
          }
          return o
        })
        if (isRef) return { ...entrada, referencia: { ...entrada.referencia, opciones: updatedOptions } }
        return { ...entrada, opciones: updatedOptions }
      }
      return entrada
    }))

    // Petición en segundo plano
    try {
      await api.post('/api/comunidades/votar-encuesta', { opcionId })
    } catch (err: any) {
      console.error(err)
      // Revertir podría ser implementado aquí (por simplicidad, podríamos forzar un fetch de la publicación o solo mostrar error)
      alert(err.response?.data?.error || 'Error al votar')
      // revert (simplificado):
      window.location.reload()
    }
  }

  useEffect(() => {
    const cached = getCached('/api/feed')
    if (cached) {
      setFeed(cached)
      setHayMas(cached.length >= 20)
      setCargando(false)
    }

    // Timeout: if API takes more than 6s, stop showing skeletons
    const timeout = setTimeout(() => setCargando(false), 6000)

    api.get('/api/feed')
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : []
        setFeed(items)
        setHayMas(items.length >= 20)
      })
      .catch(() => {})
      .finally(() => {
        setCargando(false)
        clearTimeout(timeout)
      })

    return () => clearTimeout(timeout)
  }, [])

  const cargarMas = async () => {
    const ultimo = feed[feed.length - 1]
    if (!ultimo?.creadoEn || cargandoMas) return
    setCargandoMas(true)
    try {
      const { data } = await api.get(`/api/feed?cursor=${encodeURIComponent(ultimo.creadoEn)}&limit=20`)
      const nuevos = Array.isArray(data) ? data : []
      setFeed(prev => [...prev, ...nuevos])
      setHayMas(nuevos.length >= 20)
    } catch {}
    finally { setCargandoMas(false) }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.${styles.dropdown}`) && !target.closest(`.${styles.btnMore}`)) {
        setMenuAbiertoId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const guardarEdicion = async (id: string, nuevoContenido: string, tipo: string) => {
    try {
      if (tipo !== 'resena' && tipo !== 'lista_update') {
        await api.put(`/api/comunidades/publicaciones/${id}`, { contenido: nuevoContenido })
        setFeed(prev => prev.map(p => {
          if (p.id === id) {
            if (p.referencia) {
              return { ...p, referencia: { ...p.referencia, contenido: nuevoContenido } }
            }
            return { ...p, contenido: nuevoContenido }
          }
          return p
        }))
      }
      setEditandoId(null)
      setEditContenido('')
    } catch (err) {
      alert('Error al guardar los cambios')
    }
  }

  const handleEliminar = async (id: string, tipo: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta publicación?')) return
    try {
      const ruta = tipo === 'resena' ? `/api/resenas/${id}` : `/api/comunidades/_/publicaciones/${id}`
      await api.delete(ruta)
      setFeed(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const reportar = (id: string) => {
    const r = window.prompt('Razón de la denuncia (spam, ofensivo, etc):')
    if (r) {
      alert('Denuncia enviada. Gracias por ayudar a mantener la comunidad segura.')
    }
  }

  return (
    <Layout>
      <div className={styles.wrap}>
        <div className={styles.layout}>

          {/* Feed principal */}
          <div className={styles.feedCol}>
            
            <h2 className={styles.titulo}>Actividad reciente</h2>
            
            {usuario && (
              <>
                <ComposerTrigger onClick={() => setModalAbierto(true)} />
                {modalAbierto && (
                  <ReviewModal
                    onClose={() => setModalAbierto(false)}
                    onSaved={(resultado) => {
                      setModalAbierto(false)
                      if (resultado.esResena) {
                        setFeed(prev => [{
                          ...resultado,
                          tipo: 'resena',
                          actorUsername: usuario?.username || usuario?.user_metadata?.username,
                          actorNombre: usuario?.nombreDisplay || usuario?.user_metadata?.nombreDisplay,
                          actorAvatar: usuario?.avatarUrl || usuario?.user_metadata?.avatar_url,
                          actorMarco: usuario?.marcoUrl || usuario?.user_metadata?.marcoUrl,
                          animeTitulo: resultado.anime?.titulo,
                          externalId: resultado.animeId,
                          animeImagen: resultado.anime?.imagenUrl
                        }, ...prev])
                      } else {
                        setFeed(prev => [{
                          ...resultado,
                          tipo: resultado.tipo || 'publicacion',
                          actorUsername: usuario?.username || usuario?.user_metadata?.username,
                          actorNombre: usuario?.nombreDisplay || usuario?.user_metadata?.nombreDisplay,
                          actorAvatar: usuario?.avatarUrl || usuario?.user_metadata?.avatar_url,
                          actorMarco: usuario?.marcoUrl || usuario?.user_metadata?.marcoUrl,
                          referencia: {
                            tema: resultado.tema,
                            contenido: resultado.contenido,
                            opciones: resultado.opciones
                          }
                        }, ...prev])
                      }
                    }}
                  />
                )}
              </>
            )}

            {cargando ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))
            ) : feed.length === 0 ? (
              <div className={styles.vacio}>
                <h3 className={styles.vacioTexto} style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Tu Feed está vacío</h3>
                <p className={styles.vacioSub} style={{ fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.5' }}>
                  ¡Sigue a tus amigos, únete a comunidades y haz tus reseñas para llenarlo de contenido!
                </p>
              </div>
            ) : (
              feed.map((entrada: any) => {
                const tipo = TIPO_LABEL[entrada.tipo] ?? { emoji: '•', texto: 'hizo algo en' }
                return (
                  <article key={entrada.id} className={styles.entrada}>
                    <div className={styles.entradaAvatarWrap}>
                      <div className={styles.entradaAvatar}>
                        {entrada.actorAvatar
                          ? <img src={entrada.actorAvatar} alt={entrada.actorUsername} />
                          : <span>{entrada.actorUsername?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      {entrada.actorMarco && (
                        <img src={entrada.actorMarco} alt="Marco" className={styles.marcoOverlay} />
                      )}
                    </div>
                    <div className={styles.entradaContenido}>
                      <p className={styles.entradaTexto}>
                        <Link to={`/perfil/${entrada.actorUsername}`} className={styles.entradaUsuario}>
                          @{entrada.actorUsername}
                        </Link>
                        {' '}<span className={styles.entradaAccion}>
                          {tipo.emoji} {tipo.texto}
                          {entrada.comunidadNombre && entrada.comunidadId ? (
                            <>{' '}<Link to={`/comunidades/${entrada.comunidadId}`} className={styles.entradaAnime} onClick={e => e.stopPropagation()}>{entrada.comunidadNombre}</Link></>
                          ) : ''}
                        </span>{' '}
                        {entrada.animeTitulo && (
                          <Link to={`/anime/${entrada.externalId}`} className={styles.entradaAnime}>
                            {entrada.animeTitulo}
                          </Link>
                        )}
                      </p>

                      {/* Detalle según tipo */}
                      {entrada.tipo === 'resena' && (
                        <div className={styles.entradaDetalle}>
                          {entrada.contenido && <SpoilerText contenido={entrada.contenido} contieneSpoiler={entrada.contieneSpoiler} />}
                          {entrada.etiquetas && entrada.etiquetas.length > 0 && (
                            <div className={styles.etiquetasWrap}>
                              {entrada.etiquetas.map((tag: string, i: number) => (
                                <span key={i} className={styles.etiqueta}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {(entrada.tipo === 'texto' || entrada.tipo === 'encuesta') && (
                        <div className={styles.entradaDetalle}>
                          {entrada.referencia?.tema && (
                            <strong className={styles.entradaTema}>{entrada.referencia.tema}</strong>
                          )}
                          {editandoId === entrada.id ? (
                            <div className={styles.inlineEditWrap}>
                              <textarea
                                value={editContenido}
                                onChange={e => setEditContenido(e.target.value)}
                                className={styles.inlineEditTextarea}
                                autoFocus
                              />
                              <div className={styles.inlineEditActions}>
                                <button className={styles.inlineEditSave} onClick={() => guardarEdicion(entrada.id, editContenido, entrada.tipo)}>Guardar</button>
                                <button className={styles.inlineEditCancel} onClick={() => setEditandoId(null)}>Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <SpoilerText 
                              contenido={entrada.referencia?.contenido || entrada.contenido} 
                              contieneSpoiler={entrada.contieneSpoiler} 
                            />
                          )}
                          
                          {(entrada.imagenUrl || entrada.referencia?.imagenUrl) && (
                            <div className={styles.postImageContainer} style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden' }}>
                              <img 
                                src={entrada.imagenUrl || entrada.referencia?.imagenUrl} 
                                alt="Imagen de la publicación" 
                                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                              />
                            </div>
                          )}

                          {entrada.tipo === 'encuesta' && (entrada.referencia?.opciones || entrada.opciones) && (
                            <div className={styles.encuestaContainer} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '450px' }}>
                              {(() => {
                                const opciones = entrada.referencia?.opciones || entrada.opciones;
                                const pollHasVoted = opciones.some((o: any) => o.hasVoted);
                                return opciones.map((o: any) => {
                                  const isVoted = o.hasVoted;
                                  return (
                                    <button
                                      key={o.id || o.texto}
                                      className={styles.encuestaOpcion}
                                      onClick={() => handleVote(entrada.id, o.id)}
                                      style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: `1px solid ${isVoted ? '#cc8400' : 'transparent'}`,
                                        background: isVoted ? '#cc8400' : 'var(--color-surface-2)',
                                        color: isVoted ? '#ffffff' : 'var(--color-texto)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                      onMouseEnter={(e) => { if (!isVoted) e.currentTarget.style.borderColor = 'var(--color-acento)' }}
                                      onMouseLeave={(e) => { if (!isVoted) e.currentTarget.style.borderColor = 'transparent' }}
                                    >
                                      <span>{o.texto}</span>
                                      <span style={{ fontSize: '12px', opacity: 0.8 }}>{o.votos} {o.votos === 1 ? 'voto' : 'votos'}</span>
                                    </button>
                                  )
                                })
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {entrada.tipo === 'lista_update' && entrada.estadoLista && (
                        <span className={`${styles.entradaEstado} ${styles[entrada.estadoLista]}`}>
                          {entrada.estadoLista.replace('_', ' ')}
                        </span>
                      )}

                      <p className={styles.entradaFecha} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {new Date(entrada.creadoEn).toLocaleDateString('es-DO', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                        {entrada.tipo === 'resena' && entrada.fechaVisto && (
                          <span style={{ 
                            background: 'rgba(255, 255, 255, 0.08)', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            color: 'var(--color-texto-suave)',
                            fontSize: '11px',
                            border: '1px solid var(--color-borde-suave)'
                          }}>
                            Visto en: {new Date(entrada.fechaVisto).toLocaleDateString('es-DO')}
                          </span>
                        )}
                      </p>

                      {(entrada.tipo === 'resena' || entrada.tipo === 'texto' || entrada.tipo === 'encuesta') && (
                        <FeedItemInteractions
                          itemId={entrada.id}
                          tipo={entrada.tipo === 'resena' ? 'resena' : 'publicacion'}
                          isOwner={usuario?.username === entrada.actorUsername}
                          initialLikes={entrada.totalLikes || 0}
                          initialHasLiked={entrada.hasLiked || false}
                          initialCommentsCount={entrada.totalComentarios || 0}
                          onDeleted={(id) => setFeed(prev => prev.filter(e => e.id !== id))}
                        />
                      )}
                    </div>

                    {(entrada.animeImagen || (entrada.tipo === 'resena' && entrada.calificacion)) && (
                      <div className={styles.entradaMedia}>
                        {entrada.animeImagen && (
                          <Link to={`/anime/${entrada.externalId}`} className={styles.entradaThumb}>
                            <img src={entrada.animeImagen} alt={entrada.animeTitulo} />
                          </Link>
                        )}
                        {entrada.tipo === 'resena' && entrada.calificacion && (
                          <div className={styles.entradaRatingBox}>
                            <span className={styles.entradaEstrellas} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              {Array.from({ length: 5 }).map((_, i) => {
                                const val = (entrada.calificacion / 10) * 5
                                if (val >= i + 1) return <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                                if (val >= i + 0.5) return <StarHalf key={i} size={14} fill="currentColor" strokeWidth={0} />
                                return <Star key={i} size={14} fill="#4b5563" strokeWidth={0} /> // Empty star color
                              })}
                            </span>
                            <span className={styles.entradaCalificacionNum}>{entrada.calificacion}/10</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!!usuario && (
                      <div className={styles.menuWrapAbsolute}>
                        <button className={styles.btnMore} onClick={() => setMenuAbiertoId(menuAbiertoId === entrada.id ? null : entrada.id)} title="Opciones">
                          <MoreHorizontal size={14} />
                        </button>
                        {menuAbiertoId === entrada.id && (
                          <div className={styles.dropdown}>
                            {entrada.actorUsername === (usuario.username || usuario.user_metadata?.username) && (
                              <>
                                <button className={styles.dropdownItem} onClick={() => { 
                                  setMenuAbiertoId(null); 
                                  if (entrada.tipo === 'resena') {
                                    setEditingResena(entrada.referencia || entrada)
                                  } else {
                                    setEditandoId(entrada.id)
                                    setEditContenido(entrada.referencia?.contenido || entrada.contenido || '')
                                  }
                                }}>
                                  <Pencil size={14} /> Editar
                                </button>
                                <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => { 
                                  setMenuAbiertoId(null); 
                                  handleEliminar(entrada.id, entrada.tipo);
                                }}>
                                  <Trash2 size={14} /> Eliminar
                                </button>
                              </>
                            )}
                            <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => { setMenuAbiertoId(null); reportar(entrada.id) }}>
                              <Flag size={14} /> Denunciar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })
            )}

            {!cargando && feed.length > 0 && hayMas && (
              <button className={styles.btnCargarMas} onClick={cargarMas} disabled={cargandoMas}>
                {cargandoMas ? 'Cargando...' : 'Cargar más'}
              </button>
            )}
          </div>

          <aside className={styles.sidebarCol}>
            <SuggestedUsers forceLoading={cargando} />
            <NewsSection title="Noticias en Tendencia" compact={true} forceLoading={cargando} />
          </aside>

        </div>
      </div>
      
      {editingResena && (
        <ReviewModal
          resenaToEdit={editingResena}
          onClose={() => setEditingResena(null)}
          onSaved={(res) => {
            setFeed(prev => prev.map(p => {
              if (p.referenciaId === res.id) return { ...p, referencia: res }
              if (p.id === res.id) return { ...p, ...res }
              return p
            }))
            setEditingResena(null)
          }}
        />
      )}
    </Layout>
  )
}
