// Interface Segregation + Dependency Inversion
// Cada caso de uso implementa solo lo que necesita
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>
}
