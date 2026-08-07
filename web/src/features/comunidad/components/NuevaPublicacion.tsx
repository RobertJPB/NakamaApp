import React, { useState, useCallback } from 'react'
import { Image as ImageIcon, MessageSquare, BarChart2, Star, X } from 'lucide-react'
import styles from './NuevaPublicacion.module.css'

interface Props { 
  onPublicar: (datos: { tipo: string; titulo?: string; contenido?: string; imagenUrl?: string; opciones?: string[]; resenaId?: string; seccion?: string }) => Promise<void> 
  usuarioAvatar?: string
  seccionActiva?: string
}

export const NuevaPublicacion: React.FC<Props> = ({ onPublicar, usuarioAvatar, seccionActiva }) => {
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState<'texto' | 'encuesta' | 'resena'>('texto')
  const [seccion, setSeccion] = useState<string>(seccionActiva || 'Debate')
  
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [opciones, setOpciones] = useState<string[]>(['', ''])
  
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }, [])

  const enviar = async () => {
    setError('')
    if (tipo === 'texto' && !contenido.trim()) { setError('El contenido no puede estar vacío'); return }
    if (tipo === 'resena' && !titulo.trim()) { setError('Debes incluir un título para tu reseña'); return }
    if (tipo === 'encuesta' && (!titulo.trim() || opciones.some(o => !o.trim()))) { setError('Completa el título y todas las opciones'); return }
    
    setEnviando(true)
    try {
      await onPublicar({ tipo, titulo, contenido, imagenUrl, opciones: opciones.filter(o => o.trim() !== ''), seccion })
      setAbierto(false)
      setTitulo(''); setContenido(''); setImagenUrl(''); setOpciones(['', ''])
    } catch { 
      setError('Error al publicar. Intenta de nuevo.') 
    } finally { 
      setEnviando(false) 
    }
  }

  if (!abierto) return (
    <div className={styles.crearBox} onClick={() => setAbierto(true)}>
      {usuarioAvatar ? (
        <img src={usuarioAvatar} alt="Avatar" className={styles.crearAvatar} />
      ) : (
        <div className={styles.crearAvatarPlaceholder} />
      )}
      <div className={styles.crearInputFalso}>¿Tienes algo en mente?</div>
      <div className={styles.crearAccionesFalsas}>
        <button><ImageIcon size={18} /></button>
        <button><BarChart2 size={18} /></button>
      </div>
    </div>
  )

  return (
    <div 
      className={`${styles.form} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <div className={styles.tabs}>
        <button className={tipo === 'texto' ? styles.tabActivo : styles.tab} onClick={() => setTipo('texto')}>
          <MessageSquare size={16} /> Debate
        </button>
        <button className={tipo === 'encuesta' ? styles.tabActivo : styles.tab} onClick={() => setTipo('encuesta')}>
          <BarChart2 size={16} /> Encuesta
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <select 
            className={styles.input} 
            style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', background: 'var(--color-surface-2)', border: 'none' }}
            value={seccion} 
            onChange={(e) => setSeccion(e.target.value)}
          >
            <option value="Debate">Debate</option>
            <option value="Teoría">Teoría</option>
            <option value="Fanart">Fanart</option>
          </select>
        </div>
      </div>

      <div className={styles.formContent}>
        {(tipo === 'texto' || tipo === 'resena' || tipo === 'encuesta') && (
          <input
            className={styles.input}
            type="text"
            placeholder={tipo === 'encuesta' ? "Pregunta..." : "Título (opcional)"}
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            maxLength={300}
            autoFocus
          />
        )}

        {(tipo === 'texto' || tipo === 'resena') && (
          <textarea
            className={styles.textarea}
            placeholder="¿Qué quieres compartir con la comunidad?"
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            rows={5}
          />
        )}



        {tipo === 'encuesta' && (
          <div className={styles.encuestaOpciones}>
            {opciones.map((opt, i) => (
              <div key={i} className={styles.opcionRow}>
                <input 
                  className={styles.input} 
                  placeholder={`Opción ${i + 1}`} 
                  value={opt}
                  onChange={e => {
                    const newOpts = [...opciones]
                    newOpts[i] = e.target.value
                    setOpciones(newOpts)
                  }}
                />
                {opciones.length > 2 && (
                  <button className={styles.btnRemoveOption} onClick={() => setOpciones(opciones.filter((_, idx) => idx !== i))}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {opciones.length < 6 && (
              <button className={styles.btnAddOption} onClick={() => setOpciones([...opciones, ''])}>
                Añadir opción
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      
      {imagenUrl && (
        <div className={styles.previewAreaSmall}>
          <img src={imagenUrl} alt="Preview" className={styles.imagePreviewSmall} />
          <button className={styles.btnRemoveImageSmall} onClick={() => setImagenUrl('')}><X size={14}/></button>
        </div>
      )}

      <div className={styles.acciones}>
        <div className={styles.accionesIzq}>
          <label className={styles.btnIconAction}>
            <ImageIcon size={20} />
            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
          </label>
        </div>
        <div className={styles.accionesDer}>
          <button className={styles.btnCancelar} onClick={() => setAbierto(false)}>Cancelar</button>
          <button className={styles.btnEnviar} onClick={enviar} disabled={enviando}>
            {enviando ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
