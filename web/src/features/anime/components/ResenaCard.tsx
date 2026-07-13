import React, { useState } from 'react'
import { api }             from '../../../lib/axios'
import styles              from './ResenaCard.module.css'

interface ResenaCardProps { resena: any }

export const ResenaCard: React.FC<ResenaCardProps> = ({ resena }) => {
  const [likes,   setLikes]   = useState<number>(resena.totalLikes ?? 0)
  const [liked,   setLiked]   = useState(false)
  const [spoiler, setSpoiler] = useState(false)

  const toggleLike = async () => {
    try {
      await api.post(`/api/resenas/${resena.id}/like`)
      setLiked(prev => !prev)
      setLikes(prev => liked ? prev - 1 : prev + 1)
    } catch {}
  }

  const estrellas = Math.round((resena.calificacion / 10) * 5)

  return (
    <article className={styles.card}>
      {/* Cabecera */}
      <div className={styles.header}>
        <a href={`/perfil/${resena.usuario?.username}`} className={styles.usuario}>
          <div className={styles.avatar}>
            {resena.usuario?.avatarUrl
              ? <img src={resena.usuario.avatarUrl} alt={resena.usuario.username} />
              : <span>{resena.usuario?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div>
            <p className={styles.nombre}>{resena.usuario?.nombreDisplay}</p>
            <p className={styles.username}>@{resena.usuario?.username}</p>
          </div>
        </a>

        {/* Rating estilo Letterboxd */}
        <div className={styles.rating}>
          <span className={styles.estrellas}>
            {'★'.repeat(estrellas)}{'☆'.repeat(5 - estrellas)}
          </span>
          <span className={styles.numero}>{resena.calificacion}/10</span>
        </div>
      </div>

      {/* Contenido */}
      {resena.contenido && (
        <div className={styles.cuerpo}>
          {resena.contieneSpoiler && !spoiler ? (
            <div className={styles.spoilerWrap}>
              <p className={styles.spoilerAviso}>⚠ Esta reseña contiene spoilers</p>
              <button className={styles.spoilerBtn} onClick={() => setSpoiler(true)}>
                Mostrar de todas formas
              </button>
            </div>
          ) : (
            <p className={styles.texto}>{resena.contenido}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.fecha}>
          {new Date(resena.creadoEn).toLocaleDateString('es-DO', {
            year: 'numeric', month: 'short', day: 'numeric'
          })}
        </span>
        {resena.editadoEn && <span className={styles.editado}>(editado)</span>}
        <button
          className={`${styles.btnLike} ${liked ? styles.liked : ''}`}
          onClick={toggleLike}
        >
          ♥ {likes}
        </button>
      </div>
    </article>
  )
}
