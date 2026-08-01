import { useState, useEffect } from 'react'
import { api } from '../lib/axios'
import { useAuth } from './useAuth'

export function useNotificaciones() {
  const { estaAutenticado } = useAuth()
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotificaciones = async () => {
    if (!estaAutenticado) return
    try {
      const res = await api.get('/api/notificaciones')
      setNotificaciones(res.data)
    } catch (err) {
      console.error('Error fetching notificaciones', err)
    }
  }

  useEffect(() => {
    if (estaAutenticado) {
      fetchNotificaciones()
      // Polling every 30 seconds
      const interval = setInterval(fetchNotificaciones, 30000)
      return () => clearInterval(interval)
    }
  }, [estaAutenticado])

  const marcarComoLeida = async (id: string) => {
    try {
      await api.put(`/api/notificaciones/${id}/leer`)
      setNotificaciones(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      )
    } catch (err) {
      console.error(err)
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      await api.put('/api/notificaciones/leer-todo')
      setNotificaciones(prev => 
        prev.map(n => ({ ...n, leida: true }))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return {
    notificaciones,
    noLeidas,
    loading,
    marcarComoLeida,
    marcarTodasComoLeidas,
    fetchNotificaciones
  }
}
