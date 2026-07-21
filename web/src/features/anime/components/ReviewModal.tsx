import React, { useState } from 'react'
import { api } from '../../../lib/axios'
import { X, Search } from 'lucide-react'
import styles from './ReviewModal.module.css'
import { useBusqueda } from '../../../hooks/useAnime'

interface ReviewModalProps {
  animeIdInicial?: string
  animeInicial?: any
  onClose: () => void
  onSaved: (resena: any) => void
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ animeIdInicial, animeInicial, onClose, onSaved }) => {
  const [tab, setTab] = useState<'resena' | 'comentario'>('resena')
  const [paso, setPaso] = useState<'search' | 'compose'>(animeIdInicial ? 'compose' : 'search')
  
  // Search State
  const [query, setQuery] = useState('')
  const { resultados, cargando } = useBusqueda(query)
  
  // Compose Reseña State
  const [selectedAnime, setSelectedAnime] = useState<any>(animeInicial)
  const [calificacion, setCalificacion] = useState(0)
  const [hover, setHover] = useState(0)
  const [contenido, setContenido] = useState('')
  const [fechaVisto, setFechaVisto] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  
  // Comentario State
  const [tema, setTema] = useState('')
  const [soloAmigos, setSoloAmigos] = useState(false)

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const handleSelectAnime = (anime: any) => {
    setSelectedAnime(anime)
    setPaso('compose')
  }

  const enviarResena = async () => {
    if (!calificacion) { setError('Selecciona una calificación'); return }
    if (!contenido.trim()) { setError('El contenido no puede estar vacío'); return }
    setEnviando(true); setError('')
    try {
      const etiquetas = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      const res = await api.post('/api/resenas', { 
        animeId: selectedAnime?.anilistId || selectedAnime?.id, 
        calificacion, 
        contenido, 
        contieneSpoiler: false, 
        esPublica: true,
        fechaVisto: fechaVisto ? new Date(fechaVisto).toISOString() : undefined,
        etiquetas
      })
      onSaved({ ...res.data, anime: selectedAnime, esResena: true })
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al enviar la reseña')
    } finally { setEnviando(false) }
  }

  const enviarComentario = async () => {
    if (!contenido.trim()) { setError('El contenido no puede estar vacío'); return }
    setEnviando(true); setError('')
    try {
      const res = await api.post('/api/feed/post', { 
        contenido, 
        tema, 
        soloAmigos 
      })
      onSaved({ ...res.data, esResena: false })
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al publicar comentario')
    } finally { setEnviando(false) }
  }

  const displayVal = hover || calificacion

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${tab === 'resena' ? styles.tabActivo : ''}`}
              onClick={() => { 
                setTab('resena'); 
                if (!selectedAnime) setPaso('search');
              }}
            >
              Reseña
            </button>
            <button 
              className={`${styles.tabBtn} ${tab === 'comentario' ? styles.tabActivo : ''}`}
              onClick={() => { setTab('comentario'); setPaso('compose'); setError('') }}
            >
              Publicación
            </button>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>

        {/* CONTENIDO RESEÑA */}
        {tab === 'resena' && (
          <>
            {paso === 'search' && (
              <div className={styles.searchBody}>
                <div className={styles.searchInputWrap}>
                  <Search size={18} className={styles.searchIcon} />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Busca un anime para reseñar..." 
                    className={styles.searchInput}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>
                {cargando && <p className={styles.cargando}>Buscando...</p>}
                <div className={styles.searchResults}>
                  {resultados.map(anime => (
                    <div key={anime.id || anime.anilistId} className={styles.searchResultItem} onClick={() => handleSelectAnime(anime)}>
                      <span className={styles.resultTitle}>{anime.titulo}</span>
                      <span className={styles.resultYear}>{anime.anio}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paso === 'compose' && selectedAnime && (
              <div className={styles.composeBody}>
                <div className={styles.composeLayout}>
                  <div className={styles.posterCol}>
                    <img src={selectedAnime.imagenUrl || selectedAnime.imagen} alt="Poster" className={styles.poster} />
                  </div>
                  <div className={styles.formCol}>
                    <div className={styles.animeTitleBlock}>
                      <h3 className={styles.animeTitle}>{selectedAnime.titulo}</h3>
                      <span className={styles.animeYear}>{selectedAnime.anio}</span>
                      <button className={styles.changeAnimeBtn} onClick={() => setPaso('search')}>Cambiar</button>
                    </div>

                    <div className={styles.dateRow}>
                      <span className={styles.dateLabel}>¿Cuándo lo viste? (Opcional)</span>
                      <input 
                        type="date" 
                        className={styles.dateInput} 
                        value={fechaVisto}
                        onChange={e => setFechaVisto(e.target.value)}
                      />
                    </div>

                    <textarea
                      className={styles.textarea}
                      placeholder="Escribe una reseña..."
                      value={contenido}
                      onChange={e => setContenido(e.target.value)}
                      rows={6}
                    />

                    <div className={styles.metaRow}>
                      <div className={styles.tagsBlock}>
                        <label>Etiquetas</label>
                        <input 
                          type="text" 
                          placeholder="ej. shonen, obra maestra" 
                          className={styles.tagsInput}
                          value={tagsInput}
                          onChange={e => setTagsInput(e.target.value)}
                        />
                      </div>
                      
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
                                <span className={`${styles.starIcon} ${isFull ? styles.starFull : isHalf ? styles.starHalf : styles.starEmpty}`}>
                                  ★
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                  </div>
                </div>
              </div>
            )}
            {paso === 'compose' && selectedAnime && (
              <div className={styles.footer}>
                <button className={styles.saveBtn} onClick={enviarResena} disabled={enviando}>
                  {enviando ? 'Guardando...' : 'Guardar Reseña'}
                </button>
              </div>
            )}
          </>
        )}

        {/* CONTENIDO COMENTARIO */}
        {tab === 'comentario' && (
          <>
            <div className={styles.composeBody}>
              <div className={styles.formColFull}>
                <div className={styles.inputGroup}>
                  <label>Tema (Opcional)</label>
                  <input 
                    type="text"
                    placeholder="¿De qué trata esto? ej. Teorías, Debates, Recomendaciones, Novedades"
                    className={styles.temaInput}
                    value={tema}
                    onChange={e => setTema(e.target.value)}
                  />
                </div>
                
                <textarea
                  className={styles.textarea}
                  placeholder="¿Qué estás pensando?"
                  value={contenido}
                  onChange={e => setContenido(e.target.value)}
                  rows={8}
                />

                {error && <p className={styles.error}>{error}</p>}
              </div>
            </div>
            <div className={styles.footer}>
              <button className={styles.saveBtn} onClick={enviarComentario} disabled={enviando}>
                {enviando ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
