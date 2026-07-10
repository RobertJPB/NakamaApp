import React, { useState } from 'react'
import { useParams }           from 'react-router-dom'
import { Layout }              from '../../../components/shared/Layout'
import { PublicacionCard }     from '../components/PublicacionCard'
import { NuevaPublicacion }    from '../components/NuevaPublicacion'
import { useComunidades, useComunidadDetalle } from '../../../hooks/useComunidad'
import { useAuth }             from '../../../hooks/useAuth'
import styles                  from './ComunidadPage.module.css'

const TIPOS = [
  { valor: '',         label: 'Todas' },
  { valor: 'anime',    label: 'Anime' },
  { valor: 'genero',   label: 'Género' },
  { valor: 'temporada',label: 'Temporada' },
]

// Vista: listado de comunidades
const ListaComunidades: React.FC = () => {
  const [tipo, setTipo] = useState('')
  const { comunidades, cargando } = useComunidades(tipo || undefined)

  return (
    <div className={styles.listaWrap}>
      <div className={styles.listaHeader}>
        <div>
          <h1 className={styles.titulo}>Comunidades</h1>
          <p className={styles.subtitulo}>Únete a conversaciones sobre tus animes favoritos</p>
        </div>
      </div>

      {/* Filtro de tipo */}
      <div className={styles.filtros}>
        {TIPOS.map(t => (
          <button
            key={t.valor}
            className={`${styles.filtro} ${tipo === t.valor ? styles.filtroActivo : ''}`}
            onClick={() => setTipo(t.valor)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid de comunidades */}
      {cargando ? (
        <div className={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : comunidades.length === 0 ? (
        <div className={styles.vacio}>
          <p>No hay comunidades disponibles aún.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {comunidades.map((c: any) => (
            <a key={c.id} href={`/comunidades/${c.id}`} className={styles.comunidadCard}>
              <div className={styles.cardBanner}>
                {c.bannerUrl
                  ? <img src={c.bannerUrl} alt="" />
                  : <div className={styles.cardBannerDefault} />
                }
                <div className={styles.cardBannerOverlay} />
                {c.imagenUrl && (
                  <div className={styles.cardAvatar}>
                    <img src={c.imagenUrl} alt={c.nombre} />
                  </div>
                )}
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardNombre}>{c.nombre}</h3>
                {c.descripcion && (
                  <p className={styles.cardDesc}>{c.descripcion}</p>
                )}
                <div className={styles.cardMeta}>
                  <span className={styles.cardTipo}>{c.tipo}</span>
                  <span className={styles.cardMiembros}>
                    👥 {c.totalMiembros} miembros
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// Vista: detalle de una comunidad
const DetalleComunidad: React.FC<{ id: string }> = ({ id }) => {
  const { comunidad, publicaciones, cargando, publicar, unirse, salir } = useComunidadDetalle(id)
  const { estaAutenticado } = useAuth()
  const [miembro, setMiembro] = useState(false)

  const handleUnirse = async () => {
    await unirse()
    setMiembro(true)
  }

  const handleSalir = async () => {
    await salir()
    setMiembro(false)
  }

  if (cargando) return (
    <div className={styles.cargando}>Cargando comunidad...</div>
  )
  if (!comunidad) return (
    <div className={styles.cargando}>Comunidad no encontrada.</div>
  )

  return (
    <div className={styles.detalleWrap}>
      {/* Banner de comunidad */}
      <div className={styles.detalleBanner}>
        {comunidad.bannerUrl
          ? <img src={comunidad.bannerUrl} alt="" className={styles.bannerImg} />
          : <div className={styles.bannerDefault} />
        }
        <div className={styles.bannerOverlay} />
      </div>

      {/* Header */}
      <div className={styles.detalleHeader}>
        {comunidad.imagenUrl && (
          <div className={styles.detalleAvatar}>
            <img src={comunidad.imagenUrl} alt={comunidad.nombre} />
          </div>
        )}
        <div className={styles.detalleInfo}>
          <div className={styles.detalleTop}>
            <div>
              <h1 className={styles.detalleNombre}>{comunidad.nombre}</h1>
              <p className={styles.detalleMeta}>
                <span className={styles.detalleTipo}>{comunidad.tipo}</span>
                <span>·</span>
                <span>👥 {comunidad.totalMiembros} miembros</span>
                {comunidad.esOficial && <span className={styles.oficial}>✓ Oficial</span>}
              </p>
            </div>
            {estaAutenticado && (
              miembro
                ? <button className={styles.btnSalir} onClick={handleSalir}>Salir</button>
                : <button className={styles.btnUnirse} onClick={handleUnirse}>+ Unirse</button>
            )}
          </div>
          {comunidad.descripcion && (
            <p className={styles.detalleDesc}>{comunidad.descripcion}</p>
          )}
        </div>
      </div>

      {/* Layout: publicaciones + sidebar */}
      <div className={styles.detalleLayout}>
        <div className={styles.publicacionesCol}>
          {/* Formulario nueva publicación */}
          {estaAutenticado && (
            <NuevaPublicacion onPublicar={publicar} />
          )}

          {/* Lista de publicaciones */}
          {publicaciones.length === 0 ? (
            <div className={styles.vacio}>
              <p>No hay publicaciones aún.</p>
              {estaAutenticado && (
                <p className={styles.vacioSub}>¡Sé el primero en publicar!</p>
              )}
            </div>
          ) : (
            publicaciones.map((p: any) => (
              <PublicacionCard key={p.id} publicacion={p} />
            ))
          )}
        </div>

        {/* Sidebar info comunidad */}
        <aside className={styles.detalleSidebar}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Acerca de</h3>
            <p className={styles.sideTexto}>{comunidad.descripcion ?? 'Sin descripción.'}</p>
            <div className={styles.sideStat}>
              <span>👥 Miembros</span>
              <strong>{comunidad.totalMiembros}</strong>
            </div>
            <div className={styles.sideStat}>
              <span>📅 Creada</span>
              <strong>
                {new Date(comunidad.creadoEn).toLocaleDateString('es-DO', {
                  year: 'numeric', month: 'long'
                })}
              </strong>
            </div>
          </div>
          <a href="/comunidades" className={styles.btnVolver}>← Todas las comunidades</a>
        </aside>
      </div>
    </div>
  )
}

// Página principal: decide qué vista mostrar
export const ComunidadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <Layout>
      <div className={styles.wrap}>
        {id ? <DetalleComunidad id={id} /> : <ListaComunidades />}
      </div>
    </Layout>
  )
}
