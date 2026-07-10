export interface PaginatedResponse<T> {
  data:       T[]
  page:       number
  totalPages: number
  total:      number
}

export interface ApiError {
  error:     string
  detalles?: Record<string, string[]>
}

export interface ApiResponse<T> {
  data?:    T
  error?:   string
  mensaje?: string
}
