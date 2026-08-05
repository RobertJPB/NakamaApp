import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ErrorBoundary } from '../components/ErrorBoundary'

const HomePage         = lazy(() => import('../features/anime/pages/HomePage').then(m => ({ default: m.HomePage })))
const AnimePage        = lazy(() => import('../features/anime/pages/AnimePage').then(m => ({ default: m.AnimePage })))
const PerfilPage       = lazy(() => import('../features/perfil/pages/PerfilPage').then(m => ({ default: m.PerfilPage })))
const RankingPage      = lazy(() => import('../features/ranking/pages/RankingPage').then(m => ({ default: m.RankingPage })))
const AuthPage         = lazy(() => import('../features/auth/pages/AuthPage').then(m => ({ default: m.AuthPage })))
const DescubrirPage    = lazy(() => import('../features/anime/pages/DescubrirPage').then(m => ({ default: m.DescubrirPage })))
const SearchPage       = lazy(() => import('../features/search/pages/SearchPage').then(m => ({ default: m.SearchPage })))
const BibliotecaPage   = lazy(() => import('../features/biblioteca/pages/BibliotecaPage').then(m => ({ default: m.BibliotecaPage })))
const InvitacionPage   = lazy(() => import('../features/biblioteca/pages/InvitacionPage').then(m => ({ default: m.InvitacionPage })))
const ComunidadPage    = lazy(() => import('../features/comunidad/pages/ComunidadPage').then(m => ({ default: m.ComunidadPage })))
const ColeccionesPage  = lazy(() => import('../features/colecciones/pages/ColeccionesPage').then(m => ({ default: m.ColeccionesPage })))
const FeedPage         = lazy(() => import('../features/feed/pages/FeedPage').then(m => ({ default: m.FeedPage })))
const EditarPerfilPage = lazy(() => import('../features/configuracion/pages/ConfiguracionPage').then(m => ({ default: m.ConfiguracionPage })))
const AjustesPage      = lazy(() => import('../features/configuracion/pages/AjustesPage').then(m => ({ default: m.AjustesPage })))
const RuletaPage       = lazy(() => import('../features/ruleta/pages/RuletaPage').then(m => ({ default: m.RuletaPage })))
const TierListPage     = lazy(() => import('../features/tierlist/pages/TierListPage').then(m => ({ default: m.TierListPage })))

const PageSkeleton = () => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: '100vh', 
    background: 'var(--color-bg)' 
  }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid rgba(255,255,255,0.05)',
      borderTopColor: 'var(--color-acento)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}>
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
    </div>
  </div>
)

// Ruta protegida — redirige al login si no está autenticado
const RutaPrivada: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth()
  if (cargando) return <PageSkeleton />
  const isLoggingOut = sessionStorage.getItem('isLoggingOut') === 'true'
  
  if (!estaAutenticado) {
    if (isLoggingOut) {
      return <Navigate to="/" replace />
    }
    return <Navigate to="/auth" state={{ message: 'Debes iniciar sesión para acceder a esta función' }} replace />
  }
  
  return <>{children}</>
}

// Guard to ensure user completes profile setup (username/name)
const RequireProfile: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { estaAutenticado, usuario, cargando } = useAuth()
  const location = useLocation()
  
  if (cargando) return <PageSkeleton />
  
  // If authenticated but missing username or display name, force redirect to settings
  if (estaAutenticado && usuario && (!usuario.username || !usuario.nombreDisplay)) {
    // Only allow them to be on the edit profile page
    if (location.pathname !== '/perfil/editar') {
      return <Navigate to="/perfil/editar" replace />
    }
  }
  
  return <>{children}</>
}

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <RequireProfile>
          <Routes>
            {/* Públicas */}
          <Route path="/"                    element={<HomePage />} />
          <Route path="/auth"                element={<AuthPage />} />
          <Route path="/descubrir"           element={<DescubrirPage />} />
          <Route path="/buscar"              element={<SearchPage />} />
          <Route path="/ranking"             element={<RankingPage />} />
          <Route path="/anime/:id"           element={<AnimePage />} />
          <Route path="/perfil/:username"    element={<PerfilPage />} />
          <Route path="/comunidades"         element={<ComunidadPage />} />
          <Route path="/comunidades/:id"     element={<ComunidadPage />} />
          <Route path="/colecciones"         element={<ColeccionesPage />} />
          <Route path="/colecciones/:id"     element={<ColeccionesPage />} />
          <Route path="/tierlist"            element={<TierListPage />} />
          <Route path="/ruleta"              element={<RutaPrivada><RuletaPage /></RutaPrivada>} />

          {/* Privadas */}
          <Route path="/feed"           element={<RutaPrivada><FeedPage /></RutaPrivada>} />
          <Route path="/mi-lista"       element={<RutaPrivada><BibliotecaPage /></RutaPrivada>} />
          <Route path="/lista/invite/:columnaId" element={<RutaPrivada><InvitacionPage /></RutaPrivada>} />
          <Route path="/perfil/editar"  element={<RutaPrivada><EditarPerfilPage /></RutaPrivada>} />
          <Route path="/configuracion"  element={<RutaPrivada><AjustesPage /></RutaPrivada>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RequireProfile>
      </Suspense>
    </ErrorBoundary>
  </BrowserRouter>
)
