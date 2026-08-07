import React, { useState } from 'react'
import { api } from '../../../lib/axios'
import { X, Star } from 'lucide-react'
import styles from './ResenaPersonajeModal.module.css'

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
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className={styles.title}>Reseñar a {personaje.nombre}</h2>
        <div className={styles.personajeInfo}>
          {personaje.imagenUrl ? (
            <img src={personaje.imagenUrl} alt={personaje.nombre} className={styles.personajeImg} />
          ) : (
            <div className={styles.personajePlaceholder} />
          )}
          <div className={styles.starsContainer}>
            <p>Calificación</p>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  className={styles.starBtn}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setCalificacion(s)}
                  title={`Dar ${s} estrellas`}
                >
                  <Star
                    size={32}
                    fill={(hover || calificacion) >= s ? '#F5C518' : 'transparent'}
                    color={(hover || calificacion) >= s ? '#F5C518' : '#888'}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <textarea
            placeholder="Escribe tu opinión sobre este personaje..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className={styles.textarea}
            rows={5}
          />
        </div>

        <div className={styles.optionsRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={contieneSpoiler}
              onChange={(e) => setContieneSpoiler(e.target.checked)}
            />
            Contiene spoilers
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Publicando...' : 'Publicar Reseña'}
          </button>
        </div>
      </div>
    </div>
  )
}
