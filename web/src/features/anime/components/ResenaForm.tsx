import React, { useState } from 'react'
import { Star, StarHalf }    from 'lucide-react'
import { api }             from '../../../lib/axios'
import styles              from './ResenaForm.module.css'

interface ResenaFormProps { animeId: string; onCreada?: () => void }

export const ResenaForm: React.FC<ResenaFormProps> = ({ animeId, onCreada }) => {
  const [calificacion,    setCalificacion]    = useState(0)
  const [hover,           setHover]           = useState(0)
  const [contenido,       setContenido]       = useState('')
  const [contieneSpoiler, setContieneSpoiler] = useState(false)
  const [esPublica,       setEsPublica]       = useState(true)
  const [fechaVisto,      setFechaVisto]      = useState('')
  const [etiquetasStr,    setEtiquetasStr]    = useState('')
  const [enviando,        setEnviando]        = useState(false)
  const [error,           setError]           = useState('')

  const enviar = async () => {
    if (!calificacion) { setError('Selecciona una calificación'); return }
    setEnviando(true); setError('')
    try {
      const etiquetas = etiquetasStr.split(',').map(s => s.trim()).filter(Boolean)
      await api.post('/api/resenas', { 
        animeId, calificacion, contenido, contieneSpoiler, esPublica,
        fechaVisto: fechaVisto || undefined, etiquetas 
      })
      setCalificacion(0); setContenido(''); setEtiquetasStr(''); setFechaVisto(''); onCreada?.()
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al enviar la reseña')
    } finally { setEnviando(false) }
  }

  const displayVal = (hover || calificacion)

  return (
    <div className={styles.form}>
      <div className={styles.headerRow}>
        <h3 className={styles.titulo}>Tu reseña</h3>
        <div className={styles.dateWrap}>
          <label className={styles.metaLabelInline}>¿Cuándo lo viste? (Opcional)</label>
          <input 
            type="date" 
            className={styles.dateInput} 
            value={fechaVisto} 
            onChange={e => setFechaVisto(e.target.value)} 
          />
        </div>
      </div>

      {/* Texto */}
      <div className={styles.textareaWrap}>
        <textarea
          className={styles.textarea}
          placeholder="Escribe una reseña..."
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          maxLength={5000}
          rows={5}
        />
        <p className={styles.contador}>{contenido.length}/5000</p>
      </div>

      <div className={styles.footerRow}>
        <div className={styles.tagsArea}>
          <label className={styles.metaLabelInline}>Etiquetas</label>
          <input 
            type="text" 
            className={styles.tagsInput} 
            placeholder="ej. shonen, obra maestra"
            value={etiquetasStr} 
            onChange={e => setEtiquetasStr(e.target.value)} 
          />
          <span className={styles.tagsHelper}>Para más etiquetas, sepáralas por coma</span>
        </div>
        
        <div className={styles.ratingArea}>
          <div className={styles.ratingHeader}>
            <span className={styles.ratingLabelInline}>Calificación</span>
            <span className={styles.ratingValueInline}>{displayVal ? `${displayVal} de 10` : '0 de 10'}</span>
          </div>
          <div className={styles.starsWrapper}>
            <div className={styles.starsVisual}>
              {Array.from({ length: 5 }).map((_, i) => {
                 const val = (i + 1) * 2;
                 const isFull = displayVal >= val;
                 const isHalf = displayVal === val - 1;
                 if (isFull) return <Star key={i} size={20} className={styles.starIconActiva} fill="currentColor" />
                 if (isHalf) return <StarHalf key={i} size={20} className={styles.starIconActiva} fill="currentColor" />
                 return <Star key={i} size={20} className={styles.starIconInactiva} />
              })}
            </div>
            <div className={styles.starsOverlay}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={styles.invisibleBtn}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setCalificacion(n)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actionsRow}>
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
        <div className={styles.actionsRight}>
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.btn} onClick={enviar} disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar Reseña'}
          </button>
        </div>
      </div>
    </div>
  )
}
