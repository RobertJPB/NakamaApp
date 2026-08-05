import React, { useState } from 'react'
import { X, Send } from 'lucide-react'
import { api } from '../../../lib/axios'
import { useComunidades } from '../../../hooks/useComunidad'
import styles from './CompartirTierListModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
}

export const CompartirTierListModal: React.FC<Props> = ({ isOpen, onClose, imageSrc }) => {
  const [contenido, setContenido] = useState('')
  const [destino, setDestino] = useState('feed') // 'feed' o community ID
  const [enviando, setEnviando] = useState(false)
  const { comunidades } = useComunidades()

  if (!isOpen) return null

  const handleCompartir = async () => {
    setEnviando(true)
    try {
      if (destino === 'feed') {
        await api.post('/api/feed', {
          contenido,
          imagenUrl: imageSrc,
          tipo: 'texto'
        })
      } else {
        await api.post(`/api/comunidades/${destino}/publicaciones`, {
          contenido,
          imagenUrl: imageSrc,
          tipo: 'texto'
        })
      }
      alert('¡Tier list publicada exitosamente!')
      onClose()
      setContenido('')
      setDestino('feed')
    } catch (err) {
      console.error(err)
      alert('Hubo un error al publicar la tier list.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Publicar Tier List</h3>
          <button className={styles.btnClose} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.modalBody}>
          <img src={imageSrc} alt="Preview" className={styles.previewImage} />
          
          <div className={styles.formGroup}>
            <label>Mensaje (Opcional)</label>
            <textarea
              className={styles.textarea}
              placeholder="¿Qué opinas de tu clasificación?"
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              disabled={enviando}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Dónde Publicar</label>
            <select
              className={styles.select}
              value={destino}
              onChange={e => setDestino(e.target.value)}
              disabled={enviando}
            >
              <option value="feed">Mi Feed Personal</option>
              {comunidades && comunidades.map((c: any) => (
                <option key={c.id} value={c.id}>Comunidad: {c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose} disabled={enviando}>Cancelar</button>
          <button className={styles.btnSubmit} onClick={handleCompartir} disabled={enviando}>
            <Send size={18} />
            {enviando ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
