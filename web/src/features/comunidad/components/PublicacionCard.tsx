import React, { useState, useRef, useEffect } from 'react'
import { api } from '../../../lib/axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { MoreHorizontal, Flag, Pencil, AlertTriangle } from 'lucide-react'
import { FeedItemInteractions } from '../../feed/components/FeedItemInteractions'
import styles from './PublicacionCard.module.css'

interface Props { 
  publicacion: any; 
  onComentado?: () => void; 
  onVotar?: (opcionId: string) => void;
  miRol?: 'admin' | 'moderador' | 'miembro' | null;
  onEliminar?: (pubId: string) => void;
}

export const PublicacionCard: React.FC<Props> = ({ publicacion, onComentado, onVotar, miRol, onEliminar }) => {
  const { estaAutenticado, usuario } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [editando,    setEditando]    = useState(false)
  const [editTexto,   setEditTexto]   = useState(publicacion.contenido ?? '')
  const [spoilerAceptado, setSpoilerAceptado] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const guardarEdicion = async () => {
    if (!editTexto.trim() || editTexto === publicacion.contenido) {
      setEditando(false)
      return
    }
    try {
      await api.put(`/comunidades/publicaciones/${publicacion.id}`, { contenido: editTexto })
      publicacion.contenido = editTexto
      setEditando(false)
    } catch (err) {
      console.error(err)
      alert('Error al guardar edición')
    }
  }

  const reportar = async (tipo: 'publicacion' | 'comentario', id: string) => {
    if (!window.confirm(`¿Estás seguro de reportar este ${tipo} como inapropiado?`)) return
    try {
      await api.post('/api/reportes', { tipo, referenciaId: id })
      alert('Reporte enviado a los moderadores. Gracias por mantener la comunidad segura.')
    } catch (err) {
      alert('Ocurrió un error al enviar el reporte.')
    }
  }

  const tiempoRelativo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60)   return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)    return `hace ${hrs}h`
    const dias = Math.floor(hrs / 24)
    if (dias < 30)   return `hace ${dias}d`
    return new Date(fecha).toLocaleDateString('es-DO', { month: 'short', day: 'numeric' })
  }

  const renderOpcionesEncuesta = () => {
    if (!publicacion.opciones) return null
    
    // Check if current user voted
    const votedOption = publicacion.opciones.find((o: any) => o.votosUsuarios?.some((v: any) => v.usuarioId === usuario?.id))
    const totalVotos = publicacion.opciones.reduce((acc: number, o: any) => acc + (o.votos ?? 0), 0)

    return (
      <div className={styles.encuestaContainer}>
        {publicacion.opciones.map((o: any) => {
          const isVoted = votedOption?.id === o.id
          const percentage = totalVotos > 0 ? Math.round(((o.votos ?? 0) / totalVotos) * 100) : 0
          
          return (
            <button 
              key={o.id} 
              className={`${styles.encuestaOpcion} ${isVoted ? styles.voted : ''} ${votedOption ? styles.disabledOpcion : ''}`}
              onClick={() => {
                if (!votedOption && onVotar) onVotar(o.id)
              }}
              disabled={!!votedOption || !estaAutenticado}
            >
              {votedOption && <div className={styles.encuestaBar} style={{ width: `${percentage}%` }} />}
              <div className={styles.encuestaContent}>
                {o.imagenUrl && <img src={o.imagenUrl} alt="" className={styles.opcionImagen} />}
                <span className={styles.encuestaText}>{o.texto}</span>
              </div>
              {votedOption && <span className={styles.encuestaPercent}>{percentage}%</span>}
            </button>

          )
        })}
        <div className={styles.encuestaTotal}>{totalVotos} votos</div>
      </div>
    )
  }

  return (
    <article className={styles.card}>
      {/* Cabecera */}
      <div className={styles.header}>
        <Link to={`/perfil/${publicacion.usuario?.username}`} className={styles.usuario}>
          <div className={styles.avatar}>
            {publicacion.usuario?.avatarUrl
              ? <img src={publicacion.usuario.avatarUrl} alt="" />
              : <span>{publicacion.usuario?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div>
            <p className={styles.nombre}>{publicacion.usuario?.nombreDisplay}</p>
            <p className={styles.meta}>
              @{publicacion.usuario?.username} · {tiempoRelativo(publicacion.creadoEn)}
              {publicacion.comunidad && (
                <>
                  {' '}en{' '}
                  <Link 
                    to={`/comunidades/${publicacion.comunidadId}`} 
                    className={styles.metaComunidad}
                    onClick={e => e.stopPropagation()}
                  >
                    {publicacion.comunidad.nombre}
                  </Link>
                </>
              )}
            </p>
          </div>
        </Link>

        {estaAutenticado && (
          <div ref={menuRef} className={styles.menuWrap}>
            <button
              className={styles.btnAccion}
              onClick={() => setMenuAbierto(p => !p)}
              title="Más opciones"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuAbierto && (
              <div className={styles.dropdown}>
                {publicacion.usuario?.id === usuario?.id && (
                  <button className={styles.dropdownItem} onClick={() => { setEditando(true); setMenuAbierto(false) }}>
                    <Pencil size={14} /> Editar
                  </button>
                )}
                {(publicacion.usuario?.id === usuario?.id || miRol === 'admin' || miRol === 'moderador') && (
                  <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => { setMenuAbierto(false); if(window.confirm('¿Seguro?')) { if (onEliminar) onEliminar(publicacion.id); else api.delete(`/api/feed/${publicacion.tipo === 'resena' ? 'resena' : 'publicacion'}/${publicacion.id}`).then(() => window.location.reload()) } }}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
                {publicacion.usuario?.id !== usuario?.id && (
                  <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => { setMenuAbierto(false); reportar('publicacion', publicacion.id) }}>
                    <Flag size={14} /> Denunciar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenido */}
      {publicacion.titulo && <h3 className={styles.titulo}>{publicacion.titulo}</h3>}
      {editando ? (
        <div className={styles.editarWrap}>
          <textarea 
            className={styles.editarInput} 
            value={editTexto} 
            onChange={(e) => setEditTexto(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className={styles.editarActions}>
            <button className={styles.btnCancelar} onClick={() => { setEditando(false); setEditTexto(publicacion.contenido ?? '') }}>Cancelar</button>
            <button className={styles.btnGuardar} onClick={guardarEdicion}>Guardar</button>
          </div>
        </div>
      ) : (
        publicacion.tipo === 'resena' && publicacion.resena?.contieneSpoiler && !spoilerAceptado ? (
          <div className={styles.spoilerWarning}>
            <AlertTriangle size={24} />
            <p style={{ margin: 0 }}>¡Alerta de Spoiler!</p>
            <button className={styles.btnVerSpoiler} onClick={() => setSpoilerAceptado(true)}>Mostrar reseña</button>
          </div>
        ) : (
          publicacion.contenido && <p className={styles.contenido}>{publicacion.contenido}</p>
        )
      )}
      
      {publicacion.imagenUrl && (
        <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden' }}>
          <img src={publicacion.imagenUrl} alt="" className={styles.imagen} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
        </div>
      )}

      {publicacion.tipo === 'encuesta' && renderOpcionesEncuesta()}
      
      {publicacion.tipo === 'resena' && publicacion.resena && (
        <div className={styles.resenaBox}>
          {publicacion.resena.anime && (
            <div className={styles.resenaAnimeInfo}>
              <img src={publicacion.resena.anime.imagenUrl} alt="" className={styles.resenaImg} />
              <h4>{publicacion.resena.anime.titulo}</h4>
            </div>
          )}
          <div className={styles.resenaEstrellas}>★ {publicacion.resena.calificacion} / 10</div>
        </div>
      )}

      {/* Acciones y Comentarios integrados */}
      <FeedItemInteractions 
        tipo={publicacion.tipo === 'resena' ? 'resena' : 'publicacion'}
        itemId={publicacion.id}
        initialLikes={publicacion.totalLikes ?? 0}
        initialCommentsCount={publicacion.totalComentarios ?? 0}
        initialComments={publicacion.comentarios}
        initialHasLiked={publicacion.hasLiked ?? false}
        isOwner={publicacion.usuario?.id === usuario?.id || miRol === 'admin' || miRol === 'moderador'}
        onDeleted={onEliminar || (() => {})}
      />
    </article>
  )
}
