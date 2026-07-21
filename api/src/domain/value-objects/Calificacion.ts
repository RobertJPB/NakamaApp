export class Calificacion {
  private readonly valor: number

  constructor(valor: number) {
    if (valor < 0.5 || valor > 10 || (valor * 2) % 1 !== 0) {
      throw new Error('La calificación debe estar entre 0.5 y 10 en incrementos de 0.5')
    }
    this.valor = valor
  }

  get value(): number { return this.valor }
}
