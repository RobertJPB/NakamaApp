export const ESTADOS_LISTA = ['viendo','completado','pendiente','en_pausa','abandonado'] as const
export type EstadoListaType = typeof ESTADOS_LISTA[number]

export class EstadoLista {
  private readonly valor: EstadoListaType

  constructor(valor: string) {
    if (!ESTADOS_LISTA.includes(valor as EstadoListaType)) {
      throw new Error(`Estado inválido: ${valor}. Valores permitidos: ${ESTADOS_LISTA.join(', ')}`)
    }
    this.valor = valor as EstadoListaType
  }

  get value(): EstadoListaType { return this.valor }
}
