import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../../components/shared/Layout'
import { api }    from '../../../lib/axios'
import { useAuth } from '../../../hooks/useAuth'
import { useAuthStore } from '../../../store/authStore'
import styles from './ConfiguracionPage.module.css'

const COLORES_BANNER = [
  // Oscuros
  '#1d3557', '#2b2d42', '#4a3f35', '#1e392a', '#3d2b38',
  // Medios
  '#506fe0', '#7434a3', '#d14981', '#da5b5b', '#8b5e34', '#46ba9f', '#e07a5f',
  // Claros
  '#a8dadc', '#f4a261', '#e9c46a', '#cdb4db', '#d8e2dc',
  
  // Gradients
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', // Sunset
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Mint Blue
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Purple Pink
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Soft Rose
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Neon Green
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Peach
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Deep Space
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Plum Plate
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', // Blood Red
  'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)', // Ocean
  'linear-gradient(135deg, #93a5cf 0%, #e4efe9 100%)', // Cloudy
  'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)', // Twilight
  'linear-gradient(135deg, #09203f 0%, #537895 100%)', // Dark Knight
  'linear-gradient(135deg, #b224ef 0%, #7579ff 100%)', // Cyberpunk
  'linear-gradient(135deg, #16a085 0%, #f4d03f 100%)', // Green Gold

  // Imágenes Anime (Dibujadas)
  '/banners/anime2.png', // Sakura
  '/banners/anime4.png', // Countryside
]

export const ConfiguracionPage: React.FC = () => {
  const navigate = useNavigate()
  const { usuario: usuarioAuth, estaAutenticado, signOut } = useAuth()
  const setUsuario = useAuthStore(s => s.setUsuario)
  const [cargando, setCargando]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito]         = useState(false)
  const [error, setError]         = useState('')

  const [form, setForm] = useState({
    nombreDisplay: usuarioAuth?.nombreDisplay || usuarioAuth?.user_metadata?.nombre || '',
    username:      usuarioAuth?.username || usuarioAuth?.user_metadata?.username || '',
    bio:           usuarioAuth?.bio || '',
    sitioWeb:      usuarioAuth?.sitioWeb || '',
    avatarUrl:     usuarioAuth?.avatarUrl || '',
    bannerUrl:     usuarioAuth?.bannerUrl || '',
    marcoUrl:      usuarioAuth?.marcoUrl || '',
    perfilPrivado:    usuarioAuth?.perfilPrivado ?? false,
    resenasPublicas:  usuarioAuth?.resenasPublicas ?? true,
    listasPublicas:   usuarioAuth?.listasPublicas ?? true,
  })

  // Para preview local de las imágenes
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [previewBanner, setPreviewBanner] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!estaAutenticado) return
    api.get('/api/usuarios/me')
      .then(({ data }) => {
        setForm({
          nombreDisplay:   data.nombreDisplay ?? '',
          username:        data.username      ?? '',
          bio:             data.bio           ?? '',
          sitioWeb:        data.sitioWeb      ?? '',
          avatarUrl:       data.avatarUrl     ?? '',
          bannerUrl:       data.bannerUrl     ?? '',
          marcoUrl:        data.marcoUrl      ?? '',
          perfilPrivado:   data.perfilPrivado  ?? false,
          resenasPublicas: data.resenasPublicas ?? true,
          listasPublicas:  data.listasPublicas  ?? true,
        })
        if (data.avatarUrl) setPreviewAvatar(data.avatarUrl)
        if (data.bannerUrl) setPreviewBanner(data.bannerUrl)
      })
      .finally(() => setCargando(false))
  }, [estaAutenticado])

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string) => void,
    field: 'avatarUrl' | 'bannerUrl'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setPreview(url)
      setForm(f => ({ ...f, [field]: url }))
    }
    reader.readAsDataURL(file)
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.nombreDisplay.trim()) {
      setError('El nombre de visualización es obligatorio')
      return
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      setError('El username debe tener al menos 3 caracteres')
      return
    }

    setGuardando(true)
    setError('')
    setExito(false)
    try {
      const { data } = await api.put('/api/usuarios/me', form)
      setExito(true)
      // Re-sync store
      if (usuarioAuth) {
        const merged = {
          ...usuarioAuth,
          ...data,
          user_metadata: {
            ...usuarioAuth.user_metadata,
            username:   data.username,
            nombre:     data.nombreDisplay,
            avatar:     data.avatarUrl,
          }
        }
        setUsuario(merged)
      }
      // Redirect to the profile page
      navigate(`/perfil/${data.username}`)
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  // Pantalla de carga eliminada para permitir carga optimista instantánea
  return (
    <Layout hideNav={!usuarioAuth?.username || !usuarioAuth?.nombreDisplay}>
      <div className={styles.page}>
        <div className={styles.container}>

          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Configuración de perfil</h1>
            <p className={styles.pageSubtitle}>Personaliza cómo te ven los demás en Nakama</p>
          </div>

          {(!usuarioAuth?.username || !usuarioAuth?.nombreDisplay) && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '14px',
              lineHeight: '1.5',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <p style={{ margin: 0 }}>¡Atención! Tu perfil no tiene un nombre de usuario asignado. Por favor, escribe un Username y un Nombre de visualización para poder continuar navegando por la aplicación.</p>
              <button 
                type="button" 
                onClick={async () => {
                  await signOut()
                  navigate('/auth')
                }}
                style={{ 
                  background: 'transparent', 
                  color: 'var(--color-acento)', 
                  border: 'none', 
                  cursor: 'pointer', 
                  textDecoration: 'underline',
                  alignSelf: 'flex-start',
                  padding: 0,
                  fontSize: '14px'
                }}>
                ¿Problemas? Cerrar sesión e intentar de nuevo
              </button>
            </div>
          )}

          <form onSubmit={guardar} className={styles.form} style={{ pointerEvents: cargando ? 'none' : 'auto', opacity: cargando ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            {/* === AVATAR + NOMBRE === */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Foto y nombre</h2>

              <div className={styles.avatarRow}>
                <div className={styles.avatarWrap} onClick={() => avatarRef.current?.click()}>
                  {previewAvatar
                    ? <img src={previewAvatar} alt="Avatar" className={styles.avatarImg} />
                    : <div className={styles.avatarFallback}>
                        {(form.nombreDisplay?.[0] || form.username?.[0] || 'U').toUpperCase()}
                      </div>
                  }
                  <div className={styles.avatarOverlay}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={avatarRef}
                  className={styles.fileHidden}
                  onChange={e => handleFile(e, setPreviewAvatar, 'avatarUrl')}
                />
                <div className={styles.avatarInfo}>
                  <p className={styles.avatarTip}>Haz clic en el avatar para cambiarlo</p>
                  <p className={styles.avatarHint}>PNG, JPG, GIF — Máx. 2MB</p>
                </div>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Nombre de visualización <span style={{ color: '#ff4757' }}>*</span></label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Tu nombre real o apodo"
                    value={form.nombreDisplay}
                    onChange={e => setForm(f => ({ ...f, nombreDisplay: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Username <span style={{ color: '#ff4757' }}>*</span> <span className={styles.labelNote}>(único, sin espacios)</span></label>
                  <div className={styles.inputWithPrefix}>
                    <span className={styles.inputPrefix}>@</span>
                    <input
                      className={`${styles.input} ${styles.inputPrefixed}`}
                      type="text"
                      placeholder="mi_username"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase() }))}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* === BANNER === */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Banner de perfil</h2>
              <p className={styles.sectionDesc}>Elige un color para la cabecera de tu perfil</p>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                {COLORES_BANNER.map(color => (
                  <div
                    key={color}
                    onClick={() => setForm(f => ({ ...f, bannerUrl: color }))}
                    style={{
                      width: '60px',
                      height: '40px',
                      background: (color.startsWith('/') || color.startsWith('http')) ? `url('${color}') center / cover no-repeat` : color,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: form.bannerUrl === color ? '3px solid #ffc107' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: form.bannerUrl === color ? '0 0 0 2px rgba(255, 193, 7, 0.3)' : 'none'
                    }}
                  />
                ))}
              </div>
            </section>

            {/* === MARCO DE PERFIL === */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Marco de perfil</h2>
              <p className={styles.sectionDesc}>Dale un toque único a tu avatar con un marco</p>

              <div className={styles.marcosGrid}>
                <div 
                  className={`${styles.marcoItem} ${form.marcoUrl === '' ? styles.marcoSeleccionado : ''}`}
                  onClick={() => setForm(f => ({ ...f, marcoUrl: '' }))}
                >
                  <div className={styles.marcoNone}>Sin marco</div>
                </div>
                {Array.from({length: 13}, (_, i) => i + 1).map(i => {
                  const url = `/marcos/marco${i}.png`
                  return (
                    <div 
                      key={i}
                      className={`${styles.marcoItem} ${form.marcoUrl === url ? styles.marcoSeleccionado : ''}`}
                      onClick={() => setForm(f => ({ ...f, marcoUrl: url }))}
                    >
                      <img src={url} alt={`Marco ${i}`} className={styles.marcoImg} />
                    </div>
                  )
                })}
              </div>
            </section>

            {/* === BIO Y SITIO === */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Sobre ti</h2>

              <div className={styles.field}>
                <label className={styles.label}>Biografía</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Cuéntanos algo sobre ti y tus animes favoritos..."
                  value={form.bio}
                  maxLength={500}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
                <p className={styles.charCount}>{form.bio.length}/500</p>
              </div>
            </section>

{/* Privacidad movida a /configuracion */}

            {/* === BOTONES === */}
            {error  && <p className={styles.errorMsg}>{error}</p>}
            {exito  && <p className={styles.exitoMsg}>Perfil actualizado correctamente</p>}

            <div className={styles.actions}>
              <a href="/" className={styles.btnCancel}>Cancelar</a>
              <button type="submit" className={styles.btnSave} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  )
}
