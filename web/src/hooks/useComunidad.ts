import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/axios'

export function useComunidades(tipo?: string) {
  const [comunidades, setComunidades] = useState<any[]>([])
  const [cargando,    setCargando]    = useState(true)

  const recargar = useCallback(() => {
    setCargando(true)
    const params = tipo ? `?tipo=${tipo}` : ''
    api.get(`/api/comunidades${params}`)
      .then(({ data }) => setComunidades(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [tipo])

  useEffect(() => { recargar() }, [recargar])

  return { comunidades, cargando, recargar }
}

export function useComunidadDetalle(id: string | undefined, seccion?: string) {
  const [comunidad,     setComunidad]     = useState<any>(null)
  const [publicaciones, setPublicaciones] = useState<any[]>([])
  const [miembros,      setMiembros]      = useState<any[]>([])
  const [cargando,      setCargando]      = useState(false)

  const cargar = useCallback(() => {
    if (!id) return
    setCargando(true)
    Promise.all([
      api.get(`/api/comunidades/${id}`),
      api.get(`/api/comunidades/${id}/publicaciones${seccion ? `?seccion=${seccion}` : ''}`),
      api.get(`/api/comunidades/${id}/miembros`),
    ])
      .then(([c, p, m]) => {
        setComunidad(c.data)
        setPublicaciones(Array.isArray(p.data.publicaciones) ? p.data.publicaciones : [])
        setMiembros(Array.isArray(m.data) ? m.data : [])
      })
      .finally(() => setCargando(false))
  }, [id, seccion])

  useEffect(() => { cargar() }, [cargar])

  const publicar = async (datos: { tipo: string; titulo?: string; contenido?: string; imagenUrl?: string; opciones?: string[]; resenaId?: string; seccion?: string }) => {
    await api.post(`/api/comunidades/${id}/publicar`, datos)
    cargar()
  }

  const votar = async (opcionId: string) => {
    await api.post(`/api/comunidades/votar-encuesta`, { opcionId })
    cargar()
  }

  const unirse = async () => {
    await api.post(`/api/comunidades/${id}/unirse`)
    cargar()
  }

  const salir = async () => {
    await api.post(`/api/comunidades/${id}/salir`)
    cargar()
  }

  const expulsar = async (usuarioId: string) => {
    await api.delete(`/api/comunidades/${id}/miembros/${usuarioId}`)
    cargar()
  }

  const cambiarRol = async (usuarioId: string, rol: string) => {
    await api.patch(`/api/comunidades/${id}/miembros/${usuarioId}/rol`, { rol })
    cargar()
  }

  const eliminarPublicacion = async (pubId: string) => {
    await api.delete(`/api/comunidades/publicaciones/${pubId}`)
    cargar()
  }

  return { comunidad, publicaciones, miembros, cargando, publicar, unirse, salir, votar, expulsar, cambiarRol, eliminarPublicacion }
}
