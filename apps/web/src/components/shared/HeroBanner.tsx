import React from 'react'
import styles from './HeroBanner.module.css'

interface HeroBannerProps {
  titulo:      string
  sinopsis:    string
  imagenUrl:   string
  bannerUrl?:  string
  generos?:    string[]
  anio?:       number
  episodios?:  number
  calificacion?: number
  onAgregarLista?: () => void
  onVerDetalle?:   () => void
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  titulo, sinopsis, imagenUrl, bannerUrl,
  generos, anio, episodios, calificacion,
  onAgregarLista, onVerDetalle
}) => (
  <section className={styles.hero}>
    {/* Fondo con gradiente */}
    <div className={styles.fondo}>
      <img src={bannerUrl || imagenUrl} alt="" aria-hidden />
      <div className={styles.gradiente} />
    </div>

    {/* Contenido */}
    <div className={styles.contenido}>
      <div className={styles.poster}>
        <img src={imagenUrl} alt={titulo} />
      </div>
      <div className={styles.info}>
        {generos && (
          <div className={styles.generos}>
            {generos.slice(0, 3).map(g => (
              <span key={g} className={styles.genero}>{g}</span>
            ))}
          </div>
        )}
        <h1 className={styles.titulo}>{titulo}</h1>
        <div className={styles.meta}>
          {calificacion && <span className={styles.rating}>★ {calificacion.toFixed(1)}</span>}
          {anio         && <span>{anio}</span>}
          {episodios    && <span>{episodios} eps</span>}
        </div>
        <p className={styles.sinopsis}>{sinopsis}</p>
        <div className={styles.acciones}>
          <button className={styles.btnPrimario} onClick={onVerDetalle}>
            ▶ Ver detalle
          </button>
          <button className={styles.btnSecundario} onClick={onAgregarLista}>
            + Agregar a lista
          </button>
        </div>
      </div>
    </div>
  </section>
)
