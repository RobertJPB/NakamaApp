import React, { useState } from 'react'
import { api }             from '../../../lib/axios'
import styles              from './ResenaCard.module.css'
import { Star, StarHalf }  from 'lucide-react'
import { Link }            from 'react-router-dom'

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
    <article className={styles.entrada}>
      <div className={styles.entradaAvatarWrap}>
        <div className={styles.entradaAvatar}>
          {resena.usuario?.avatarUrl
            ? <img src={resena.usuario.avatarUrl} alt={resena.usuario.username} />
            : <span>{resena.usuario?.username?.[0]?.toUpperCase()}</span>
          }
        </div>
        {resena.usuario?.marcoUrl && (
          <img src={resena.usuario.marcoUrl} alt="Marco" className={styles.marcoOverlay} />
        )}
      </div>

      <div className={styles.entradaContenido}>
        <div className={styles.entradaHeaderWrap}>
          <p className={styles.entradaTexto}>
            <Link to={`/perfil/${resena.usuario?.username}`} className={styles.entradaUsuario}>
              @{resena.usuario?.username}
            </Link>
            {' '}<span className={styles.entradaAccion}>dejó una reseña de</span>{' '}
            {resena.anime && (
              <Link to={`/anime/${resena.anime.externalId}`} className={styles.entradaAnime}>
                {resena.anime.titulo}
              </Link>
            )}
          </p>
        </div>

        {resena.contenido && (
          <div className={styles.entradaDetalle}>
            {resena.contieneSpoiler && !spoiler ? (
              <div className={styles.spoilerWrap}>
                <p className={styles.spoilerAviso}>⚠ Esta reseña contiene spoilers</p>
                <button className={styles.spoilerBtn} onClick={() => setSpoiler(true)}>
                  Mostrar de todas formas
                </button>
              </div>
            ) : (
              <p className={styles.entradaResena}>{resena.contenido}</p>
            )}
          </div>
        )}

        <div className={styles.entradaMeta}>
          {resena.etiquetas && resena.etiquetas.length > 0 && (
            <div className={styles.etiquetas}>
              {resena.etiquetas.map((t: string) => <span key={t} className={styles.etiqueta}>{t}</span>)}
            </div>
          )}
          <p className={styles.entradaFecha} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Publicado el {new Date(resena.creadoEn).toLocaleDateString('es-DO', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}</span>
            {resena.editadoEn && <span className={styles.editado}> (editado)</span>}
            {resena.fechaVisto && (
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                color: 'var(--color-texto-suave)',
                fontSize: '11px',
                border: '1px solid var(--color-borde-suave)'
              }}>
                Visto en: {new Date(resena.fechaVisto).toLocaleDateString('es-DO')}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className={styles.entradaMedia}>
        {resena.anime?.imagenUrl && (
          <Link to={`/anime/${resena.anime?.externalId}`} className={styles.entradaThumb}>
            <img src={resena.anime.imagenUrl} alt={resena.anime.titulo} />
          </Link>
        )}
        <div className={styles.entradaRatingBox} style={{ marginTop: '8px', justifyContent: 'center' }}>
          <span className={styles.entradaEstrellas} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const val = (resena.calificacion / 10) * 5
              if (val >= i + 1) return <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
              if (val >= i + 0.5) return <StarHalf key={i} size={14} fill="currentColor" strokeWidth={0} />
              return <Star key={i} size={14} fill="#4b5563" strokeWidth={0} /> // Empty star color
            })}
          </span>
          <span className={styles.entradaCalificacion}>{resena.calificacion}/10</span>
        </div>
      </div>
    </article>
  )
}
