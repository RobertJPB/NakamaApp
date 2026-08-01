import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../../lib/axios'
import { Layout } from '../../../components/shared/Layout'

export const InvitacionPage: React.FC = () => {
  const { columnaId } = useParams<{ columnaId: string }>()
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState('Procesando invitación...')
  const [error, setError] = useState(false)

  useEffect(() => {
    const aceptarInvitacion = async () => {
      try {
        await api.post('/api/biblioteca/aceptar', { columnaId })
        setMensaje('¡Invitación aceptada con éxito! Redirigiendo a tu biblioteca...')
        setTimeout(() => navigate('/biblioteca'), 2000)
      } catch (err: any) {
        console.error(err)
        setError(true)
        setMensaje(err.response?.data?.mensaje || 'Error al aceptar la invitación.')
      }
    }
    
    if (columnaId) aceptarInvitacion()
  }, [columnaId, navigate])

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <h2 style={{ color: error ? '#ff4757' : '#2ed573' }}>{error ? 'Error' : 'Invitación'}</h2>
        <p style={{ color: 'var(--color-texto)', fontSize: '1.2rem' }}>{mensaje}</p>
        {error && (
          <button 
            onClick={() => navigate('/biblioteca')}
            style={{ 
              marginTop: '16px', padding: '8px 16px', background: 'var(--color-acento)', 
              border: 'none', borderRadius: '8px', color: '#1f2124', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            Volver a Mi Tablero
          </button>
        )}
      </div>
    </Layout>
  )
}
