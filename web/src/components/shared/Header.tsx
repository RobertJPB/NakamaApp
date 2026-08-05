import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Sliders, Bell, Menu, X, Library, Table2, Settings, Trophy, LogOut } from 'lucide-react'
import { RuletaIcon } from '../icons/RuletaIcon'
import { useAuth } from '../../hooks/useAuth'
import { useNotificaciones } from '../../hooks/useNotificaciones'
import { api } from '../../lib/axios'
import styles from './Header.module.css'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export const Header: React.FC = () => {
  const { usuario, estaAutenticado, signOut, cargando } = useAuth()
  const { notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas } = useNotificaciones()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [animesRes, setAnimesRes] = useState<any[]>([])
  const [usuariosRes, setUsuariosRes] = useState<any[]>([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarNotif, setMostrarNotif] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setAnimesRes([])
      setUsuariosRes([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscando(true)
      try {
        const [animesResp, usuariosResp] = await Promise.all([
          api.get(`/api/animes?busqueda=${encodeURIComponent(busqueda)}&limit=4`).catch(() => ({ data: [] })),
          api.get(`/api/usuarios/buscar?q=${encodeURIComponent(busqueda)}`).catch(() => ({ data: [] })),
        ])
        setAnimesRes(Array.isArray(animesResp.data) ? animesResp.data : (animesResp.data.animes ?? []))
        setUsuariosRes(Array.isArray(usuariosResp.data) ? usuariosResp.data : [])
      } finally {
        setBuscando(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAnimesRes([])
        setUsuariosRes([])
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setMostrarNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeDropdown = () => {
    setAnimesRes([])
    setUsuariosRes([])
    setBusqueda('')
    setSearchExpanded(false)
  }

  const hayResultados = animesRes.length > 0 || usuariosRes.length > 0
  const perfilPath = usuario?.username ? `/perfil/${usuario.username}` : (usuario ? '/perfil/editar' : '/auth')

  return (
    <header className={styles.headerContainer}>


      <div className={styles.headerMain}>
        <div className={styles.headerLeft}>
          {!searchExpanded && (
            <Link to="/" className={styles.logoLink}>
              <img src="/nakama-cat-new.jpg" alt="Nakama Logo" className={styles.logoImg} />
            </Link>
          )}

          <div className={`${styles.searchBarWrapper} ${searchExpanded ? styles.searchExpanded : ''}`} ref={dropdownRef}>
            <div className={styles.searchBar}>
              <Search 
                className={styles.searchIcon} 
                size={window.innerWidth <= 768 ? 16 : 18} 
                onClick={() => {
                  if (window.innerWidth <= 768) {
                    setSearchExpanded(true)
                  }
                }}
              />
              <input 
                type="text" 
                placeholder="Buscar animes o usuarios..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && busqueda.trim().length > 1) {
                    closeDropdown()
                    navigate(`/buscar?q=${encodeURIComponent(busqueda.trim())}`)
                  }
                }}
              />
              {searchExpanded && (
                <button className={styles.searchCloseBtn} onClick={(e) => { e.stopPropagation(); setSearchExpanded(false); }}>
                  <X size={20} />
                </button>
              )}
              <button className={styles.filterBtn} onClick={() => navigate('/buscar')}>
                <Sliders size={18} />
              </button>
            </div>
            
            {(hayResultados || buscando) && (
              <div className={styles.searchDropdown}>
                {buscando ? (
                  <div className={styles.searchLoading}>Buscando...</div>
                ) : (
                  <>
                    {/* Sección Usuarios */}
                    {usuariosRes.length > 0 && (
                      <div>
                        <div className={styles.searchSectionLabel}>Usuarios</div>
                        {usuariosRes.map(user => (
                          <div
                            key={user.id}
                            className={styles.searchResultItem}
                            onClick={() => { closeDropdown(); navigate(`/perfil/${user.username}`) }}
                          >
                            <div className={styles.userAvatarWrap}>
                              {user.avatarUrl
                                ? <img src={user.avatarUrl} alt={user.username} className={styles.userAvatarImg} />
                                : <div className={styles.userAvatarFallback}>{(user.nombreDisplay?.[0] || user.username?.[0] || 'U').toUpperCase()}</div>
                              }
                            </div>
                            <div className={styles.searchResultInfo}>
                              <div className={styles.searchResultTitle}>{user.nombreDisplay || user.username}</div>
                              <div className={styles.searchResultYear}>@{user.username} · {user._count?.seguidores ?? 0} seguidores</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sección Animes */}
                    {animesRes.length > 0 && (
                      <div>
                        <div className={styles.searchSectionLabel}>Animes</div>
                        {animesRes.map(anime => (
                          <div 
                            key={anime.id || anime.externalId} 
                            className={styles.searchResultItem}
                            onClick={() => { closeDropdown(); navigate(`/anime/${anime.externalId}`) }}
                          >
                            <img src={anime.imagenUrl} alt={anime.titulo} className={styles.searchResultImg} />
                            <div className={styles.searchResultInfo}>
                              <div className={styles.searchResultTitle}>{anime.titulo}</div>
                              <div className={styles.searchResultYear}>{anime.temporadaAnio || anime.estadoEmision}</div>
                            </div>
                          </div>
                        ))}
                        <div 
                          className={styles.searchVerTodos}
                          onClick={() => { closeDropdown(); navigate(`/descubrir?q=${encodeURIComponent(busqueda.trim())}`) }}
                        >
                          Ver todos los animes →
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.headerRightMobile}>
          {!estaAutenticado && !searchExpanded && !cargando && (
            <Link to="/auth" className={styles.mobileLoginBtn}>
              Iniciar Sesión
            </Link>
          )}
          {!searchExpanded && (
            <button className={styles.mobileMenuBtn} onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}>
              <Menu size={24} className={`${styles.hamburgerIcon} ${menuMovilAbierto ? styles.hamburgerIconOpen : ''}`} />
            </button>
          )}
          
          {menuMovilAbierto && (
            <>
              <div className={styles.mobileMenuOverlay} onClick={() => setMenuMovilAbierto(false)} />
              <div className={styles.mobileMenuDropdown}>
                <Link to="/mi-lista" className={styles.mobileMenuLink} onClick={() => setMenuMovilAbierto(false)}>
                  <Library size={18} /> Mis Listas
                </Link>
                <Link to="/tierlist" className={styles.mobileMenuLink} onClick={() => setMenuMovilAbierto(false)}>
                  <Table2 size={18} /> Tier Lists
                </Link>
                <Link to="/ruleta" className={styles.mobileMenuLink} onClick={() => setMenuMovilAbierto(false)}>
                  <RuletaIcon size={18} /> Ruleta
                </Link>
                <Link to="/ranking" className={styles.mobileMenuLink} onClick={() => setMenuMovilAbierto(false)}>
                  <Trophy size={18} /> Ranking
                </Link>
                <div className={styles.dropdownDivider} style={{ margin: '8px 0', backgroundColor: 'rgba(255,255,255,0.05)', height: '1px' }} />
                <Link to="/configuracion" className={styles.mobileMenuLink} onClick={() => setMenuMovilAbierto(false)}>
                  <Settings size={18} /> Configuración
                </Link>
                {estaAutenticado && (
                  <button 
                    className={`${styles.mobileMenuLink} ${styles.mobileMenuLinkDanger}`} 
                    style={{ color: '#ef4444', width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                    onClick={async () => {
                      setMenuMovilAbierto(false)
                      sessionStorage.setItem('isLoggingOut', 'true')
                      await signOut()
                      navigate('/')
                    }}
                  >
                    <LogOut size={18} /> Cerrar sesión
                  </button>
                )}
              </div>
            </>
          )}
        </div>

      <div className={styles.headerRight}>
        {estaAutenticado && (
          <div className={styles.notifWrapper} ref={notifRef}>
            <button 
              className={styles.headerActionBtn} 
              title="Notificaciones"
              onClick={() => setMostrarNotif(!mostrarNotif)}
            >
              <Bell size={18} />
              {noLeidas > 0 && <span className={styles.badgeCount}>{noLeidas > 9 ? '+9' : noLeidas}</span>}
            </button>

            {mostrarNotif && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span>Notificaciones</span>
                  {noLeidas > 0 && (
                    <button className={styles.notifMarkAll} onClick={marcarTodasComoLeidas}>
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notificaciones.length === 0 ? (
                    <div className={styles.notifEmpty}>No tienes notificaciones.</div>
                  ) : (
                    notificaciones.map(n => (
                      <button 
                        key={n.id} 
                        className={`${styles.notifItem} ${n.leida ? '' : styles.unread}`}
                        onClick={() => {
                          if (!n.leida) marcarComoLeida(n.id)
                          setMostrarNotif(false)
                          if (n.actor?.username) {
                            if (n.tipo === 'like_resena' || n.tipo === 'comentario_publicacion') {
                              navigate(`/perfil/${usuario?.username || usuario?.user_metadata?.username}`)
                            } else {
                              navigate(`/perfil/${n.actor.username}`)
                            }
                          }
                        }}
                      >
                        <div className={styles.notifAvatar}>
                          {n.actor?.avatarUrl 
                            ? <img src={n.actor.avatarUrl} alt="" />
                            : <div className={styles.notifAvatarFallback}>{(n.actor?.nombreDisplay?.[0] || 'U').toUpperCase()}</div>
                          }
                        </div>
                        <div className={styles.notifContent}>
                          <strong>{n.actor?.nombreDisplay}</strong> {n.mensaje}
                          <span className={styles.notifTime}>
                            {formatDistanceToNow(new Date(n.creadoEn), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {estaAutenticado ? (
          <div className={styles.profileWidgetContainer}>
            <Link to={usuario?.username || usuario?.user_metadata?.username ? `/perfil/${usuario?.username || usuario?.user_metadata?.username}` : "/perfil/editar"} className={styles.profileWidgetBtn}>
              <div className={styles.profileWidget}>
                <div className={`${styles.profileAvatar} ${!usuario?.avatarUrl ? styles.profileAvatarFallback : ''}`}>
                  {usuario?.avatarUrl
                    ? <img
                        src={usuario?.avatarUrl}
                        alt="avatar"
                        className={styles.avatarImg}
                      />
                    : (usuario?.nombreDisplay?.[0] || usuario?.user_metadata?.nombre?.[0] || usuario?.user_metadata?.full_name?.[0] || usuario?.user_metadata?.name?.[0] || usuario?.user_metadata?.username?.[0] || usuario?.user_metadata?.preferred_username?.[0] || 'U').toUpperCase()
                  }
                  {usuario?.user_metadata?.marco && (
                    <img src={usuario.user_metadata.marco} alt="" className={styles.marcoOverlayNav} />
                  )}
                </div>
                <div className={styles.profileMeta}>
                  <p className={styles.profileName}>
                    {usuario?.username ? `@${usuario.username}` : 'Mi perfil'}
                  </p>
                </div>
              </div>
            </Link>
            
            {/* Dropdown Menu */}
            <div className={styles.profileDropdown}>
              <Link to={usuario?.username || usuario?.user_metadata?.username ? `/perfil/${usuario?.username || usuario?.user_metadata?.username}` : "/perfil/editar"} className={styles.dropdownItem}>
                Ver perfil
              </Link>
              <Link to="/perfil/editar" className={styles.dropdownItem}>
                Editar perfil
              </Link>
              <Link to="/configuracion" className={styles.dropdownItem}>
                Configuración
              </Link>
              <div className={styles.dropdownDivider}></div>
              <button onClick={async () => {
                sessionStorage.setItem('isLoggingOut', 'true')
                await signOut()
                navigate('/')
              }} className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}>
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : !cargando ? (
          <div className={styles.authButtons}>
            <Link to="/auth" className={styles.btnLogin}>Entrar</Link>
            <Link to="/auth?register=true" className={styles.btnRegister}>Registrarse</Link>
          </div>
        ) : (
          <div style={{ width: 140 }}></div>
        )}
      </div>
      </div>
    </header>
  )
}
