import React, { useState } from 'react'
import { useParams, Link }           from 'react-router-dom'
import { Layout }              from '../../../components/shared/Layout'
import { PublicacionCard }     from '../components/PublicacionCard'
import { NuevaPublicacion }    from '../components/NuevaPublicacion'
import { CrearComunidadModal } from '../components/CrearComunidadModal'
import { ComunidadMiembrosModal } from '../components/ComunidadMiembrosModal'
import { useComunidades, useComunidadDetalle } from '../../../hooks/useComunidad'
import { useAuth }             from '../../../hooks/useAuth'
import { Users, Calendar, ArrowLeft, MoreVertical, Search }     from 'lucide-react'
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
  const { comunidades, cargando, recargar } = useComunidades(tipo || undefined)
  const { estaAutenticado } = useAuth()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const comunidadesFiltradas = comunidades.filter((c: any) => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (c.descripcion && c.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div className={styles.listaWrap}>
      <div className={styles.premiumHeader}>
        <div className={styles.headerTextGroup}>
          <h1 className={styles.tituloPremium}>Comunidades</h1>
          <p className={styles.subtituloPremium}>Descubre teorías, fanarts y comparte tu pasión con otros fans.</p>
        </div>
        {estaAutenticado && (
          <button className={styles.btnCrearPremium} onClick={() => setModalAbierto(true)}>
            <Users size={16} /> Crear nueva comunidad
          </button>
        )}
      </div>

      {modalAbierto && (
        <CrearComunidadModal 
          onClose={() => setModalAbierto(false)} 
          onCreated={() => {
            recargar()
          }}
        />
      )}

      {/* Filtro de tipo */}
      <div className={styles.filtros}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
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
        <div style={{ position: 'relative', minWidth: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-texto-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar comunidad..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}
          />
        </div>
      </div>

      {/* Grid de comunidades */}
      {cargando ? (
        <div className={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : comunidadesFiltradas.length === 0 ? (
        <div className={styles.vacio}>
          <p>No se encontraron comunidades.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {comunidadesFiltradas.map((c: any) => (
            <Link key={c.id} to={`/comunidades/${c.id}`} className={styles.comunidadCard}>
              <div className={styles.cardBanner}>
                {c.bannerUrl
                  ? <img src={c.bannerUrl} alt="" />
                  : <div className={styles.cardBannerDefault} />
                }
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardNombre}>{c.nombre}</h3>
                <div className={styles.cardMeta}>
                  <span className={styles.cardMiembros}>
                    <Users size={14} style={{marginRight: 4}} /> {c.totalMiembros} miembros
                  </span>
                </div>
                {c.descripcion && (
                  <p className={styles.cardDesc}>{c.descripcion}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Vista: detalle de una comunidad
const DetalleComunidad: React.FC<{ id: string }> = ({ id }) => {
  const [seccion, setSeccion] = useState<string>('')
  const { comunidad, publicaciones, miembros, cargando, publicar, unirse, salir, votar, expulsar, cambiarRol, eliminarPublicacion } = useComunidadDetalle(id, seccion)
  const { usuario, estaAutenticado } = useAuth()
  const [modalMiembrosAbierto, setModalMiembrosAbierto] = useState(false)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false)
  const [menuOpcionesAbierto, setMenuOpcionesAbierto] = useState(false)
  
  const miRol = miembros.find((m: any) => m.usuario.id === usuario?.id)?.rol || null
  const esMiembro = miRol !== null

  const handleUnirse = async () => {
    await unirse()
  }

  const handleSalir = async () => {
    await salir()
  }

  if (cargando && !comunidad) return (
    <div className={styles.detalleWrap}>
      <div className={styles.detalleBanner} style={{ background: 'var(--color-surface-2)', animation: 'pulse 1.5s infinite', marginTop: 'var(--space-8)' }} />
      <div className={styles.detalleHeader}>
        <div className={styles.detalleAvatar} style={{ background: 'var(--color-surface-3)', animation: 'pulse 1.5s infinite', border: '4px solid var(--color-bg)' }} />
        <div className={styles.detalleInfo}>
          <div style={{ height: 40, width: '40%', background: 'var(--color-surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 20, width: '20%', background: 'var(--color-surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite', marginTop: 8 }} />
          <div style={{ height: 60, width: '70%', background: 'var(--color-surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite', marginTop: 16 }} />
        </div>
      </div>
      <div className={styles.detalleLayout}>
        <div className={styles.publicacionesCol}>
          <div style={{ height: 120, background: 'var(--color-surface-2)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 200, background: 'var(--color-surface-2)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        </div>
        <div className={styles.detalleSidebar}>
          <div style={{ height: 200, background: 'var(--color-surface-2)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    </div>
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
            <div className={styles.detalleTopLeft}>
              <h1 className={styles.detalleNombre}>{comunidad.nombre}</h1>
              <div className={styles.detalleMeta}>
                {comunidad.referenciaTipo && comunidad.oficial && (
                  <span className={styles.oficial}>Oficial</span>
                )}
                {comunidad.referenciaTipo && !comunidad.oficial && (
                  <span className={styles.detalleTipo}>{comunidad.referenciaTipo}</span>
                )}
                <span 
                  className={styles.clickableMiembros} 
                  onClick={() => setModalMiembrosAbierto(true)}
                  title="Ver miembros"
                >
                  <Users size={14} style={{marginRight: 6}} /> {Math.max(0, comunidad.totalMiembros)} miembros
                </span>
              </div>
            </div>
            
            <div className={styles.detalleTopRight}>
              {!esMiembro && estaAutenticado && (
                <button className={styles.btnUnirse} onClick={handleUnirse}>Unirse</button>
              )}
              {estaAutenticado && (
                <div style={{ position: 'relative' }}>
                  <button 
                    className={styles.btnOpciones} 
                    onClick={() => setMenuOpcionesAbierto(!menuOpcionesAbierto)}
                    title="Opciones de comunidad"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {menuOpcionesAbierto && (
                    <div className={styles.opcionesMenu}>
                      {comunidad.creadoPor === usuario?.id && (
                        <button onClick={() => { setModalEditarAbierto(true); setMenuOpcionesAbierto(false); }}>
                          Editar comunidad
                        </button>
                      )}
                      {esMiembro && (
                        <button onClick={() => { handleSalir(); setMenuOpcionesAbierto(false); }} style={{ color: '#ff4757' }}>
                          Salir de la comunidad
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {comunidad.descripcion && (
            <p className={styles.detalleDesc} style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
              {comunidad.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Layout: publicaciones + sidebar */}
      <div className={styles.detalleLayout}>
        <div className={styles.publicacionesCol}>
          {/* Tabs de Secciones */}
          <div className={styles.seccionesTabs}>
            {[{id: '', label: 'Todos'}, {id: 'Debate', label: 'Debates'}, {id: 'Teoría', label: 'Teorías'}, {id: 'Fanart', label: 'Fanarts'}].map(tab => (
              <button 
                key={tab.label}
                className={`${styles.seccionTab} ${seccion === tab.id ? styles.seccionTabActiva : ''}`}
                onClick={() => setSeccion(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Formulario nueva publicación */}
          {estaAutenticado && (
            <NuevaPublicacion key={seccion} onPublicar={publicar as any} usuarioAvatar={usuario?.avatarUrl || undefined} seccionActiva={seccion} />
          )}

          {/* Lista de publicaciones */}
          <div style={{ opacity: cargando ? 0.5 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {publicaciones.length === 0 ? (
              <div className={styles.vacio}>
                <p>No hay publicaciones aún.</p>
                {estaAutenticado && (
                  <p className={styles.vacioSub}>¡Sé el primero en publicar!</p>
                )}
              </div>
            ) : (
              publicaciones.map((p: any) => (
                <PublicacionCard 
                  key={p.id} 
                  publicacion={p} 
                  onVotar={votar} 
                  miRol={miRol}
                  onEliminar={eliminarPublicacion}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar info comunidad */}
        <aside className={styles.detalleSidebar}>
          <div className={styles.sideCard}>
            <h3 className={styles.sideTitle}>Acerca de</h3>
            <p className={styles.sideTexto}>{comunidad.descripcion ?? 'Sin descripción.'}</p>
            <button 
              className={styles.sideStat}
              style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px dashed var(--color-borde-suave)', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => setModalMiembrosAbierto(true)}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              title="Ver todos los miembros"
            >
              <span style={{ display: 'flex', alignItems: 'center' }}><Users size={14} style={{marginRight: 6}} /> Miembros</span>
              <strong>{Math.max(0, comunidad.totalMiembros)}</strong>
            </button>
            <div className={styles.sideStat} style={{ marginTop: 'var(--space-3)' }}>
              <span><Calendar size={14} style={{marginRight: 6}} /> Creada</span>
              <strong>
                {new Date(comunidad.creadoEn).toLocaleDateString('es-DO', {
                  year: 'numeric', month: 'long'
                })}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      <ComunidadMiembrosModal 
        isOpen={modalMiembrosAbierto} 
        onClose={() => setModalMiembrosAbierto(false)} 
        miembros={miembros} 
        miRol={miRol} 
        onExpulsar={expulsar} 
        onCambiarRol={cambiarRol} 
      />

      {modalEditarAbierto && (
        <CrearComunidadModal 
          comunidadToEdit={comunidad}
          onClose={() => setModalEditarAbierto(false)} 
          onCreated={() => window.location.reload()}
        />
      )}
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
