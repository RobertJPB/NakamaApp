import React, { useState } from 'react'
import { Library, Dices, Film, ChevronDown, ChevronUp } from 'lucide-react'
import { Layout } from '../../../components/shared/Layout'
import { useAuth } from '../../../hooks/useAuth'
import { useBiblioteca } from '../../../hooks/useBiblioteca'
import { api } from '../../../lib/axios'
import styles from './RuletaPage.module.css'

type ModoFiltro = 'todos' | 'lista' | 'genero'

const GENEROS = [
  { key: 'Action', label: 'Acción' },
  { key: 'Romance', label: 'Romance' },
  { key: 'Comedy', label: 'Comedia' },
  { key: 'Drama', label: 'Drama' },
  { key: 'Fantasy', label: 'Fantasía' },
  { key: 'Horror', label: 'Terror' },
  { key: 'Mystery', label: 'Misterio' },
  { key: 'Sci-Fi', label: 'Sci-Fi' },
  { key: 'Sports', label: 'Deportes' },
  { key: 'Slice of Life', label: 'Vida Cotidiana' },
]

export const RuletaPage: React.FC = () => {
  const { usuario } = useAuth()
  const { lista, columnas, cargando } = useBiblioteca(usuario?.id ?? null)

  const [modo, setModo] = useState<ModoFiltro>('todos')
  const [listaSeleccionada, setListaSeleccionada] = useState<string>('')
  const [generoSeleccionado, setGeneroSeleccionado] = useState<string>('Action')
  const [generoAbierto, setGeneroAbierto] = useState(false)

  const [girando, setGirando] = useState(false)
  const [resultado, setResultado] = useState<any | null>(null)
  const [itemsCarrusel, setItemsCarrusel] = useState<any[]>([])
  const [offset, setOffset] = useState(0)

  // Pool de animes desde AniList para modo "todos"
  const [animesAniList, setAnimesAniList] = useState<any[]>([])
  const [cargandoAniList, setCargandoAniList] = useState(false)

  React.useEffect(() => {
    if (modo === 'todos') {
      setCargandoAniList(true)
      // Pedimos 3 páginas de populares en paralelo para tener un buen pool de 63 animes
      const paginas = [1, 2, 3, Math.ceil(Math.random() * 10) + 3]
      const params: any = { perPage: 21 }
      if (generoAbierto && generoSeleccionado) {
        params.genero = generoSeleccionado
      }

      Promise.all(
        paginas.map(p => api.get('/api/animes/populares', { params: { ...params, page: p } }).catch(() => ({ data: [] })))
      ).then(resultados => {
        const todos = resultados.flatMap(r => r.data).map((a: any) => ({
          animeId: a.externalId,
          anime: { titulo: a.titulo, imagenUrl: a.imagenUrl, tipo: a.tipo, anio: a.anio, generos: a.generos }
        }))
        // Eliminar duplicados
        const unicos = todos.filter((a, i, arr) => arr.findIndex(b => b.animeId === a.animeId) === i)
        setAnimesAniList(unicos)
      }).finally(() => setCargandoAniList(false))
    }
  }, [modo, generoAbierto, generoSeleccionado])

  // Calcular los animes según el filtro activo
  const animesDisponibles = React.useMemo(() => {
    let base = modo === 'todos' ? animesAniList : lista
    if (modo === 'lista' && listaSeleccionada) {
      base = lista.filter(e => e.estados?.includes(listaSeleccionada))
    }
    
    if (generoAbierto && generoSeleccionado) {
      if (modo === 'todos') {
        // En "todos", la API ya los devolvió filtrados
        return base
      } else {
        // En "lista", filtramos localmente (el backend guardó los géneros en español)
        const generoObj = GENEROS.find(g => g.key === generoSeleccionado)
        const generoLabel = generoObj ? generoObj.label.toLowerCase() : generoSeleccionado.toLowerCase()
        return base.filter(e =>
          e.anime?.generos?.some((g: string) => {
            const gLower = g.toLowerCase()
            return gLower.includes(generoLabel) || gLower.includes(generoSeleccionado.toLowerCase())
          })
        )
      }
    }
    
    return base
  }, [lista, animesAniList, modo, listaSeleccionada, generoAbierto, generoSeleccionado])

  // Auto-seleccionar la primera lista cuando cargan las columnas
  React.useEffect(() => {
    if (columnas.length > 0 && !listaSeleccionada) {
      setListaSeleccionada(columnas[0].nombre)
    }
  }, [columnas])

  // Actualizar preview cuando cargan los datos por primera vez (ej. animesDisponibles se llena)
  React.useEffect(() => {
    if (!girando && !resultado && animesDisponibles.length > 0) {
      setItemsCarrusel(animesDisponibles.slice(0, 5))
      setOffset(0)
    }
  }, [animesDisponibles])

  // Resetear la ruleta cuando el usuario cambia explícitamente algún filtro
  React.useEffect(() => {
    if (!girando) {
      setResultado(null)
      setItemsCarrusel(animesDisponibles.slice(0, 5))
      setOffset(0)
    }
  }, [modo, listaSeleccionada, generoSeleccionado, generoAbierto])

  const prepararRuleta = () => {
    if (animesDisponibles.length === 0) return

    const randomIndex = Math.floor(Math.random() * animesDisponibles.length)
    const ganador = animesDisponibles[randomIndex]

    const totalItemsVisuales = 65
    const posGanador = 60
    const carrusel: any[] = []

    let lastItem: any = null
    for (let i = 0; i < totalItemsVisuales; i++) {
      if (i === posGanador) {
        carrusel.push(ganador)
        lastItem = ganador.animeId
      } else {
        let randomItem = animesDisponibles[Math.floor(Math.random() * animesDisponibles.length)]
        if (animesDisponibles.length > 1) {
          while (
            randomItem.animeId === lastItem ||
            (i === posGanador - 1 && randomItem.animeId === ganador.animeId)
          ) {
            randomItem = animesDisponibles[Math.floor(Math.random() * animesDisponibles.length)]
          }
        }
        carrusel.push(randomItem)
        lastItem = randomItem.animeId
      }
    }

    setResultado(null)
    setGirando(false)

    setTimeout(() => {
      setItemsCarrusel(carrusel)
      setOffset(0)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGirando(true)
          setTimeout(() => {
            const distancia = -(posGanador * 136)
            setOffset(distancia)
            setTimeout(() => {
              setGirando(false)
              setResultado(ganador)
            }, 3200)
          }, 20)
        })
      })
    }, 50)
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        {/* Ruleta - izquierda */}
        <div className={styles.ruletaColumn}>
          <h1 className={styles.title}>¿No sabes qué ver?</h1>
          <p className={styles.subtitle}>Deja que la suerte decida por ti.</p>

          {modo === 'lista' && (
            <select
              className={styles.filterSelect}
              value={listaSeleccionada}
              onChange={e => setListaSeleccionada(e.target.value)}
              disabled={girando || cargando}
            >
              {columnas.map(col => {
                const count = lista.filter(e => e.estados?.includes(col.nombre)).length
                return (
                  <option key={col.id} value={col.nombre}>
                    {col.nombre} ({count})
                  </option>
                )
              })}
            </select>
          )}

          {animesDisponibles.length === 0 && !cargando && (
            <p className={styles.emptyHint}>No hay animes con este filtro.</p>
          )}

          <div className={styles.rouletteWindow}>
            <div className={styles.pointer} />
            {(cargando || (modo === 'todos' && cargandoAniList)) ? (
              <div className={styles.emptyState}><p>Cargando...</p></div>
            ) : animesDisponibles.length === 0 ? (
              <div className={styles.emptyState}><p>Sin animes disponibles.</p></div>
            ) : (
              <div
                className={`${styles.itemsContainer} ${girando ? styles.spinning : ''}`}
                style={{ transform: `translateY(${offset}px)` }}
              >
                {itemsCarrusel.length > 0 ? (
                  itemsCarrusel.map((entrada, idx) => (
                    <div
                      key={`${entrada.animeId}-${idx}`}
                      className={`${styles.rouletteItem} ${resultado && idx === 60 ? styles.active : ''}`}
                    >
                      <img src={entrada.anime?.imagenUrl} alt="Portada" className={styles.itemImage} />
                      <div className={styles.itemInfo}>
                        <span className={styles.itemTitle}>{entrada.anime?.titulo}</span>
                        <span className={styles.itemType}>{entrada.anime?.tipo || 'TV'} • {entrada.anime?.anio}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState} style={{ opacity: 0.5, paddingTop: '100px' }}>
                    <p>Presiona Girar para comenzar</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className={styles.spinBtn}
            onClick={prepararRuleta}
            disabled={girando || animesDisponibles.length === 0 || cargando}
          >
            {girando ? 'La suerte está echada...' : resultado ? 'Volver a Tirar' : 'Girar Ruleta'}
          </button>
        </div>

        {/* Panel de filtros - derecha */}
        <div className={styles.filtrosPanel}>
          <h2 className={styles.filtrosTitle}>Filtrar por</h2>

          {/* Todos */}
          <button
            className={`${styles.modoBtn} ${modo === 'todos' ? styles.modoBtnActive : ''}`}
            onClick={() => { setModo('todos'); setGeneroAbierto(false); }}
          >
            <Dices size={22} className={styles.modoBtnIcon} />
            <div>
              <span className={styles.modoBtnLabel}>Todos</span>
              <span className={styles.modoBtnSub}>Completamente al azar</span>
            </div>
          </button>

          {/* Por Lista */}
          <button
            className={`${styles.modoBtn} ${modo === 'lista' ? styles.modoBtnActive : ''}`}
            onClick={() => { setModo('lista'); setGeneroAbierto(false); if (!listaSeleccionada && columnas[0]) setListaSeleccionada(columnas[0].nombre) }}
          >
            <Library size={22} className={styles.modoBtnIcon} />
            <div>
              <span className={styles.modoBtnLabel}>Por Lista</span>
              <span className={styles.modoBtnSub}>De una de tus listas</span>
            </div>
          </button>

          {/* Por Género - toggle accordion */}
          <button
            className={`${styles.modoBtn} ${generoAbierto ? styles.modoBtnActive : ''}`}
            onClick={() => setGeneroAbierto(v => !v)}
          >
            <Film size={22} className={styles.modoBtnIcon} />
            <div style={{ flex: 1 }}>
              <span className={styles.modoBtnLabel}>Por Género</span>
              <span className={styles.modoBtnSub}>Filtra por tipo de anime</span>
            </div>
            {generoAbierto ? <ChevronUp size={16} className={styles.modoBtnIcon} /> : <ChevronDown size={16} className={styles.modoBtnIcon} />}
          </button>

          {generoAbierto && (
            <div className={styles.subOptions}>
              {GENEROS.map(g => (
                <button
                  key={g.key}
                  className={`${styles.subBtn} ${generoSeleccionado === g.key ? styles.subBtnActive : ''}`}
                  onClick={() => setGeneroSeleccionado(g.key)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
