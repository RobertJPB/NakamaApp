import React, { useState, useEffect, useRef } from 'react'
import { X, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './RuletaModal.module.css'

interface RuletaModalProps {
  lista: any[]
  columnas: any[]
  onClose: () => void
}

export const RuletaModal: React.FC<RuletaModalProps> = ({ lista, columnas, onClose }) => {
  const [filtro, setFiltro] = useState<string>('todos')
  const [girando, setGirando] = useState(false)
  const [resultado, setResultado] = useState<any | null>(null)
  
  // Para la animación de ruleta
  const [itemsCarrusel, setItemsCarrusel] = useState<any[]>([])
  const [offset, setOffset] = useState(0)

  // Filtra los animes según el select (todos o una lista específica)
  const animesDisponibles = lista.filter(entrada => {
    if (filtro === 'todos') return true
    return entrada.estados?.includes(filtro)
  })

  // Genera un carrusel falso para el efecto visual
  const prepararRuleta = () => {
    if (animesDisponibles.length === 0) return

    setResultado(null)
    setGirando(true)
    setOffset(0)

    // Escoger ganador real
    const randomIndex = Math.floor(Math.random() * animesDisponibles.length)
    const ganador = animesDisponibles[randomIndex]

    // Crear un array visual largo para dar la sensación de que da muchas vueltas
    // Llenamos con randoms y ponemos el ganador casi al final (posición 30)
    const totalItemsVisuales = 35
    const posGanador = 30
    const carrusel = []
    
    for (let i = 0; i < totalItemsVisuales; i++) {
      if (i === posGanador) {
        carrusel.push(ganador)
      } else {
        const randomItem = animesDisponibles[Math.floor(Math.random() * animesDisponibles.length)]
        carrusel.push(randomItem)
      }
    }
    
    setItemsCarrusel(carrusel)

    // Pequeño delay para que React aplique el DOM inicial antes de animar
    setTimeout(() => {
      // 120px es el alto de cada item en CSS (incluyendo paddings/gaps) + gap de 16px. Total = 136px por salto.
      // Offset negativo para mover hacia arriba
      const distancia = -(posGanador * 136)
      setOffset(distancia)
      
      // La transición en CSS dura 3s, así que a los 3.2s marcamos el ganador
      setTimeout(() => {
        setGirando(false)
        setResultado(ganador)
      }, 3200)
    }, 50)
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className={styles.title}>¿No sabes qué ver?</h2>
        <p className={styles.subtitle}>Deja que la suerte decida por ti.</p>

        <select 
          className={styles.filterSelect}
          value={filtro}
          onChange={e => {
            setFiltro(e.target.value)
            setResultado(null)
            setItemsCarrusel([])
            setOffset(0)
          }}
          disabled={girando}
        >
          <option value="todos">Cualquier Lista ({lista.length})</option>
          {columnas.map(col => {
            const count = lista.filter(e => e.estados?.includes(col.nombre)).length
            return (
              <option key={col.id} value={col.nombre}>
                {col.nombre} ({count})
              </option>
            )
          })}
        </select>

        <div className={styles.rouletteWindow}>
          <div className={styles.pointer} />
          
          {animesDisponibles.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tienes animes en esta categoría.</p>
            </div>
          ) : (
            <div 
              className={`${styles.itemsContainer} ${girando || resultado ? styles.spinning : ''}`}
              style={{ transform: `translateY(${offset}px)` }}
            >
              {itemsCarrusel.length > 0 ? (
                itemsCarrusel.map((entrada, idx) => (
                  <div 
                    key={`${entrada.animeId}-${idx}`} 
                    className={`${styles.rouletteItem} ${resultado && idx === 30 ? styles.active : ''}`}
                  >
                    <img src={entrada.anime?.imagenUrl} alt="Portada" className={styles.itemImage} />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemTitle}>{entrada.anime?.titulo}</span>
                      <span className={styles.itemType}>{entrada.anime?.tipo || 'TV'} • {entrada.anime?.anio}</span>
                      {entrada.estados?.length > 0 && (
                        <span className={styles.itemEstado}>{entrada.estados[0]}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Estado inicial estático
                <div className={styles.emptyState} style={{ opacity: 0.5 }}>
                  <p>Presiona Girar para comenzar</p>
                </div>
              )}
            </div>
          )}
        </div>

        {resultado ? (
          <div style={{ width: '100%', display: 'flex', gap: '12px' }}>
            <button 
              className={styles.spinBtn} 
              style={{ background: 'var(--color-surface-3)', color: 'var(--color-texto)', flex: 1 }}
              onClick={prepararRuleta}
              disabled={girando || animesDisponibles.length === 0}
            >
              Volver a Tirar
            </button>
            <Link to={`/anime/${resultado.animeId}`} className={styles.watchBtn} style={{ flex: 1 }}>
              <Play size={20} fill="currentColor" /> Ver Anime
            </Link>
          </div>
        ) : (
          <button 
            className={styles.spinBtn} 
            onClick={prepararRuleta}
            disabled={girando || animesDisponibles.length === 0}
          >
            {girando ? 'La suerte está echada...' : 'Girar Ruleta'}
          </button>
        )}
      </div>
    </div>
  )
}
