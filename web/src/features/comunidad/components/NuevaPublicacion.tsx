import React, { useState } from 'react'
import styles from './NuevaPublicacion.module.css'

interface Props { onPublicar: (titulo: string, contenido: string) => Promise<void> }

export const NuevaPublicacion: React.FC<Props> = ({ onPublicar }) => {
  const [titulo,    setTitulo]    = useState('')
  const [contenido, setContenido] = useState('')
  const [abierto,   setAbierto]   = useState(false)
  const [enviando,  setEnviando]  = useState(false)
  const [error,     setError]     = useState('')

  const enviar = async () => {
    if (!contenido.trim()) { setError('El contenido no puede estar vacío'); return }
    setEnviando(true); setError('')
    try {
      await onPublicar(titulo, contenido)
      setTitulo(''); setContenido(''); setAbierto(false)
    } catch { setError('Error al publicar. Intenta de nuevo.') }
    finally { setEnviando(false) }
  }

  if (!abierto) return (
    <button className={styles.btnAbrir} onClick={() => setAbierto(true)}>
      ✏️ Crear publicación
    </button>
  )

  return (
    <div className={styles.form}>
      <h3 className={styles.titulo}>Nueva publicación</h3>
      <input
        className={styles.input}
        type="text"
        placeholder="Título (opcional)"
        value={titulo}
        onChange={e => setTitulo(e.target.value)}
        maxLength={300}
      />
      <textarea
        className={styles.textarea}
        placeholder="¿Qué quieres compartir con la comunidad?"
        value={contenido}
        onChange={e => setContenido(e.target.value)}
        rows={5}
        maxLength={10000}
      />
      <p className={styles.contador}>{contenido.length}/10000</p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.acciones}>
        <button className={styles.btnCancelar} onClick={() => setAbierto(false)}>Cancelar</button>
        <button className={styles.btnEnviar} onClick={enviar} disabled={enviando || !contenido.trim()}>
          {enviando ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </div>
  )
}
