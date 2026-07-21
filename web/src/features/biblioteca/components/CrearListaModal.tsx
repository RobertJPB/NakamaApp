import React, { useState } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import styles from './CrearListaModal.module.css'

interface CrearListaModalProps {
  onClose: () => void
  onCrear: (datos: { nombre: string; descripcion?: string; imagenUrl?: string }) => void
}

export const CrearListaModal: React.FC<CrearListaModalProps> = ({ onClose, onCrear }) => {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')

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
    onCrear({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      imagenUrl: imagenUrl.trim() || undefined,
    })
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Agregar Nueva Lista</h2>
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

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnSubmit} disabled={!nombre.trim()}>Crear Lista</button>
          </div>
        </form>
      </div>
    </div>
  )
}
