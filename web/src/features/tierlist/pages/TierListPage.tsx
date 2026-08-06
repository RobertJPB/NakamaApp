import React, { useState, useRef, useEffect } from 'react'
import { Layout } from '../../../components/shared/Layout'
import { api } from '../../../lib/axios'
import { Download, Search, X, User, Tv, Save, Check, Share2 } from 'lucide-react'
import styles from './TierListPage.module.css'
import html2canvas from 'html2canvas'
import { useAuth } from '../../../hooks/useAuth'
import { CompartirTierListModal } from '../components/CompartirTierListModal'

interface TierItem {
  id: string
  externalId: string
  titulo: string
  imagenUrl: string
  esPersonaje?: boolean
  animeTitulo?: string
}

type TierRow = {
  id: string
  label: string
  color: string
  items: TierItem[]
}

const DEFAULT_TIERS: TierRow[] = [
  { id: 'S', label: 'S', color: '#ff7f7f', items: [] },
  { id: 'A', label: 'A', color: '#ffbf7f', items: [] },
  { id: 'B', label: 'B', color: '#ffff7f', items: [] },
  { id: 'C', label: 'C', color: '#7fff7f', items: [] },
  { id: 'D', label: 'D', color: '#7fbfff', items: [] },
]

export const TierListPage: React.FC = () => {
  const { usuario } = useAuth()
  const [tiers, setTiers] = useState<TierRow[]>(DEFAULT_TIERS)
  const [pool, setPool] = useState<TierItem[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [animesRes, setAnimesRes] = useState<TierItem[]>([])
  const [personajesRes, setPersonajesRes] = useState<TierItem[]>([])
  const [buscando, setBuscando] = useState(false)
  const [exportando, setExportando] = useState(false)

  // -- Plantillas --
  const [plantillas, setPlantillas] = useState<any[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalCompartirAbierto, setModalCompartirAbierto] = useState(false)
  const [tierListImage, setTierListImage] = useState('')
  const [nombrePlantilla, setNombrePlantilla] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [titulo, setTitulo] = useState('')

  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cargarPlantillas()
  }, [])

  const cargarPlantillas = async () => {
    try {
      const res = await api.get('/api/plantillas')
      setPlantillas(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchSeq = useRef(0)

  // -- Buscador unificado con feedback progresivo --
  // Cada tipo de resultado (animes / personajes) se muestra en cuanto llega,
  // y los resultados previos se mantienen visibles (atenuados) mientras la
  // nueva búsqueda está en curso, para que nunca parezca que no responde.
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setBusqueda(val)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (val.trim().length < 2) {
      searchSeq.current++
      setAnimesRes([])
      setPersonajesRes([])
      setBuscando(false)
      return
    }

    setBuscando(true)
    searchTimeout.current = setTimeout(() => {
      const seq = ++searchSeq.current

      const applyAnimes = (data: any) => {
        if (searchSeq.current !== seq) return
        const list = Array.isArray(data) ? data : (data?.animes ?? [])
        setAnimesRes(list.slice(0, 6))
      }

      const applyPersonajes = (data: any) => {
        if (searchSeq.current !== seq) return
        const list = (Array.isArray(data) ? data : []).map((c: any) => ({
          id: `char_${c.id}`,
          externalId: String(c.id),
          titulo: c.nombre || 'Desconocido',
          imagenUrl: c.imagenUrl,
          esPersonaje: true
        }))
        setPersonajesRes(list.slice(0, 50))
      }

      const animeReq = api.get(`/api/animes?busqueda=${encodeURIComponent(val)}&limit=6`)
        .then(r => applyAnimes(r.data))
        .catch(() => { if (searchSeq.current === seq) setAnimesRes([]) })

      const personajesReq = api.get(`/api/animes/personajes?busqueda=${encodeURIComponent(val)}`)
        .then(r => applyPersonajes(r.data))
        .catch(() => { if (searchSeq.current === seq) setPersonajesRes([]) })

      // Apagar el indicador cuando terminen AMBOS (con el seq correcto)
      Promise.allSettled([animeReq, personajesReq]).then(() => {
        if (searchSeq.current === seq) setBuscando(false)
      })
    }, 200)
  }

  const handleAddItem = (item: TierItem) => {
    const key = item.esPersonaje ? `char_${item.externalId}` : item.externalId.toString()
    const existsInTiers = tiers.some(t => t.items.some(i => (i.esPersonaje ? `char_${i.externalId}` : i.externalId.toString()) === key))
    const existsInPool  = pool.some(i => (i.esPersonaje ? `char_${i.externalId}` : i.externalId.toString()) === key)
    if (!existsInTiers && !existsInPool) {
      setPool(prev => [...prev, item])
    }
  }

  const removeItem = (item: TierItem) => {
    const key = item.esPersonaje ? `char_${item.externalId}` : item.externalId.toString()
    setPool(prev => prev.filter(i => (i.esPersonaje ? `char_${i.externalId}` : i.externalId.toString()) !== key))
    setTiers(prev => prev.map(t => ({
      ...t,
      items: t.items.filter(i => (i.esPersonaje ? `char_${i.externalId}` : i.externalId.toString()) !== key)
    })))
  }

  // -- Drag & Drop Nativo --
  const handleDragStart = (e: React.DragEvent, item: TierItem, sourceId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, sourceId }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add(styles.dragOver)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dragOver)
  }

  const itemKey = (i: TierItem) => i.esPersonaje ? `char_${i.externalId}` : i.externalId.toString()

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.currentTarget.classList.remove(styles.dragOver)
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      const { item, sourceId } = data

      if (sourceId === targetId) return

      if (sourceId === 'pool') {
        setPool(prev => prev.filter(i => itemKey(i) !== itemKey(item)))
      } else {
        setTiers(prev => prev.map(t =>
          t.id === sourceId ? { ...t, items: t.items.filter(i => itemKey(i) !== itemKey(item)) } : t
        ))
      }

      if (targetId === 'pool') {
        setPool(prev => [...prev, item])
      } else {
        setTiers(prev => prev.map(t =>
          t.id === targetId ? { ...t, items: [...t.items, item] } : t
        ))
      }
    } catch (err) {}
  }

  // -- Acciones --
  const handleExport = async () => {
    if (!boardRef.current) return
    setExportando(true)
    boardRef.current.classList.add(styles.exporting)
    try {
      const canvas = await html2canvas(boardRef.current, {
        useCORS: true,
        backgroundColor: '#1a1a1a'
      })
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = 'nakama-tierlist.png'
      link.click()
    } catch (err) {
      alert('Hubo un error al exportar la imagen. Verifica que el navegador lo permita.')
    } finally {
      boardRef.current?.classList.remove(styles.exporting)
      setExportando(false)
    }
  }

  const handleGuardarPlantilla = async () => {
    if (!nombrePlantilla.trim() || !boardRef.current) return
    setGuardando(true)
    boardRef.current.classList.add(styles.exporting)
    try {
      // Capturar la miniatura de la tier list
      const canvas = await html2canvas(boardRef.current, {
        useCORS: true,
        backgroundColor: '#1a1a1a',
        scale: 0.5 // Menor resolución para la portada
      })
      const coverImage = canvas.toDataURL('image/jpeg', 0.5)

      await api.post('/api/plantillas', {
        nombre: nombrePlantilla,
        datos: JSON.stringify({ filas: tiers, coverImage })
      })
      setModalAbierto(false)
      setNombrePlantilla('')
      cargarPlantillas()
    } catch (err) {
      console.error(err)
      alert('Hubo un error al guardar la plantilla.')
    } finally {
      boardRef.current?.classList.remove(styles.exporting)
      setGuardando(false)
    }
  }

  const handleCompartir = async () => {
    if (!boardRef.current) return
    setExportando(true)
    boardRef.current.classList.add(styles.exporting)
    try {
      const canvas = await html2canvas(boardRef.current, {
        useCORS: true,
        backgroundColor: '#1a1a1a'
      })
      const base64Image = canvas.toDataURL('image/png')
      setTierListImage(base64Image)
      setModalCompartirAbierto(true)
    } catch (err) {
      console.error(err)
      alert('Error al capturar la imagen.')
    } finally {
      boardRef.current.classList.remove(styles.exporting)
      setExportando(false)
    }
  }

  const cargarPlantilla = (datosStr: string | any, nombrePlantilla: string) => {
    try {
      // Soporte para la nueva estructura con coverImage
      let datosACargar = typeof datosStr === 'string' ? JSON.parse(datosStr) : datosStr
      if (datosACargar.filas) {
        setTiers(datosACargar.filas)
      } else {
        // Formato antiguo (directamente el array de tiers)
        setTiers(datosACargar)
      }
      setPool([])
      setTitulo(nombrePlantilla)
      
      // Asegurar que suba usando scrollIntoView en el board
      setTimeout(() => {
        if (boardRef.current) {
          boardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 150)
    } catch(e) {
      console.error(e)
    }
  }

  const hasResults = animesRes.length > 0 || personajesRes.length > 0
  const queryValida = busqueda.trim().length >= 2

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Creador de Tier Lists</h1>
            <p className={styles.subtitle}>Arma tu lista de favoritos y descárgala para compartir.</p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Columna Izquierda: Tablero y Acciones */}
          <div className={styles.mainCol}>
            {/* Acciones del Tablero (Arriba) */}
            <div className={styles.boardActions}>
              <button className={styles.btnDescargar} onClick={handleExport} disabled={exportando}>
                <Download size={18} />
                {exportando ? 'Guardando...' : 'Descargar Imagen'}
              </button>
              {usuario && (
                <>
                  <button className={styles.btnGuardar} onClick={() => setModalAbierto(true)}>
                    <Save size={18} />
                    Guardar Plantilla
                  </button>
                </>
              )}
            </div>

            <div className={styles.tierBoard} ref={boardRef}>
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={styles.tierRow}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, tier.id)}
                >
                  <div className={styles.tierLabel} style={{ backgroundColor: tier.color }}>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      className={styles.tierLabelEditable}
                      onBlur={(e) => {
                        const val = e.currentTarget.textContent || '';
                        setTiers(prev => prev.map(t => t.id === tier.id ? { ...t, label: val } : t));
                      }}
                    >
                      {tier.label}
                    </span>
                  </div>
                  <div className={styles.tierContent}>
                    {tier.items.map(item => (
                      <div
                        key={itemKey(item)}
                        className={styles.animeCard}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item, tier.id)}
                        title={item.titulo + (item.animeTitulo ? ` (${item.animeTitulo})` : '')}
                      >
                        {/* Usar el proxy del backend para evitar problemas de CORS con html2canvas y s4.anilist.co */}
                        <img src={`/api/animes/proxy-image?url=${encodeURIComponent(item.imagenUrl)}`} alt={item.titulo} crossOrigin="anonymous" className={styles.animeImg} />
                        <button className={styles.removeBtn} onClick={() => removeItem(item)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Plantillas de la Comunidad */}
            <div className={styles.plantillasSeccion}>
              <h2 className={styles.plantillasTitulo}>Plantillas de la Comunidad</h2>
              {plantillas.length === 0 ? (
                <p style={{ color: 'var(--color-texto-muted)', fontSize: 14 }}>Aún no hay plantillas guardadas.</p>
              ) : (
                <div className={styles.plantillasGrid}>
                  {plantillas.map(p => {
                    let imagenDestacada = null
                    try {
                      // Intentar leer la miniatura capturada
                      const d = typeof p.datos === 'string' ? JSON.parse(p.datos) : p.datos
                      if (d.coverImage) {
                        imagenDestacada = d.coverImage
                      } else {
                        // Fallback antiguo: extraer primera imagen
                        const items = [...(d.pozo || []), ...(d.filas || d || []).flatMap((f:any) => f.items || [])]
                        imagenDestacada = items.find(i => i && i.imagenUrl)?.imagenUrl || null
                      }
                    } catch (e) {}

                    return (
                      <div key={p.id} className={styles.plantillaCard} onClick={() => cargarPlantilla(p.datos, p.nombre)}>
                        <div className={styles.plantillaPortada}>
                          {imagenDestacada ? (
                            <img 
                              src={imagenDestacada.startsWith('data:') ? imagenDestacada : `/api/animes/proxy-image?url=${encodeURIComponent(imagenDestacada)}`} 
                              alt={p.nombre} 
                              loading="lazy" 
                              crossOrigin="anonymous" 
                            />
                          ) : (
                            <div className={styles.plantillaFallback}><Tv size={32} /></div>
                          )}
                        </div>
                        <div className={styles.plantillaInfo}>
                          <h4 className={styles.plantillaName}>{p.nombre}</h4>
                          <span className={styles.plantillaAuthor}>Por @{p.usuario.username}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Zona de Búsqueda y Pozo */}
          <div className={styles.sidebar}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar animes o personajes..."
                className={styles.searchInput}
                value={busqueda}
                onChange={handleSearch}
                aria-label="Buscar animes o personajes"
              />
              {buscando && (
                <span className={styles.searchSpinner} title="Buscando...">
                  <span className={styles.spinner} />
                </span>
              )}
            </div>

            {queryValida && (hasResults || buscando) && (
              <div className={`${styles.searchResults} ${buscando ? styles.searchResultsLoading : ''}`}>
                {buscando && personajesRes.length === 0 && animesRes.length === 0 && (
                  <div className={styles.searchStatus}>
                    <span className={styles.spinner} /> Buscando "{busqueda.trim()}"...
                  </div>
                )}
                {!buscando && !hasResults && (
                  <div className={styles.searchStatus}>
                    Sin resultados para "{busqueda.trim()}"
                  </div>
                )}
                {personajesRes.length > 0 && (
                  <>
                    <div className={styles.resultSection}>
                      <User size={12} /> Personajes
                    </div>
                    {personajesRes.map(res => (
                      <div key={`char_${res.externalId}`} className={styles.resultItem} onClick={() => handleAddItem(res)}>
                        <img src={res.imagenUrl} alt={res.titulo} className={`${styles.resultImg} ${styles.resultImgChar}`} />
                        <div>
                          <span className={styles.resultTitle}>{res.titulo}</span>
                          {res.animeTitulo && (
                            <span className={styles.resultAnime}>{res.animeTitulo}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {animesRes.length > 0 && (
                  <>
                    <div className={styles.resultSection}>
                      <Tv size={12} /> Animes
                    </div>
                    {animesRes.map(res => (
                      <div key={res.externalId} className={styles.resultItem} onClick={() => handleAddItem(res)}>
                        <img src={res.imagenUrl} alt={res.titulo} className={styles.resultImg} />
                        <span className={styles.resultTitle}>{res.titulo}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            <h3 style={{ fontSize: '14px', margin: '8px 0', color: 'var(--color-texto-suave)' }}>
              Disponibles (Arrastra desde aquí)
            </h3>

            <div
              className={styles.pool}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'pool')}
            >
              {pool.length === 0 && <span style={{ color: 'var(--color-texto-muted)', fontSize: '12px', padding: '8px' }}>Busca animes o personajes para añadirlos aquí.</span>}
              {pool.map(item => (
                <div
                  key={itemKey(item)}
                  className={styles.animeCard}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, 'pool')}
                  title={item.titulo + (item.animeTitulo ? ` (${item.animeTitulo})` : '')}
                >
                  <img src={`/api/animes/proxy-image?url=${encodeURIComponent(item.imagenUrl)}`} alt={item.titulo} crossOrigin="anonymous" className={styles.animeImg} />
                  <button className={styles.removeBtn} onClick={() => removeItem(item)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Guardar Plantilla */}
      {modalAbierto && (
        <div className={styles.modalOverlay} onClick={() => setModalAbierto(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Guardar Plantilla</h3>
            <p style={{ fontSize: 14, color: 'var(--color-texto-suave)', marginBottom: 16 }}>
              Dale un nombre a tu plantilla para que otros puedan usarla.
            </p>
            <input
              type="text"
              placeholder="Ej: Personajes de Jujutsu Kaisen"
              className={styles.modalInput}
              value={nombrePlantilla}
              onChange={e => setNombrePlantilla(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setModalAbierto(false)}>Cancelar</button>
              <button 
                className={styles.btnSubmit} 
                onClick={handleGuardarPlantilla} 
                disabled={!nombrePlantilla.trim() || guardando}
              >
                {guardando ? 'Guardando...' : <><Check size={16}/> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <CompartirTierListModal 
        isOpen={modalCompartirAbierto}
        onClose={() => setModalCompartirAbierto(false)}
        imageSrc={tierListImage}
      />
    </Layout>
  )
}
