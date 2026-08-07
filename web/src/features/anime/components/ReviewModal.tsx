import React, { useState, useRef, useCallback } from 'react'
import { api } from '../../../lib/axios'
import { X, Search, Image as ImageIcon } from 'lucide-react'
import styles from './ReviewModal.module.css'
import { useBusqueda } from '../../../hooks/useAnime'

interface ReviewModalProps {
  animeIdInicial?: string
  animeInicial?: any
  resenaToEdit?: any
  onClose: () => void
  onSaved: (resena: any) => void
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ animeIdInicial, animeInicial, resenaToEdit, onClose, onSaved }) => {
  const [tab, setTab] = useState<'resena' | 'comentario' | 'encuesta'>('resena')
  const [paso, setPaso] = useState<'search' | 'compose'>((animeIdInicial || resenaToEdit) ? 'compose' : 'search')
  
  // Search State
  const [query, setQuery] = useState('')
  const { resultados, cargando } = useBusqueda(query)
  
  // Compose Reseña State
  const [selectedAnime, setSelectedAnime] = useState<any>(
    animeInicial || 
    resenaToEdit?.anime || 
    resenaToEdit?.referencia || 
    (resenaToEdit?.animeTitulo ? {
      titulo: resenaToEdit.animeTitulo,
      externalId: resenaToEdit.externalId,
      imagenUrl: resenaToEdit.animeImagen
    } : null)
  )
  const [calificacion, setCalificacion] = useState(resenaToEdit?.calificacion || 0)
  const [hover, setHover] = useState(0)
  const [contenido, setContenido] = useState(resenaToEdit?.contenido || '')
  const [fechaVisto, setFechaVisto] = useState(resenaToEdit?.fechaVisto ? resenaToEdit.fechaVisto.split('T')[0] : '')
  const [tagsInput, setTagsInput] = useState(resenaToEdit?.etiquetas ? resenaToEdit.etiquetas.join(', ') : '')
  const [contieneSpoiler, setContieneSpoiler] = useState(resenaToEdit?.contieneSpoiler || false)
  
  // Comentario State
  const [tema, setTema] = useState('')
  const [soloAmigos, setSoloAmigos] = useState(false)
  const [imagenUrl, setImagenUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => setImagenUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) { setImagenUrl(''); return }
    loadFile(file)
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0]
    if (file && file.type.startsWith('image/')) {
      e.preventDefault()
      loadFile(file)
    }
  }, [])

  // Encuesta State
  const [pregunta, setPregunta] = useState('')
  const [opciones, setOpciones] = useState(['', ''])

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
      const etiquetas = tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean)
      
      let res;
      if (resenaToEdit) {
        res = await api.put(`/api/resenas/${resenaToEdit.id}`, {
          animeId: selectedAnime?.externalId || selectedAnime?.id || resenaToEdit.animeId,
          calificacion, 
          contenido, 
          contieneSpoiler,
          fechaVisto: fechaVisto ? new Date(fechaVisto).toISOString() : undefined,
          etiquetas
        })
      } else {
        res = await api.post('/api/resenas', { 
          animeId: selectedAnime?.externalId || selectedAnime?.id, 
          calificacion, 
          contenido, 
          contieneSpoiler, 
          esPublica: true,
          fechaVisto: fechaVisto ? new Date(fechaVisto).toISOString() : undefined,
          etiquetas
        })
      }
      onSaved({ ...res.data, anime: selectedAnime, esResena: true })
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al enviar la reseña')
    } finally { setEnviando(false) }
  }

  const enviarComentario = async () => {
    if (!contenido.trim()) { setError('El contenido no puede estar vacío'); return }
    setEnviando(true); setError('')
    try {
      const res = await api.post('/api/feed', { 
        contenido, 
        tema, 
        soloAmigos,
        imagenUrl
      })
      onSaved({ ...res.data, esResena: false })
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al publicar comentario')
    } finally { setEnviando(false) }
  }

  const enviarEncuesta = async () => {
    const opcionesFiltradas = opciones.filter(o => o.trim())
    if (!pregunta.trim()) { setError('Escribe una pregunta'); return }
    if (opcionesFiltradas.length < 2) { setError('Agrega al menos 2 opciones'); return }
    setEnviando(true); setError('')
    try {
      const res = await api.post('/api/feed', {
        contenido: pregunta,
        tipo: 'encuesta',
        opciones: opcionesFiltradas
      })
      onSaved({ ...res.data, esResena: false })
      setPregunta('')
      setOpciones(['', ''])
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Error al publicar la encuesta')
    } finally { setEnviando(false) }
  }

  const displayVal = hover || calificacion

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.tabs}>
            {resenaToEdit ? (
              <span className={styles.tabActivo} style={{ fontWeight: 'bold' }}>Editar Reseña</span>
            ) : (
              <>
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
                <button 
                  className={`${styles.tabBtn} ${tab === 'encuesta' ? styles.tabActivo : ''}`}
                  onClick={() => { setTab('encuesta'); setError('') }}
                >
                  Encuesta
                </button>
              </>
            )}
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
                    <div key={anime.id || anime.externalId} className={styles.searchResultItem} onClick={() => handleSelectAnime(anime)}>
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
                  onPaste={handlePaste}
                  rows={8}
                />

                {imagenUrl && (
                  <div style={{ position: 'relative', marginTop: 12, borderRadius: 8, overflow: 'hidden' }}>
                    <img src={imagenUrl} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />
                    <button 
                      onClick={() => setImagenUrl('')}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', padding: 4, cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} hidden ref={fileInputRef} />
                  <button 
                    className={styles.changeAnimeBtn} 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ImageIcon size={16} /> Agregar Imagen
                  </button>
                </div>

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

        {/* CONTENIDO ENCUESTA */}
        {tab === 'encuesta' && (
          <>
            <div className={styles.composeBody}>
              <div className={styles.formColFull}>
                <div className={styles.inputGroup}>
                  <label>Pregunta</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="¿Cuál es tu personaje favorito de Chainsaw Man?"
                    className={styles.temaInput}
                    value={pregunta}
                    onChange={e => setPregunta(e.target.value)}
                  />
                </div>

                <div className={styles.inputGroup} style={{ marginTop: 16 }}>
                  <label>Opciones</label>
                  {opciones.map((op, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={`Opción ${i + 1}`}
                        className={styles.temaInput}
                        value={op}
                        onChange={e => {
                          const next = [...opciones]
                          next[i] = e.target.value
                          setOpciones(next)
                        }}
                      />
                      {opciones.length > 2 && (
                        <button
                          className={styles.changeAnimeBtn}
                          onClick={() => setOpciones(opciones.filter((_, idx) => idx !== i))}
                        >✕</button>
                      )}
                    </div>
                  ))}
                  {opciones.length < 4 && (
                    <button
                      className={styles.changeAnimeBtn}
                      style={{ marginTop: 4 }}
                      onClick={() => setOpciones([...opciones, ''])}
                    >Agregar opción</button>
                  )}
                </div>

                {error && <p className={styles.error}>{error}</p>}
              </div>
            </div>
            <div className={styles.footer}>
              <button className={styles.saveBtn} onClick={enviarEncuesta} disabled={enviando}>
                {enviando ? 'Publicando...' : 'Publicar Encuesta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
