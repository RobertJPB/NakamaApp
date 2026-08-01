import React, { useState } from 'react'
import { X, Image as ImageIcon, Lock, Unlock } from 'lucide-react'
import styles from './CrearListaModal.module.css'

interface EditarListaModalProps {
  lista: {
    id: string
    nombre: string
    descripcion?: string
    imagenUrl?: string
    esPrivada?: boolean
  }
  onClose: () => void
  onEditar: (columnaId: string, datos: { nombre?: string; descripcion?: string; imagenUrl?: string; esPrivada?: boolean }) => void
}

export const EditarListaModal: React.FC<EditarListaModalProps> = ({ lista, onClose, onEditar }) => {
  const [nombre, setNombre] = useState(lista.nombre || '')
  const [descripcion, setDescripcion] = useState(lista.descripcion || '')
  const [imagenUrl, setImagenUrl] = useState(lista.imagenUrl || '')
  const [esPrivada, setEsPrivada] = useState(lista.esPrivada || false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setImagenUrl('')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagenUrl(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    onEditar(lista.id, {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      imagenUrl: imagenUrl.trim() || undefined,
      esPrivada,
    })
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Editar Lista</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.inputGroup}>
            <label>Título <span className={styles.requiredDot}>*</span></label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej. Mis Shonens Favoritos..." 
              autoFocus
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Mensaje / Descripción</label>
            <textarea 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              placeholder="Escribe algo sobre esta lista..." 
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Portada (Sube una imagen)</label>
            <div className={styles.imageInputWrapper}>
              <ImageIcon size={18} className={styles.inputIcon} />
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange} 
                className={`${styles.input} ${styles.inputWithIcon}`}
              />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={esPrivada}
                onChange={(e) => setEsPrivada(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-acento)' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-texto)', fontWeight: 500 }}>
                {esPrivada ? <Lock size={16} color="#ff4757" /> : <Unlock size={16} color="var(--color-texto-muted)" />}
                Lista Privada
              </span>
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-texto-muted)', marginTop: '4px', marginLeft: '26px' }}>
              Si la lista es privada, no aparecerá en tu perfil público.
            </p>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnSubmit} disabled={!nombre.trim()}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  )
}
