import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

import { HomePage } from '../features/anime/pages/HomePage'
import { AnimePage } from '../features/anime/pages/AnimePage'
import { PerfilPage } from '../features/perfil/pages/PerfilPage'
import { RankingPage } from '../features/ranking/pages/RankingPage'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { DescubrirPage } from '../features/anime/pages/DescubrirPage'
import { BibliotecaPage } from '../features/biblioteca/pages/BibliotecaPage'
import { ComunidadPage } from '../features/comunidad/pages/ComunidadPage'
import { ColeccionesPage } from '../features/colecciones/pages/ColeccionesPage'
import { FeedPage } from '../features/feed/pages/FeedPage'
import { ConfiguracionPage as EditarPerfilPage } from '../features/configuracion/pages/ConfiguracionPage'

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
        <Route path="/feed"           element={<RutaPrivada><FeedPage /></RutaPrivada>} />
        <Route path="/mi-lista"       element={<RutaPrivada><BibliotecaPage /></RutaPrivada>} />
        <Route path="/perfil/editar"  element={<RutaPrivada><EditarPerfilPage /></RutaPrivada>} />
        <Route path="/configuracion"  element={<RutaPrivada><div style={{color:'white', padding:'40px', fontSize:'24px', fontWeight:'bold'}}>Configuración de la cuenta (Próximamente)</div></RutaPrivada>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  </BrowserRouter>
)
