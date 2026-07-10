import React, { useState } from 'react'
import { useBiblioteca, EstadoLista } from '../../../hooks/useBiblioteca'
import { useAuthStore }               from '../../../store/authStore'
import styles                         from './BotonLista.module.css'

const ESTADOS: { valor: EstadoLista; label: string; emoji: string }[] = [
  { valor: 'viendo',     label: 'Viendo',     emoji: '▶' },
  { valor: 'completado', label: 'Completado', emoji: '✓' },
  { valor: 'pendiente',  label: 'Pendiente',  emoji: '⏸' },
  { valor: 'en_pausa',   label: 'En pausa',   emoji: '⏸' },
  { valor: 'abandonado', label: 'Abandonado', emoji: '✗' },
]

export const BotonLista: React.FC<{ animeId: string }> = ({ animeId }) => {
  const usuario                   = useAuthStore(s => s.usuario)
  const { agregar }               = useBiblioteca(usuario?.id ?? null)
  const [abierto,   setAbierto]   = useState(false)
  const [estadoAct, setEstadoAct] = useState<EstadoLista | null>(null)

  const seleccionar = async (estado: EstadoLista) => {
    await agregar(animeId, estado)
    setEstadoAct(estado)
    setAbierto(false)
  }

  const actual = ESTADOS.find(e => e.valor === estadoAct)

  return (
    <div className={styles.wrap}>
      <button className={`${styles.btn} ${estadoAct ? styles.btnActivo : ''}`} onClick={() => setAbierto(p => !p)}>
        {actual ? `${actual.emoji} ${actual.label}` : '+ Agregar a lista'}
      </button>

      {abierto && (
        <div className={styles.dropdown}>
          {ESTADOS.map(e => (
            <button
              key={e.valor}
              className={`${styles.opcion} ${estadoAct === e.valor ? styles.opcionActiva : ''}`}
              onClick={() => seleccionar(e.valor)}
            >
              <span>{e.emoji}</span> {e.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
