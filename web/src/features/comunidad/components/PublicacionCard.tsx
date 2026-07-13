import React, { useState } from 'react'
import { api } from '../../../lib/axios'
import { useAuth } from '../../../hooks/useAuth'
import styles from './PublicacionCard.module.css'

interface Props { publicacion: any; onComentado?: () => void }

export const PublicacionCard: React.FC<Props> = ({ publicacion, onComentado }) => {
  const { estaAutenticado } = useAuth()
  const [abierto,   setAbierto]   = useState(false)
  const [comentario,setComentario]= useState('')
  const [likes,     setLikes]     = useState(publicacion.totalLikes ?? 0)
  const [liked,     setLiked]     = useState(false)
  const [enviando,  setEnviando]  = useState(false)

  const toggleLike = async () => {
    if (!estaAutenticado) return
    try {
      await api.post(`/api/comunidades/_/publicaciones/${publicacion.id}/like`)
      setLiked(p => !p)
      setLikes((p: number) => liked ? p - 1 : p + 1)
    } catch {}
  }

  const enviarComentario = async () => {
    if (!comentario.trim()) return
    setEnviando(true)
    try {
      await api.post(`/api/comunidades/${publicacion.comunidadId}/publicaciones/${publicacion.id}/comentar`, {
        contenido: comentario
      })
      setComentario('')
      onComentado?.()
    } catch {}
    finally { setEnviando(false) }
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

  return (
    <article className={styles.card}>
      {/* Cabecera */}
      <div className={styles.header}>
        <a href={`/perfil/${publicacion.usuario?.username}`} className={styles.usuario}>
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
            </p>
          </div>
        </a>
      </div>

      {/* Contenido */}
      {publicacion.titulo && <h3 className={styles.titulo}>{publicacion.titulo}</h3>}
      <p className={styles.contenido}>{publicacion.contenido}</p>
      {publicacion.imagenUrl && (
        <img src={publicacion.imagenUrl} alt="" className={styles.imagen} />
      )}

      {/* Acciones */}
      <div className={styles.acciones}>
        <button
          className={`${styles.btnAccion} ${liked ? styles.liked : ''}`}
          onClick={toggleLike}
        >
          <span>♥</span> {likes}
        </button>
        <button
          className={styles.btnAccion}
          onClick={() => setAbierto(p => !p)}
        >
          <span>💬</span> {publicacion.totalComentarios ?? 0}
        </button>
      </div>

      {/* Sección comentarios */}
      {abierto && (
        <div className={styles.comentarios}>
          {/* Comentarios existentes */}
          {(publicacion.comentarios ?? []).map((c: any) => (
            <div key={c.id} className={styles.comentario}>
              <div className={styles.comentAvatar}>
                {c.usuario?.username?.[0]?.toUpperCase()}
              </div>
              <div className={styles.comentCuerpo}>
                <span className={styles.comentNombre}>{c.usuario?.nombreDisplay}</span>
                <p className={styles.comentTexto}>{c.contenido}</p>
              </div>
            </div>
          ))}

          {/* Input nuevo comentario */}
          {estaAutenticado && (
            <div className={styles.comentInput}>
              <textarea
                className={styles.textarea}
                placeholder="Escribe un comentario..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={2}
                maxLength={2000}
              />
              <button
                className={styles.btnEnviar}
                onClick={enviarComentario}
                disabled={!comentario.trim() || enviando}
              >
                {enviando ? '...' : 'Comentar'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
