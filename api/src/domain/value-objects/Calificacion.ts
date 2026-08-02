export class Calificacion {
  private readonly valor: number

  constructor(valor: number) {
    if (valor < 1 || valor > 10 || !Number.isInteger(valor)) {
      throw new Error('La calificación debe ser un número entero entre 1 y 10')
    }
    this.valor = valor
  }

  get value(): number { return this.valor }
}
