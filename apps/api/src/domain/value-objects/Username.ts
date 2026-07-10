export class Username {
  private readonly valor: string

  constructor(valor: string) {
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(valor)) {
      throw new Error('El username debe tener entre 3 y 50 caracteres (letras, números y guión bajo)')
    }
    this.valor = valor.toLowerCase()
  }

  get value(): string { return this.valor }
}
