import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/axios'

export function useColeccionesEditoriales() {
  const [colecciones, setColecciones] = useState<any[]>([])
  const [cargando,    setCargando]    = useState(true)

  useEffect(() => {
    api.get('/api/colecciones/editoriales')
      .then(({ data }) => setColecciones(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [])

  return { colecciones, cargando }
}

export function useColeccionDetalle(id: string | undefined) {
  const [coleccion, setColeccion] = useState<any>(null)
  const [cargando,  setCargando]  = useState(false)

  const cargar = useCallback(() => {
    if (!id) return
    setCargando(true)
    api.get(`/api/colecciones/${id}`)
      .then(({ data }) => setColeccion(data))
      .finally(() => setCargando(false))
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  return { coleccion, cargando }
}

export function useColeccionesUsuario(usuarioId: string | null) {
  const [colecciones, setColecciones] = useState<any[]>([])
  const [cargando,    setCargando]    = useState(false)

  const cargar = useCallback(() => {
    if (!usuarioId) return
    setCargando(true)
    api.get(`/api/colecciones/usuario/${usuarioId}`)
      .then(({ data }) => setColecciones(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [usuarioId])

  useEffect(() => { cargar() }, [cargar])

  const crear = async (titulo: string, descripcion?: string) => {
    await api.post('/api/colecciones', { titulo, descripcion })
    cargar()
  }

  return { colecciones, cargando, crear }
}
