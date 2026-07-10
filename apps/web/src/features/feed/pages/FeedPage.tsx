import React, { useEffect, useState } from 'react'
import { Layout }   from '../../../components/shared/Layout'
import { api }      from '../../../lib/axios'
import { useAuthStore } from '../../../store/authStore'
import styles       from './FeedPage.module.css'

const TIPO_LABEL: Record<string, { emoji: string; texto: string }> = {
  resena:       { emoji: '⭐', texto: 'dejó una reseña de' },
  lista_update: { emoji: '📋', texto: 'actualizó su lista:' },
  publicacion:  { emoji: '💬', texto: 'publicó en' },
  coleccion:    { emoji: '📚', texto: 'creó una colección:' },
}

export const FeedPage: React.FC = () => {
  const usuario              = useAuthStore(s => s.usuario)
  const [feed,     setFeed]  = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

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

            {cargando ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))
            ) : feed.length === 0 ? (
              <div className={styles.vacio}>
                <p className={styles.vacioTexto}>Tu feed está vacío.</p>
                <p className={styles.vacioSub}>Sigue a otros usuarios para ver su actividad aquí.</p>
                <a href="/descubrir" className={styles.vacioCta}>Descubrir usuarios →</a>
              </div>
            ) : (
              feed.map((entrada: any) => {
                const tipo = TIPO_LABEL[entrada.tipo] ?? { emoji: '•', texto: 'hizo algo en' }
                return (
                  <article key={entrada.id} className={styles.entrada}>
                    <div className={styles.entradaAvatar}>
                      {entrada.actorAvatar
                        ? <img src={entrada.actorAvatar} alt={entrada.actorUsername} />
                        : <span>{entrada.actorUsername?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className={styles.entradaContenido}>
                      <p className={styles.entradaTexto}>
                        <a href={`/perfil/${entrada.actorUsername}`} className={styles.entradaUsuario}>
                          {entrada.actorNombre ?? entrada.actorUsername}
                        </a>
                        {' '}<span className={styles.entradaAccion}>{tipo.emoji} {tipo.texto}</span>{' '}
                        {entrada.animeTitulo && (
                          <a href={`/anime/${entrada.animeAnilistId}`} className={styles.entradaAnime}>
                            {entrada.animeTitulo}
                          </a>
                        )}
                      </p>

                      {/* Detalle según tipo */}
                      {entrada.tipo === 'resena' && entrada.calificacion && (
                        <div className={styles.entradaDetalle}>
                          <span className={styles.entradaEstrellas}>
                            {'★'.repeat(Math.round(entrada.calificacion / 2))}
                            {'☆'.repeat(5 - Math.round(entrada.calificacion / 2))}
                          </span>
                          <span className={styles.entradaCalificacion}>{entrada.calificacion}/10</span>
                          {entrada.contenido && (
                            <p className={styles.entradaResena}>{entrada.contenido}</p>
                          )}
                        </div>
                      )}

                      {entrada.tipo === 'lista_update' && entrada.estadoLista && (
                        <span className={`${styles.entradaEstado} ${styles[entrada.estadoLista]}`}>
                          {entrada.estadoLista.replace('_', ' ')}
                        </span>
                      )}

                      <p className={styles.entradaFecha}>
                        {new Date(entrada.creadoEn).toLocaleDateString('es-DO', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {entrada.animeImagen && (
                      <a href={`/anime/${entrada.animeAnilistId}`} className={styles.entradaThumb}>
                        <img src={entrada.animeImagen} alt={entrada.animeTitulo} />
                      </a>
                    )}
                  </article>
                )
              })
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>Tu perfil</h3>
              {usuario && (
                <a href={`/perfil/${usuario.user_metadata?.username}`} className={styles.sidePerfil}>
                  <div className={styles.sideAvatar}>
                    {usuario.user_metadata?.nombre?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className={styles.sideNombre}>{usuario.user_metadata?.nombre ?? 'Usuario'}</p>
                    <p className={styles.sideUsername}>Ver perfil →</p>
                  </div>
                </a>
              )}
            </div>

            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>Accesos rápidos</h3>
              <div className={styles.sideLinks}>
                <a href="/mi-lista"    className={styles.sideLink}>📋 Mi biblioteca</a>
                <a href="/ranking"     className={styles.sideLink}>🏆 Ranking</a>
                <a href="/comunidades" className={styles.sideLink}>💬 Comunidades</a>
                <a href="/colecciones" className={styles.sideLink}>📚 Colecciones</a>
                <a href="/descubrir"   className={styles.sideLink}>🔍 Descubrir</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
