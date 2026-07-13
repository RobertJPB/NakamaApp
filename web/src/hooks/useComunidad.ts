import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/axios'

export function useComunidades(tipo?: string) {
  const [comunidades, setComunidades] = useState<any[]>([])
  const [cargando,    setCargando]    = useState(true)

  useEffect(() => {
    setCargando(true)
    const params = tipo ? `?tipo=${tipo}` : ''
    api.get(`/api/comunidades${params}`)
      .then(({ data }) => setComunidades(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [tipo])

  return { comunidades, cargando }
}

export function useComunidadDetalle(id: string | undefined) {
  const [comunidad,     setComunidad]     = useState<any>(null)
  const [publicaciones, setPublicaciones] = useState<any[]>([])
  const [cargando,      setCargando]      = useState(false)

  const cargar = useCallback(() => {
    if (!id) return
    setCargando(true)
    Promise.all([
      api.get(`/api/comunidades/${id}`),
      api.get(`/api/comunidades/${id}/publicaciones`),
    ])
      .then(([c, p]) => {
        setComunidad(c.data)
        setPublicaciones(Array.isArray(p.data) ? p.data : [])
      })
      .finally(() => setCargando(false))
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  const publicar = async (titulo: string, contenido: string, imagenUrl?: string) => {
    await api.post(`/api/comunidades/${id}/publicar`, { titulo, contenido, imagenUrl })
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

  return { comunidad, publicaciones, cargando, publicar, unirse, salir }
}
