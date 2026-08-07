import React, { useState } from 'react'
import { api } from '../../../lib/axios'
import { X } from 'lucide-react'
import styles from './ReviewModal.module.css'

interface ResenaPersonajeModalProps {
  personaje: any
  animeId: string
  onClose: () => void
  onSaved: (resena: any) => void
}

export const ResenaPersonajeModal: React.FC<ResenaPersonajeModalProps> = ({
  personaje,
  animeId,
  onClose,
  onSaved,
}) => {
  const [calificacion, setCalificacion] = useState(0)
  const [hover, setHover] = useState(0)
  const [contenido, setContenido] = useState('')
  const [contieneSpoiler, setContieneSpoiler] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayVal = hover || calificacion

  const handleSave = async () => {
    if (calificacion === 0) {
      setError('Por favor, selecciona una calificación.')
      return
    }
    if (contenido.trim().length < 10) {
      setError('La reseña debe tener al menos 10 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      const { data } = await api.post(`/resenas/personaje/${personaje.id}`, {
        animeId,
        calificacion,
        contenido,
        contieneSpoiler,
      })
      onSaved(data)
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Ocurrió un error al guardar la reseña.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.tabs}>
            <button className={`${styles.tabBtn} ${styles.tabActivo}`}>Reseñar a {personaje.nombre}</button>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>

        <div className={styles.composeBody}>
          <div className={styles.composeLayout}>
            <div className={styles.posterCol}>
              <img src={personaje.imagenUrl} alt="Personaje" className={styles.poster} />
              <div className={styles.spoilerBlock} style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#cdd', fontSize: '11px', fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    checked={contieneSpoiler} 
                    onChange={(e) => setContieneSpoiler(e.target.checked)} 
                    style={{ width: '13px', height: '13px', cursor: 'pointer' }}
                  />
                  ¿Contiene spoilers?
                </label>
              </div>
            </div>
            
            <div className={styles.formCol}>
              <div className={styles.animeTitleBlock}>
                <h3 className={styles.animeTitle}>{personaje.nombre}</h3>
              </div>

              {error && <div className={styles.error} style={{ color: '#ef4444', fontSize: '13px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>{error}</div>}

              <textarea
                className={styles.textarea}
                placeholder={`Escribe tu opinión sobre ${personaje.nombre.split(' ')[0]}...`}
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                rows={6}
              />

              <div className={styles.metaRow}>
                <div className={styles.tagsBlock} style={{ display: 'none' }}></div>
                
                <div className={styles.ratingBlock}>
                  <label>Calificación <span>{calificacion || 0} de 10</span></label>
                  <div className={styles.stars}>
                    {Array.from({ length: 5 }, (_, i) => i + 1).map(starIndex => {
                      const leftVal = starIndex * 2 - 1
                      const rightVal = starIndex * 2
                      const isFull = displayVal >= rightVal
                      const isHalf = displayVal === leftVal
                      
                      return (
                        <div key={starIndex} className={styles.starWrapper}>
                          <div 
                            className={`${styles.starClickArea} ${styles.leftHalf}`}
                            onMouseEnter={() => setHover(leftVal)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setCalificacion(leftVal)}
                          />
                          <div 
                            className={`${styles.starClickArea} ${styles.rightHalf}`}
                            onMouseEnter={() => setHover(rightVal)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setCalificacion(rightVal)}
                          />
                          <div className={`${styles.starIcon} ${isFull ? styles.starFull : isHalf ? styles.starHalf : styles.starEmpty}`}>
                            ★
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publicando...' : 'Publicar Reseña'}
          </button>
        </div>
      </div>
    </div>
  )
}
