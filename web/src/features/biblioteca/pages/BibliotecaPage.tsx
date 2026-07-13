import React, { useState } from 'react'
import { Layout }          from '../../../components/shared/Layout'
import { AnimeCard }       from '../../../components/ui/AnimeCard'
import { useBiblioteca, EstadoLista } from '../../../hooks/useBiblioteca'
import { useAuthStore }    from '../../../store/authStore'
import styles              from './BibliotecaPage.module.css'

const TABS: { valor: EstadoLista | 'todos'; label: string; emoji: string }[] = [
  { valor: 'todos',     label: 'Todos',     emoji: '📋' },
  { valor: 'viendo',    label: 'Viendo',    emoji: '▶' },
  { valor: 'completado',label: 'Completados',emoji: '✓' },
  { valor: 'pendiente', label: 'Pendientes', emoji: '⏳' },
  { valor: 'en_pausa',  label: 'En pausa',  emoji: '⏸' },
  { valor: 'abandonado',label: 'Abandonados',emoji: '✗' },
]

export const BibliotecaPage: React.FC = () => {
  const usuario                 = useAuthStore(s => s.usuario)
  const { lista, stats, cargando, eliminar } = useBiblioteca(usuario?.id ?? null)
  const [tab,    setTab]        = useState<EstadoLista | 'todos'>('todos')
  const [ruleta, setRuleta]     = useState<any | null>(null)
  const [girando, setGirando]   = useState(false)

  const listaFiltrada = tab === 'todos' ? lista : lista.filter((e: any) => e.estado === tab)

  const girarRuleta = () => {
    const pendientes = lista.filter((e: any) => e.estado === 'pendiente')
    if (!pendientes.length) return
    setGirando(true)
    setRuleta(null)
    setTimeout(() => {
      const ganador = pendientes[Math.floor(Math.random() * pendientes.length)]
      setRuleta(ganador)
      setGirando(false)
    }, 1500)
  }

  return (
    <Layout>
      <div className={styles.wrap}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Mi Biblioteca</h1>
            <p className={styles.subtitulo}>Tu historial de anime personal</p>
          </div>
          <button className={styles.btnRuleta} onClick={girarRuleta}>
            🎲 Ruleta de anime
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className={styles.statsGrid}>
            {TABS.filter(t => t.valor !== 'todos').map(t => (
              <button
                key={t.valor}
                className={`${styles.statCard} ${tab === t.valor ? styles.statActivo : ''}`}
                onClick={() => setTab(tab === t.valor ? 'todos' : t.valor as EstadoLista)}
              >
                <span className={styles.statEmoji}>{t.emoji}</span>
                <strong className={styles.statNum}>{stats[t.valor as EstadoLista] ?? 0}</strong>
                <span className={styles.statLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Ruleta resultado */}
        {(girando || ruleta) && (
          <div className={styles.ruletaCard}>
            {girando ? (
              <div className={styles.ruletaGirando}>
                <span className={styles.ruletaSpinner}>🎲</span>
                <p>Eligiendo tu próximo anime...</p>
              </div>
            ) : ruleta && (
              <div className={styles.ruletaResultado}>
                <img src={ruleta.anime?.imagenUrl} alt={ruleta.anime?.titulo} className={styles.ruletaImg} />
                <div className={styles.ruletaInfo}>
                  <p className={styles.ruletaLabel}>Esta noche ve:</p>
                  <h3 className={styles.ruletaTitulo}>{ruleta.anime?.titulo}</h3>
                  <a href={`/anime/${ruleta.anime?.anilistId}`} className={styles.ruletaBtn}>
                    Ver detalle →
                  </a>
                </div>
                <button className={styles.ruletaCerrar} onClick={() => setRuleta(null)}>✕</button>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.valor}
              className={`${styles.tab} ${tab === t.valor ? styles.tabActivo : ''}`}
              onClick={() => setTab(t.valor)}
            >
              {t.emoji} {t.label}
              <span className={styles.tabCount}>
                {t.valor === 'todos' ? lista.length : (stats?.[t.valor as EstadoLista] ?? 0)}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {cargando ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className={styles.vacio}>
            <p>No tienes animes en esta sección.</p>
            <a href="/descubrir" className={styles.btnDescubrir}>Descubrir anime →</a>
          </div>
        ) : (
          <div className={styles.grid}>
            {listaFiltrada.map((entrada: any) => (
              <div key={entrada.animeId} className={styles.entradaWrap}>
                <AnimeCard
                  anilistId={entrada.anime?.anilistId}
                  titulo={entrada.anime?.titulo}
                  imagenUrl={entrada.anime?.imagenUrl}
                  estado={entrada.estado}
                  calificacion={entrada.calificacion}
                  onClick={() => window.location.href = `/anime/${entrada.anime?.anilistId}`}
                />
                <button
                  className={styles.btnEliminar}
                  onClick={() => eliminar(entrada.animeId)}
                  title="Eliminar de lista"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
