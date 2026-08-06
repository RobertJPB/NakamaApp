import React from 'react'
import { useNoticias } from '../../../hooks/useNoticias'
import { ExternalLink, Calendar } from 'lucide-react'
import styles from './NewsSection.module.css'

interface NewsSectionProps {
  title?: string;
  compact?: boolean;
  limit?: number;
  forceLoading?: boolean;
}

export function NewsSection({ title = "Noticias de Anime", compact = false, limit, forceLoading }: NewsSectionProps) {
  const { noticias, cargando } = useNoticias(limit || (compact ? 6 : 60), compact ? 'popular' : 'default')
  const skeletonCount = Math.min(limit || (compact ? 6 : 60), 12)

  if (cargando || forceLoading) {
    return (
      <div className={`${styles.newsContainer} ${compact ? styles.compactContainer : ''}`}>
        <h2 className={styles.title}>{title}</h2>
        <div className={`${styles.newsList} ${compact ? styles.compactList : ''}`}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className={`${styles.newsCard} ${compact ? styles.compactCard : ''}`} style={{ display: 'flex', gap: '12px' }}>
              <div className={styles.newsImageWrapper} style={{ background: 'var(--color-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div className={styles.newsContent}>
                <div style={{ height: 14, width: '100%', background: 'var(--color-surface-2)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 14, width: '80%', background: 'var(--color-surface-2)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                {!compact && <div style={{ height: 12, width: '40%', background: 'var(--color-surface-2)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!noticias.length) return null

  return (
    <div className={`${styles.newsContainer} ${compact ? styles.compactContainer : ''}`}>
      <h2 className={styles.title}>{title}</h2>
      <div className={`${styles.newsList} ${compact ? styles.compactList : ''}`}>
        {noticias.map(noticia => (
          <a key={noticia.id} href={noticia.urlOrigen} target="_blank" rel="noopener noreferrer" className={`${styles.newsCard} ${compact ? styles.compactCard : ''}`}>
            {noticia.imagenUrl ? (
              <div className={styles.newsImageWrapper}>
                <img 
                  src={noticia.imagenUrl} 
                  alt={noticia.titulo} 
                  className={styles.newsImage} 
                  loading="lazy" 
                  decoding="async"
                />
              </div>
            ) : (
              <div className={styles.newsImageWrapper} style={{ backgroundColor: 'var(--color-primary)', opacity: 0.2 }} />
            )}
            <div className={styles.newsContent}>
              <h3 className={styles.newsTitle}>{noticia.titulo}</h3>
              <p className={styles.newsSummary}>{noticia.resumen}</p>
              <div className={styles.newsMeta}>
                <span className={styles.newsDate}>
                  <Calendar size={14} /> {new Date(noticia.fechaPublicacion).toLocaleDateString()}
                </span>
                <span className={styles.newsSource}>
                  Para leer más en {noticia.fuente} <ExternalLink size={12} />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
