import React, { useState, useEffect } from 'react'
import { Layout } from '../../../components/shared/Layout'
import { api } from '../../../lib/axios'
import { useAuth } from '../../../hooks/useAuth'
import { Bell, LogOut, AlertTriangle, Shield, User, Lock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import styles from './AjustesPage.module.css'

export const AjustesPage: React.FC = () => {
  const { usuario, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'cuenta' | 'privacidad' | 'notificaciones'>('cuenta')

  const handleLogout = async () => {
    sessionStorage.setItem('isLoggingOut', 'true')
    await signOut()
  }

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.container}>
          
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Configuración</h1>
            <p className={styles.pageSubtitle}>Administra tu cuenta, privacidad y preferencias</p>
          </div>

          <aside className={styles.sidebar}>
            <button 
              className={`${styles.tab} ${activeTab === 'cuenta' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('cuenta')}
            >
              <User size={18} /> Mi Cuenta
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'privacidad' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('privacidad')}
            >
              <Shield size={18} /> Privacidad
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'notificaciones' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('notificaciones')}
            >
              <Bell size={18} /> Notificaciones
            </button>
          </aside>

          <main className={styles.content}>
            {activeTab === 'cuenta' && <AjustesCuenta correo={usuario?.email || 'usuario@ejemplo.com'} onLogout={handleLogout} />}
            {activeTab === 'privacidad' && <AjustesPrivacidad />}
            {activeTab === 'notificaciones' && <AjustesNotificaciones />}
          </main>

        </div>
      </div>
    </Layout>
  )
}
// --- Sub-componentes para cada pestaña ---

const AjustesCuenta = ({ correo, onLogout }: { correo: string, onLogout: () => void }) => {
  const [enviando, setEnviando] = useState(false)
  const [mensajePass, setMensajePass] = useState('')

  const handlePasswordChange = async () => {
    if (!correo) return
    setEnviando(true)
    setMensajePass('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      })
      if (error) throw error
      setMensajePass('Correo de recuperación enviado. Revisa tu bandeja de entrada o spam.')
    } catch (err: any) {
      setMensajePass('Ocurrió un error al intentar enviar el correo. Por favor, intenta de nuevo más tarde.')
    } finally {
      setEnviando(false)
    }
  }

  const handleDeleteAccount = () => {
    if (window.confirm('¿Estás SEGURO de que deseas eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
      alert('Esta es una versión de demostración. La eliminación de cuentas está desactivada para proteger la integridad de los datos de prueba.')
    }
  }

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Detalles de la Cuenta</h2>
        
        <div className={styles.field}>
          <label className={styles.label}>Correo Electrónico</label>
          <input className={styles.input} type="email" value={correo} disabled />
          <span style={{ fontSize: '12px', color: 'var(--color-texto-muted)', marginTop: '4px' }}>
            Tu correo electrónico no es público.
          </span>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contraseña y Autenticación</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-texto-suave)' }}>
            ¿Necesitas actualizar tu contraseña? Te enviaremos un correo con un enlace seguro para restablecerla.
          </p>
          <button className={styles.btnSave} onClick={handlePasswordChange} disabled={enviando || !correo}>
            <Lock size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            {enviando ? 'Enviando...' : 'Cambiar Contraseña'}
          </button>
          {mensajePass && (
            <p className={!mensajePass.includes('Error') ? styles.msgExito : styles.msgError}>
              {mensajePass}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section} style={{ borderColor: 'rgba(255, 71, 87, 0.3)' }}>
        <h2 className={styles.sectionTitle} style={{ color: '#ff4757' }}>Zona Peligrosa</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button className={styles.btnDanger} onClick={handleDeleteAccount}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Eliminar Cuenta
          </button>
        </div>
      </section>
    </>
  )
}

const AjustesPrivacidad = () => {
  const [form, setForm] = useState({
    perfilPrivado: false,
    resenasPublicas: true,
    listasPublicas: true
  })
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  // Cargar estado real de la base de datos
  useEffect(() => {
    api.get('/api/usuarios/me').then(({ data }) => {
      setForm({
        perfilPrivado: data.perfilPrivado ?? false,
        resenasPublicas: data.resenasPublicas ?? true,
        listasPublicas: data.listasPublicas ?? true,
      })
    }).catch(console.error)
  }, [])

  const guardar = async () => {
    setGuardando(true)
    setMsg('')
    try {
      await api.put('/api/usuarios/me', form)
      setMsg('Cambios de privacidad guardados.')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Error al guardar cambios.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Visibilidad y Privacidad</h2>
      <p style={{ fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '16px' }}>
        Controla quién puede ver tus contenidos e interactuar contigo en Nakama.
      </p>

      <div className={styles.toggleList}>
        <div className={styles.toggleItem}>
          <div>
            <p className={styles.toggleLabel}>Perfil Privado</p>
            <p className={styles.toggleDesc}>Si se activa, solo tus seguidores aprobados podrán ver tu perfil y publicaciones.</p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${form.perfilPrivado ? styles.toggleOn : ''}`}
            onClick={() => setForm(f => ({ ...f, perfilPrivado: !f.perfilPrivado }))}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.toggleItem}>
          <div>
            <p className={styles.toggleLabel}>Reseñas Públicas</p>
            <p className={styles.toggleDesc}>Si se desactiva, tus reseñas de anime estarán ocultas de las páginas de las series.</p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${form.resenasPublicas ? styles.toggleOn : ''}`}
            onClick={() => setForm(f => ({ ...f, resenasPublicas: !f.resenasPublicas }))}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.toggleItem}>
          <div>
            <p className={styles.toggleLabel}>Listas Públicas</p>
            <p className={styles.toggleDesc}>Permite que otras personas visiten tu biblioteca de animes.</p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${form.listasPublicas ? styles.toggleOn : ''}`}
            onClick={() => setForm(f => ({ ...f, listasPublicas: !f.listasPublicas }))}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button className={styles.btnSave} onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar Privacidad'}
        </button>
        {msg && <p className={msg.includes('Error') ? styles.msgError : styles.msgExito}>{msg}</p>}
      </div>
    </section>
  )
}

const AjustesNotificaciones = () => {
  const [notifs, setNotifs] = useState({
    nuevosSeguidores: true,
    menciones: true,
    novedades: false
  })

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Notificaciones por Correo</h2>
      <p style={{ fontSize: '14px', color: 'var(--color-texto-suave)', marginBottom: '16px' }}>
        Elige qué tipo de correos deseas recibir de nosotros.
      </p>

      <div className={styles.toggleList}>
        <div className={styles.toggleItem}>
          <div>
            <p className={styles.toggleLabel}>Nuevos Seguidores</p>
            <p className={styles.toggleDesc}>Recibe un email cuando alguien comience a seguirte.</p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${notifs.nuevosSeguidores ? styles.toggleOn : ''}`}
            onClick={() => setNotifs(n => ({ ...n, nuevosSeguidores: !n.nuevosSeguidores }))}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.toggleItem}>
          <div>
            <p className={styles.toggleLabel}>Menciones y Comentarios</p>
            <p className={styles.toggleDesc}>Notificarme cuando alguien responda a mi publicación.</p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${notifs.menciones ? styles.toggleOn : ''}`}
            onClick={() => setNotifs(n => ({ ...n, menciones: !n.menciones }))}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.toggleItem}>
          <div>
            <p className={styles.toggleLabel}>Novedades de Nakama</p>
            <p className={styles.toggleDesc}>Boletines ocasionales sobre nuevas características (max 1 al mes).</p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${notifs.novedades ? styles.toggleOn : ''}`}
            onClick={() => setNotifs(n => ({ ...n, novedades: !n.novedades }))}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
      </div>
    </section>
  )
}
