import React, { useState } from 'react'
import { useBiblioteca } from '../../../hooks/useBiblioteca'
import { useAuthStore }    from '../../../store/authStore'
import styles              from './BotonLista.module.css'
import { Heart, Clock, Eye, CheckSquare, Tv, Film, Folder } from 'lucide-react'

const getIconForList = (nombre: string) => {
  const nombreLower = nombre.toLowerCase()
  if (nombreLower.includes('me gusta')) return <Heart size={16} color="#ff4757" />
  if (nombreLower.includes('por ver') || nombreLower.includes('plan to watch')) return <Clock size={16} color="#ffa502" />
  if (nombreLower.includes('viendo') || nombreLower.includes('watching')) return <Eye size={16} color="#27ae60" />
  if (nombreLower.includes('terminado') || nombreLower.includes('completed')) return <CheckSquare size={16} color="#1e90ff" />
  if (nombreLower.includes('series')) return <Tv size={16} color="#9c88ff" />
  if (nombreLower.includes('películas') || nombreLower.includes('peliculas') || nombreLower.includes('movies')) return <Film size={16} color="#ff6b81" />
  return <Folder size={16} color="#a4b0be" />
}

export const BotonLista: React.FC<{ animeId: string }> = ({ animeId }) => {
  const usuario                                 = useAuthStore(s => s.usuario)
  const { columnas, agregar, lista }            = useBiblioteca(usuario?.id ?? null)
  const [abierto,   setAbierto]                 = useState(false)

  // Find if this anime is already in any list
  const entradaActual = lista?.find((e: any) => e.animeId === animeId)
  const estadosActivos = entradaActual?.estados || []

  const seleccionar = async (estado: string) => {
    await agregar(animeId, estado)
  }

  return (
    <div className={styles.wrap}>
      <button className={`${styles.btn} ${abierto ? styles.btnAbierto : ''}`} onClick={() => setAbierto(p => !p)}>
        Añadir a Lista
      </button>

      {abierto && (
        <div className={styles.dropdown}>
          {columnas.map((col: any) => (
            <button
              key={col.id}
              className={`${styles.opcion} ${estadosActivos.includes(col.nombre) ? styles.opcionActiva : ''}`}
              onClick={() => seleccionar(col.nombre)}
            >
              {getIconForList(col.nombre)} {col.nombre}
            </button>
          ))}
          {columnas.length === 0 && (
            <div className={styles.opcion} style={{ color: 'var(--color-texto-muted)', cursor: 'default' }}>
              No tienes listas
            </div>
          )}
        </div>
      )}
    </div>
  )
}

