import React, { useEffect, useState } from 'react'
import { Layout }   from '../../../components/shared/Layout'
import { api }      from '../../../lib/axios'
import { useAuthStore } from '../../../store/authStore'
import { ComposerTrigger } from '../components/ComposerTrigger'
import { ReviewModal } from '../../anime/components/ReviewModal'
import { FeedItemInteractions } from '../components/FeedItemInteractions'
import { NewsSection } from '../components/NewsSection'
import styles       from './FeedPage.module.css'
import { Star, StarHalf } from 'lucide-react'

const TIPO_LABEL: Record<string, { emoji: string; texto: string }> = {
  resena:       { emoji: '', texto: 'dejó una reseña de' },
  lista_update: { emoji: '📋', texto: 'actualizó su lista:' },
  publicacion:  { emoji: '', texto: 'publicó en' },
  coleccion:    { emoji: '📚', texto: 'creó una colección:' },
}

export const FeedPage: React.FC = () => {
  const usuario              = useAuthStore(s => s.usuario)
  const [feed,     setFeed]  = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    api.get('/api/feed')
      .then(({ data }) => setFeed(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [])

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
                          animeAnilistId: resultado.animeId,
                          animeImagen: resultado.anime?.imagenUrl
                        }, ...prev])
                      } else {
                        setFeed(prev => [{
                          ...resultado,
                          tipo: 'publicacion',
                          actorUsername: usuario?.username || usuario?.user_metadata?.username,
                          actorNombre: usuario?.nombreDisplay || usuario?.user_metadata?.nombreDisplay,
                          actorAvatar: usuario?.avatarUrl || usuario?.user_metadata?.avatar_url,
                          actorMarco: usuario?.marcoUrl || usuario?.user_metadata?.marcoUrl,
                          referencia: {
                            tema: resultado.tema,
                            contenido: resultado.contenido
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
                <p className={styles.vacioTexto}>Tu feed está vacío.</p>
                <p className={styles.vacioSub}>Sigue a otros usuarios o comunidades para ver su actividad aquí.</p>
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
                        <a href={`/perfil/${entrada.actorUsername}`} className={styles.entradaUsuario}>
                          @{entrada.actorUsername}
                        </a>
                        {' '}<span className={styles.entradaAccion}>{tipo.emoji} {tipo.texto}</span>{' '}
                        {entrada.animeTitulo && (
                          <a href={`/anime/${entrada.animeAnilistId}`} className={styles.entradaAnime}>
                            {entrada.animeTitulo}
                          </a>
                        )}
                      </p>

                      {/* Detalle según tipo */}
                      {entrada.tipo === 'resena' && (
                        <div className={styles.entradaDetalle}>
                          {entrada.contenido && <p className={styles.entradaResena}>{entrada.contenido}</p>}
                          {entrada.etiquetas && entrada.etiquetas.length > 0 && (
                            <div className={styles.etiquetasWrap}>
                              {entrada.etiquetas.map((tag: string, i: number) => (
                                <span key={i} className={styles.etiqueta}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {entrada.tipo === 'publicacion' && (
                        <div className={styles.entradaDetalle}>
                          {entrada.referencia?.tema && (
                            <strong className={styles.entradaTema}>{entrada.referencia.tema}</strong>
                          )}
                          <p className={styles.entradaResena}>{entrada.referencia?.contenido || entrada.contenido}</p>
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

                      {(entrada.tipo === 'resena' || entrada.tipo === 'publicacion') && (
                        <FeedItemInteractions
                          itemId={entrada.id}
                          tipo={entrada.tipo}
                          isOwner={usuario?.user_metadata?.username === entrada.actorUsername}
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
                          <a href={`/anime/${entrada.animeAnilistId}`} className={styles.entradaThumb}>
                            <img src={entrada.animeImagen} alt={entrada.animeTitulo} />
                          </a>
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
                  </article>
                )
              })
            )}
          </div>

          <aside className={styles.sidebarCol}>
            <NewsSection title="Noticias en Tendencia" compact={true} />
          </aside>

        </div>
      </div>
    </Layout>
  )
}
