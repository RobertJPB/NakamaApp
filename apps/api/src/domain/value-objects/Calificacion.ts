export class Calificacion {
  private readonly valor: number

  constructor(valor: number) {
    if (!Number.isInteger(valor) || valor < 1 || valor > 10) {
      throw new Error('La calificación debe ser un entero entre 1 y 10')
    }
    this.valor = valor
  }

  get value(): number { return this.valor }
}
