import React, { useState } from 'react'
import { api }             from '../../../lib/axios'
import styles              from './ResenaForm.module.css'

interface ResenaFormProps { animeId: string; onCreada?: () => void }

export const ResenaForm: React.FC<ResenaFormProps> = ({ animeId, onCreada }) => {
  const [calificacion,    setCalificacion]    = useState(0)
  const [hover,           setHover]           = useState(0)
  const [contenido,       setContenido]       = useState('')
  const [contieneSpoiler, setContieneSpoiler] = useState(false)
  const [esPublica,       setEsPublica]       = useState(true)
  const [enviando,        setEnviando]        = useState(false)
  const [error,           setError]           = useState('')

  const enviar = async () => {
    if (!calificacion) { setError('Selecciona una calificación'); return }
    setEnviando(true); setError('')
    try {
      await api.post('/api/resenas', { animeId, calificacion, contenido, contieneSpoiler, esPublica })
      setCalificacion(0); setContenido(''); onCreada?.()
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al enviar la reseña')
    } finally { setEnviando(false) }
  }

  const displayVal = (hover || calificacion)

  return (
    <div className={styles.form}>
      <h3 className={styles.titulo}>Tu reseña</h3>

      {/* Calificación numérica con hover */}
      <div className={styles.ratingWrap}>
        <p className={styles.ratingLabel}>
          {displayVal ? `${displayVal}/10` : 'Califica este anime'}
        </p>
        <div className={styles.stars}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`${styles.star} ${n <= displayVal ? styles.starActiva : ''}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setCalificacion(n)}
            >
              {n <= displayVal ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Texto */}
      <textarea
        className={styles.textarea}
        placeholder="Escribe tu reseña (opcional)..."
        value={contenido}
        onChange={e => setContenido(e.target.value)}
        maxLength={5000}
        rows={5}
      />
      <p className={styles.contador}>{contenido.length}/5000</p>

      {/* Opciones */}
      <div className={styles.opciones}>
        <label className={styles.check}>
          <input type="checkbox" checked={contieneSpoiler} onChange={e => setContieneSpoiler(e.target.checked)} />
          Contiene spoilers
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={esPublica} onChange={e => setEsPublica(e.target.checked)} />
          Reseña pública
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.btn} onClick={enviar} disabled={enviando}>
        {enviando ? 'Publicando...' : 'Publicar reseña'}
      </button>
    </div>
  )
}
