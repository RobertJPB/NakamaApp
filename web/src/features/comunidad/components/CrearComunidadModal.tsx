import React, { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { api } from '../../../lib/axios'
import styles from './CrearComunidadModal.module.css'

interface Props {
  onClose: () => void
  onCreated: () => void
  comunidadToEdit?: any
}

export const CrearComunidadModal: React.FC<Props> = ({ onClose, onCreated, comunidadToEdit }) => {
  const [nombre, setNombre] = useState(comunidadToEdit?.nombre || '')
  const [descripcion, setDescripcion] = useState(comunidadToEdit?.descripcion || '')
  const [tipo, setTipo] = useState(comunidadToEdit?.tipo || 'anime')
  const [imagenUrl, setImagenUrl] = useState(comunidadToEdit?.imagenUrl || '')
  const [bannerUrl, setBannerUrl] = useState(comunidadToEdit?.bannerUrl || '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImagenUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setBannerUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleCrear = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setEnviando(true)
    setError('')
    try {
      if (comunidadToEdit) {
        await api.put(`/api/comunidades/${comunidadToEdit.id}`, {
          nombre,
          descripcion,
          tipo,
          imagenUrl,
          bannerUrl
        })
      } else {
        await api.post('/api/comunidades', {
          nombre,
          descripcion,
          tipo,
          imagenUrl,
          bannerUrl
        })
      }
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la comunidad')
    } finally {
      setEnviando(false)
    }
  }

  const handleEliminar = async () => {
    if (!comunidadToEdit) return
    if (!window.confirm('¿Seguro que quieres eliminar esta comunidad? Esta acción no se puede deshacer.')) return
    
    setEnviando(true)
    setError('')
    try {
      await api.delete(`/api/comunidades/${comunidadToEdit.id}`)
      // Redirigir al inicio o a la lista de comunidades, o solo onCreated() si maneja la recarga
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar la comunidad')
      setEnviando(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{comunidadToEdit ? 'Editar Comunidad' : 'Crear Comunidad'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label>Nombre de la comunidad {comunidadToEdit && '(No se puede cambiar)'}</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              placeholder="Ej. Fans de One Piece" 
              className={styles.input}
              maxLength={100}
              disabled={!!comunidadToEdit}
              style={{ opacity: comunidadToEdit ? 0.7 : 1, cursor: comunidadToEdit ? 'not-allowed' : 'text' }}
            />
          </div>

          <div className={styles.field}>
            <label>Descripción</label>
            <textarea 
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)} 
              placeholder="¿De qué trata esta comunidad?" 
              className={styles.textarea}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label>Avatar / Ícono de la comunidad</label>
            <div className={styles.imageInputWrapper}>
              {!imagenUrl ? (
                <label className={styles.uploadArea}>
                  <ImageIcon size={24} />
                  <span>Subir avatar (círculo)</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </label>
              ) : (
                <div className={styles.previewArea}>
                  <img src={imagenUrl} alt="Avatar de la comunidad" className={styles.imagePreview} />
                  <button className={styles.btnRemoveImage} onClick={() => setImagenUrl('')}><X size={16}/></button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label>Fondo de Portada (Banner)</label>
            <div className={styles.imageInputWrapper}>
              {!bannerUrl ? (
                <label className={styles.uploadArea}>
                  <ImageIcon size={24} />
                  <span>Subir portada (rectangular)</span>
                  <input type="file" accept="image/*" onChange={handleBannerChange} hidden />
                </label>
              ) : (
                <div className={styles.previewArea}>
                  <img src={bannerUrl} alt="Portada de la comunidad" className={styles.imagePreviewBanner} />
                  <button className={styles.btnRemoveImage} onClick={() => setBannerUrl('')}><X size={16}/></button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer} style={{ display: 'flex', justifyContent: comunidadToEdit ? 'space-between' : 'flex-end', width: '100%' }}>
          {comunidadToEdit && (
            <button className={styles.btnCancelar} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleEliminar} disabled={enviando}>
              Eliminar
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.btnCancelar} onClick={onClose} disabled={enviando}>Cancelar</button>
            <button className={styles.btnGuardar} onClick={handleCrear} disabled={enviando || !nombre.trim()}>
              {enviando ? 'Guardando...' : (comunidadToEdit ? 'Guardar Cambios' : 'Crear Comunidad')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
