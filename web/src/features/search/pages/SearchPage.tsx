import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../../components/shared/Layout'
import { api } from '../../../lib/axios'
import { Search, Tv, User, MessageSquare, Users, Library } from 'lucide-react'
import styles from './SearchPage.module.css'

// Reutilizamos componentes donde sea posible. Si no los tenemos importados aquí, crearemos unas vistas sencillas o importaremos los reales.
import { AnimeCard } from '../../../components/ui/AnimeCard'

type Tab = 'todo' | 'animes' | 'usuarios' | 'resenas' | 'comunidades' | 'listas'

const TAB_CONFIG: Record<Tab, { label: string; icon: React.ReactNode }> = {
  todo:        { label: 'Todo',        icon: <Search size={14} /> },
  animes:      { label: 'Animes',      icon: <Tv size={14} /> },
  usuarios:    { label: 'Usuarios',    icon: <User size={14} /> },
  resenas:     { label: 'Reseñas',     icon: <MessageSquare size={14} /> },
  comunidades: { label: 'Comunidades', icon: <Users size={14} /> },
  listas:      { label: 'Listas',      icon: <Library size={14} /> },
}

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('todo')
  const [cargando, setCargando] = useState(false)
  
  const [resultados, setResultados] = useState({
    animes: [] as any[],
    usuarios: [] as any[],
    resenas: [] as any[],
    comunidades: [] as any[],
    listas: [] as any[],
  })

  useEffect(() => {
    if (!q || q.length < 2) {
      setResultados({ animes: [], usuarios: [], resenas: [], comunidades: [], listas: [] })
      return
    }

    const fetchResultados = async () => {
      setCargando(true)
      try {
        const query = encodeURIComponent(q)
        const [animesResp, usuariosResp, resenasResp, comunidadesResp, listasResp] = await Promise.all([
          api.get(`/api/animes?busqueda=${query}&limit=20`).catch(() => ({ data: [] })),
          api.get(`/api/usuarios/buscar?q=${query}`).catch(() => ({ data: [] })),
          api.get(`/api/resenas/buscar?q=${query}`).catch(() => ({ data: [] })),
          api.get(`/api/comunidades/buscar?q=${query}`).catch(() => ({ data: [] })),
          api.get(`/api/colecciones/buscar?q=${query}`).catch(() => ({ data: [] })),
        ])

        setResultados({
          animes: Array.isArray(animesResp.data) ? animesResp.data : (animesResp.data.animes ?? []),
          usuarios: Array.isArray(usuariosResp.data) ? usuariosResp.data : [],
          resenas: Array.isArray(resenasResp.data) ? resenasResp.data : [],
          comunidades: Array.isArray(comunidadesResp.data) ? comunidadesResp.data : [],
          listas: Array.isArray(listasResp.data) ? listasResp.data : [],
        })
      } finally {
        setCargando(false)
      }
    }

    fetchResultados()
  }, [q])

  const renderEmpty = (mensaje = 'No se encontraron resultados') => (
    <div className={styles.emptyState}>{mensaje}</div>
  )

  const renderAnimes = (limit?: number) => {
    const list = limit ? resultados.animes.slice(0, limit) : resultados.animes
    if (list.length === 0) return renderEmpty('No se encontraron animes')
    return (
      <div className={styles.animeGrid}>
        {list.map(anime => (
          <AnimeCard 
            key={anime.externalId} 
            externalId={anime.externalId}
            titulo={anime.titulo}
            imagenUrl={anime.imagenUrl}
            tipo={anime.tipo}
            anio={anime.anio}
            calificacion={anime.calificacionPromedio}
            onClick={() => navigate(`/anime/${anime.externalId}`)}
          />
        ))}
      </div>
    )
  }

  const renderUsuarios = (limit?: number) => {
    const list = limit ? resultados.usuarios.slice(0, limit) : resultados.usuarios
    if (list.length === 0) return renderEmpty('No se encontraron usuarios')
    return (
      <div className={styles.listContainer}>
        {list.map(user => (
          <div key={user.id} className={styles.userRow} onClick={() => navigate(`/perfil/${user.username}`)}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className={styles.userAvatar} />
            ) : (
              <div className={styles.userAvatarFallback}>{user.nombreDisplay?.[0] || user.username[0]}</div>
            )}
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.nombreDisplay || user.username}</div>
              <div className={styles.userHandle}>@{user.username}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderResenas = (limit?: number) => {
    const list = limit ? resultados.resenas.slice(0, limit) : resultados.resenas
    if (list.length === 0) return renderEmpty('No se encontraron reseñas')
    return (
      <div className={styles.listContainer}>
        {list.map(resena => (
          <div key={resena.id} className={styles.resenaCard} onClick={() => navigate(`/anime/${resena.anime?.externalId}`)}>
            <div className={styles.resenaHeader}>
              <span>{resena.usuario?.username} sobre <strong>{resena.anime?.titulo}</strong></span>
              <span style={{ color: 'var(--color-acento)' }}>★ {resena.calificacion}</span>
            </div>
            <p className={styles.resenaContent}>{resena.contenido}</p>
          </div>
        ))}
      </div>
    )
  }

  const renderComunidades = (limit?: number) => {
    const list = limit ? resultados.comunidades.slice(0, limit) : resultados.comunidades
    if (list.length === 0) return renderEmpty('No se encontraron comunidades')
    return (
      <div className={styles.listContainer}>
        {list.map(com => (
          <div key={com.id} className={styles.comunidadCard} onClick={() => navigate(`/comunidades/${com.id}`)}>
            <div className={styles.comName}>{com.nombre}</div>
            <div className={styles.comDesc}>{com.descripcion}</div>
            <div className={styles.comMeta}>{com._count?.miembros ?? 0} miembros</div>
          </div>
        ))}
      </div>
    )
  }

  const renderListas = (limit?: number) => {
    const list = limit ? resultados.listas.slice(0, limit) : resultados.listas
    if (list.length === 0) return renderEmpty('No se encontraron listas')
    return (
      <div className={styles.listContainer}>
        {list.map(lista => (
          <div key={lista.id} className={styles.comunidadCard} onClick={() => navigate(`/listas/${lista.id}`)}>
            <div className={styles.comName}>{lista.titulo}</div>
            <div className={styles.comDesc}>{lista.descripcion}</div>
            <div className={styles.comMeta}>Por {lista.usuario?.username}</div>
          </div>
        ))}
      </div>
    )
  }

  const renderTodo = () => {
    const totalResults = resultados.animes.length + resultados.usuarios.length + 
                         resultados.resenas.length + resultados.comunidades.length + 
                         resultados.listas.length

    if (totalResults === 0) {
      return renderEmpty('No se encontraron resultados para tu búsqueda')
    }

    return (
      <div className={styles.todoContainer}>
        {resultados.animes.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Animes</h3>
            </div>
            {renderAnimes()}
          </section>
        )}

        {resultados.usuarios.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Usuarios</h3>
              {resultados.usuarios.length > 4 && <button onClick={() => setTab('usuarios')}>Ver más</button>}
            </div>
            {renderUsuarios(4)}
          </section>
        )}

        {resultados.resenas.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Reseñas</h3>
              {resultados.resenas.length > 3 && <button onClick={() => setTab('resenas')}>Ver más</button>}
            </div>
            {renderResenas(3)}
          </section>
        )}

        {resultados.comunidades.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Comunidades</h3>
              {resultados.comunidades.length > 3 && <button onClick={() => setTab('comunidades')}>Ver más</button>}
            </div>
            {renderComunidades(3)}
          </section>
        )}

        {resultados.listas.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Listas</h3>
              {resultados.listas.length > 3 && <button onClick={() => setTab('listas')}>Ver más</button>}
            </div>
            {renderListas(3)}
          </section>
        )}
      </div>
    )
  }

  return (
    <Layout>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <h1 className={styles.titulo}>Resultados para "{q}"</h1>
        </div>

        <div className={styles.toggles}>
          {(Object.entries(TAB_CONFIG) as [Tab, { label: string, icon: React.ReactNode }][]).map(([key, c]) => (
            <button
              key={key}
              className={`${styles.toggle} ${tab === key ? styles.toggleActivo : ''}`}
              onClick={() => setTab(key)}
            >
              <span className={styles.tabIcon}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className={styles.loading}>Buscando...</div>
        ) : q.length < 2 ? (
          <div className={styles.emptyState}>Ingresa al menos 2 caracteres para buscar.</div>
        ) : (
          <div className={styles.content}>
            {tab === 'todo' && renderTodo()}
            {tab === 'animes' && renderAnimes()}
            {tab === 'usuarios' && renderUsuarios()}
            {tab === 'resenas' && renderResenas()}
            {tab === 'comunidades' && renderComunidades()}
            {tab === 'listas' && renderListas()}
          </div>
        )}
      </div>
    </Layout>
  )
}
