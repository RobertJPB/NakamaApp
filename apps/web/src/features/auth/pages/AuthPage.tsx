import React, { useState } from 'react'
import { useAuth }         from '../../../hooks/useAuth'
import styles              from './AuthPage.module.css'

export const AuthPage: React.FC = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [modo,     setModo]          = useState<'login' | 'registro'>('login')
  const [email,    setEmail]         = useState('')
  const [password, setPassword]      = useState('')
  const [username, setUsername]      = useState('')
  const [nombre,   setNombre]        = useState('')
  const [error,    setError]         = useState('')
  const [cargando, setCargando]      = useState(false)

  const enviar = async () => {
    setError(''); setCargando(true)
    try {
      if (modo === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, username, nombre)
      }
      window.location.href = '/'
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  const loginGoogle = async () => {
    setError(''); setCargando(true)
    try {
      await signInWithGoogle()
    } catch (e: any) {
      setError(e.message)
      setCargando(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroPanel}>
          <div className={styles.brand}>
            <span className={styles.logoTexto}>Nakama</span>
            <p className={styles.tagline}>Accede al feed de reseñas de anime</p>
          </div>

          <div className={styles.oauthSection}>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={loginGoogle}
              disabled={cargando}
            >
              <span className={styles.googleIcon}>
                <svg viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.4H272v95.5h146.9c-6.3 34.1-25.6 63-54.6 82.3v68.3h88.4c51.7-47.7 81.8-118 81.8-195.7z"/>
                  <path fill="#34A853" d="M272 544.3c73.7 0 135.6-24.4 180.8-66.3l-88.4-68.3c-24.6 16.5-56 26.2-92.4 26.2-71 0-131.3-47.9-152.8-112.3H29.4v70.4c45.4 90 139.5 150.3 242.6 150.3z"/>
                  <path fill="#FBBC05" d="M119.2 319.4c-10.4-31.4-10.4-65.4 0-96.8V152.2H29.4c-39.8 78.3-39.8 169.2 0 247.5l89.8-70.3z"/>
                  <path fill="#EA4335" d="M272 107.2c39 0 74.2 13.4 101.9 39.6l76.4-76.4C405.5 26.5 347.1 0 272 0 168.9 0 74.8 60.3 29.4 152.2l89.8 70.4C140.7 155.1 201 107.2 272 107.2z"/>
                </svg>
              </span>
              Continuar con Google
            </button>
            <div className={styles.divider}>
              <span>o</span>
            </div>
          </div>

          <div className={styles.toggle}>
            <button
              className={`${styles.toggleBtn} ${modo === 'login' ? styles.toggleActivo : ''}`}
              onClick={() => setModo('login')}
            >
              Iniciar sesión
            </button>
            <button
              className={`${styles.toggleBtn} ${modo === 'registro' ? styles.toggleActivo : ''}`}
              onClick={() => setModo('registro')}
            >
              Registrarse
            </button>
          </div>

          <div className={styles.campos}>
            {modo === 'registro' && (
              <>
                <input
                  className={styles.input} type="text"
                  placeholder="Nombre completo"
                  value={nombre} onChange={e => setNombre(e.target.value)}
                />
                <input
                  className={styles.input} type="text"
                  placeholder="Username (ej: naruto_fan)"
                  value={username} onChange={e => setUsername(e.target.value)}
                />
              </>
            )}
            <input
              className={styles.input} type="email"
              placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <input
              className={styles.input} type="password"
              placeholder="Contraseña"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="button" className={styles.btn} onClick={enviar} disabled={cargando}>
            {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}
