import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const HomePage      = lazy(() => import('../features/anime/pages/HomePage').then(m => ({ default: m.HomePage })))
const AnimePage     = lazy(() => import('../features/anime/pages/AnimePage').then(m => ({ default: m.AnimePage })))
const PerfilPage    = lazy(() => import('../features/perfil/pages/PerfilPage').then(m => ({ default: m.PerfilPage })))
const RankingPage   = lazy(() => import('../features/ranking/pages/RankingPage').then(m => ({ default: m.RankingPage })))
const AuthPage      = lazy(() => import('../features/auth/pages/AuthPage').then(m => ({ default: m.AuthPage })))
const DescubrirPage = lazy(() => import('../features/anime/pages/DescubrirPage').then(m => ({ default: m.DescubrirPage })))
const BibliotecaPage = lazy(() => import('../features/biblioteca/pages/BibliotecaPage').then(m => ({ default: m.BibliotecaPage })))
const ComunidadPage  = lazy(() => import('../features/comunidad/pages/ComunidadPage').then(m => ({ default: m.ComunidadPage })))
const ColeccionesPage = lazy(() => import('../features/colecciones/pages/ColeccionesPage').then(m => ({ default: m.ColeccionesPage })))
const FeedPage       = lazy(() => import('../features/feed/pages/FeedPage').then(m => ({ default: m.FeedPage })))

const Cargando = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--color-acento)', fontSize:'1rem' }}>
    Cargando...
  </div>
)

// Ruta protegida — redirige al login si no está autenticado
const RutaPrivada: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth()
  if (cargando) return <Cargando />
  return estaAutenticado ? <>{children}</> : <Navigate to="/auth" replace />
}

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<Cargando />}>
      <Routes>
        {/* Públicas */}
        <Route path="/"                    element={<HomePage />} />
        <Route path="/auth"                element={<AuthPage />} />
        <Route path="/descubrir"           element={<DescubrirPage />} />
        <Route path="/ranking"             element={<RankingPage />} />
        <Route path="/anime/:id"           element={<AnimePage />} />
        <Route path="/perfil/:username"    element={<PerfilPage />} />
        <Route path="/comunidades"         element={<ComunidadPage />} />
        <Route path="/comunidades/:id"     element={<ComunidadPage />} />
        <Route path="/colecciones"         element={<ColeccionesPage />} />
        <Route path="/colecciones/:id"     element={<ColeccionesPage />} />

        {/* Privadas */}
        <Route path="/feed"      element={<RutaPrivada><FeedPage /></RutaPrivada>} />
        <Route path="/mi-lista"  element={<RutaPrivada><BibliotecaPage /></RutaPrivada>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)
