import React, { useState, useEffect, useRef } from 'react'
import { Search, Star, X } from 'lucide-react'
import { api } from '../../../lib/axios'
import styles from './ReviewComposer.module.css'

export const ReviewComposer: React.FC<{ onReviewPosted?: (review: any) => void }> = ({ onReviewPosted }) => {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [animeSeleccionado, setAnimeSeleccionado] = useState<any>(null)
  
  const [calificacion, setCalificacion] = useState(0)
  const [hoverCalif, setHoverCalif] = useState(0)
  const [contenido, setContenido] = useState('')
  const [spoiler, setSpoiler] = useState(false)
  
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 3) {
      setResultados([])
      return
    }
    const timer = setTimeout(() => {
      setBuscando(true)
      api.get(`/api/animes?search=${query}&limit=5`)
        .then(res => setResultados(res.data))
        .catch(() => {})
        .finally(() => setBuscando(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResultados([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async () => {
    if (!animeSeleccionado || calificacion === 0) return
    setEnviando(true)
    try {
      const res = await api.post('/api/resenas', {
        animeId: animeSeleccionado.id ?? animeSeleccionado.anilistId.toString(),
        calificacion,
        contenido,
        contieneSpoiler: spoiler,
        esPublica: true
      })
      if (onReviewPosted) onReviewPosted(res.data)
      
      // Reset form
      setAnimeSeleccionado(null)
      setQuery('')
      setCalificacion(0)
      setContenido('')
      setSpoiler(false)
    } catch (err) {
      console.error(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.composerCard}>
      <h3 className={styles.title}>Escribir una reseña</h3>
      
      {!animeSeleccionado ? (
        <div className={styles.searchWrapper} ref={dropdownRef}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Buscar anime para reseñar..." 
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {buscando && <div className={styles.spinner}></div>}
          
          {resultados.length > 0 && (
            <div className={styles.dropdown}>
              {resultados.map(anime => (
                <button 
                  key={anime.anilistId} 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setAnimeSeleccionado(anime)
                    setResultados([])
                    setQuery('')
                  }}
                >
                  <img src={anime.imagenUrl} alt={anime.titulo} className={styles.dropdownThumb} />
                  <div className={styles.dropdownInfo}>
                    <p className={styles.dropdownTitle}>{anime.titulo}</p>
                    <p className={styles.dropdownYear}>{anime.anio || 'TBA'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.selectedAnime}>
          <img src={animeSeleccionado.imagenUrl} alt={animeSeleccionado.titulo} className={styles.selectedThumb} />
          <div className={styles.selectedInfo}>
            <div className={styles.selectedHeader}>
              <h4>{animeSeleccionado.titulo}</h4>
              <button className={styles.btnRemove} onClick={() => setAnimeSeleccionado(null)}>
                <X size={16} />
              </button>
            </div>
            
            <div className={styles.ratingSection}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.starBtn} ${star <= (hoverCalif || calificacion) ? styles.starActive : ''}`}
                    onMouseEnter={() => setHoverCalif(star)}
                    onMouseLeave={() => setHoverCalif(0)}
                    onClick={() => setCalificacion(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className={styles.ratingValue}>{calificacion > 0 ? `${calificacion}/10` : 'Sin calificar'}</span>
            </div>
          </div>
        </div>
      )}

      {animeSeleccionado && (
        <div className={styles.formContent}>
          <textarea 
            placeholder="¿Qué te pareció este anime?" 
            className={styles.textarea}
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            rows={4}
          />
          
          <div className={styles.actions}>
            <label className={styles.spoilerToggle}>
              <input type="checkbox" checked={spoiler} onChange={e => setSpoiler(e.target.checked)} />
              <span>Contiene spoilers</span>
            </label>
            
            <button 
              className={styles.btnSubmit} 
              disabled={!animeSeleccionado || calificacion === 0 || enviando}
              onClick={handleSubmit}
            >
              {enviando ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
