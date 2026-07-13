import React, { useState } from 'react'
import { useParams }          from 'react-router-dom'
import { Layout }             from '../../../components/shared/Layout'
import { ColeccionCard }      from '../components/ColeccionCard'
import { AnimeCard }          from '../../../components/ui/AnimeCard'
import { useColeccionesEditoriales, useColeccionDetalle, useColeccionesUsuario } from '../../../hooks/useColecciones'
import { useAuth }            from '../../../hooks/useAuth'
import { useAuthStore }       from '../../../store/authStore'
import styles                 from './ColeccionesPage.module.css'

// Vista: listado de colecciones
const ListaColecciones: React.FC = () => {
  const { colecciones: editoriales, cargando } = useColeccionesEditoriales()
  const usuario = useAuthStore(s => s.usuario)
  const { colecciones: misColecciones, crear } = useColeccionesUsuario(usuario?.id ?? null)
  const { estaAutenticado } = useAuth()

  const [nuevaTitulo, setNuevaTitulo]   = useState('')
  const [nuevaDesc,   setNuevaDesc]     = useState('')
  const [formulario,  setFormulario]    = useState(false)
  const [creando,     setCreando]       = useState(false)

  const handleCrear = async () => {
    if (!nuevaTitulo.trim()) return
    setCreando(true)
    try {
      await crear(nuevaTitulo, nuevaDesc)
      setNuevaTitulo(''); setNuevaDesc(''); setFormulario(false)
    } finally { setCreando(false) }
  }

  return (
    <div className={styles.listaWrap}>
      {/* Header */}
      <div className={styles.hero}>
        <div>
          <h1 className={styles.titulo}>Colecciones</h1>
          <p className={styles.subtitulo}>Listas curadas de anime — editoriales y de la comunidad</p>
        </div>
        {estaAutenticado && (
          <button className={styles.btnCrear} onClick={() => setFormulario(p => !p)}>
            + Nueva colección
          </button>
        )}
      </div>

      {/* Formulario nueva colección */}
      {formulario && (
        <div className={styles.formNueva}>
          <h3 className={styles.formTitulo}>Crear colección</h3>
          <input
            className={styles.formInput}
            type="text"
            placeholder="Título de la colección"
            value={nuevaTitulo}
            onChange={e => setNuevaTitulo(e.target.value)}
            maxLength={255}
          />
          <textarea
            className={styles.formTextarea}
            placeholder="Descripción (opcional)"
            value={nuevaDesc}
            onChange={e => setNuevaDesc(e.target.value)}
            rows={3}
          />
          <div className={styles.formAcciones}>
            <button className={styles.formCancelar} onClick={() => setFormulario(false)}>Cancelar</button>
            <button
              className={styles.formGuardar}
              onClick={handleCrear}
              disabled={!nuevaTitulo.trim() || creando}
            >
              {creando ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {/* Mis colecciones */}
      {estaAutenticado && misColecciones.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Mis colecciones</h2>
          <div className={styles.grid}>
            {misColecciones.map((c: any) => (
              <ColeccionCard
                key={c.id}
                coleccion={c}
                onClick={() => window.location.href = `/colecciones/${c.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Colecciones editoriales */}
      <section className={styles.seccion}>
        <div className={styles.seccionHeader}>
          <h2 className={styles.seccionTitulo}>
            <span className={styles.editorialIcon}>✦</span> Colecciones editoriales
          </h2>
          <p className={styles.seccionSub}>Curadas por el equipo de Nakama</p>
        </div>

        {cargando ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : editoriales.length === 0 ? (
          <div className={styles.vacio}>
            <p>No hay colecciones editoriales aún.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {editoriales.map((c: any) => (
              <ColeccionCard
                key={c.id}
                coleccion={c}
                onClick={() => window.location.href = `/colecciones/${c.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Vista: detalle de una colección
const DetalleColeccion: React.FC<{ id: string }> = ({ id }) => {
  const { coleccion, cargando } = useColeccionDetalle(id)

  if (cargando) return <div className={styles.cargando}>Cargando colección...</div>
  if (!coleccion) return <div className={styles.cargando}>Colección no encontrada.</div>

  return (
    <div className={styles.detalleWrap}>
      {/* Header */}
      <div className={styles.detalleHeader}>
        {coleccion.esEditorial && (
          <span className={styles.editorialTag}>✦ Colección editorial</span>
        )}
        <h1 className={styles.detalleTitulo}>{coleccion.titulo}</h1>
        {coleccion.descripcion && (
          <p className={styles.detalleDesc}>{coleccion.descripcion}</p>
        )}
        <div className={styles.detalleMeta}>
          <span className={styles.detalleTotal}>{coleccion.totalAnimes} animes</span>
          {coleccion.usuario && (
            <span className={styles.detalleAutor}>
              por{' '}
              <a href={`/perfil/${coleccion.usuario.username}`} className={styles.detalleAutorLink}>
                @{coleccion.usuario.username}
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Grid de animes */}
      {(coleccion.animes ?? []).length === 0 ? (
        <div className={styles.vacio}>
          <p>Esta colección no tiene animes aún.</p>
        </div>
      ) : (
        <div className={styles.animesGrid}>
          {(coleccion.animes ?? [])
            .sort((a: any, b: any) => a.posicion - b.posicion)
            .map((ca: any, index: number) => (
              <div key={ca.animeId ?? index} className={styles.animeItem}>
                {/* Número de posición */}
                <div className={styles.posicion}>
                  <span className={`${styles.num} ${index < 3 ? styles.numTop : ''}`}>{index + 1}</span>
                </div>
                <AnimeCard
                  anilistId={ca.anime?.anilistId}
                  titulo={ca.anime?.titulo}
                  imagenUrl={ca.anime?.imagenUrl}
                  tipo={ca.anime?.tipo}
                  anio={ca.anime?.anio}
                  calificacion={Number(ca.anime?.calificacionPromedio)}
                  onClick={() => window.location.href = `/anime/${ca.anime?.anilistId}`}
                />
                {ca.nota && (
                  <p className={styles.animaNota}>"{ca.nota}"</p>
                )}
              </div>
            ))
          }
        </div>
      )}

      <a href="/colecciones" className={styles.btnVolver}>← Todas las colecciones</a>
    </div>
  )
}

// Página principal
export const ColeccionesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <Layout>
      <div className={styles.wrap}>
        {id ? <DetalleColeccion id={id} /> : <ListaColecciones />}
      </div>
    </Layout>
  )
}
