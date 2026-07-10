# SOLID en Nakama

## S — Single Responsibility Principle

Cada clase tiene una sola razón para cambiar:

- `CrearResena` → solo crea reseñas
- `EditarResena` → solo edita reseñas
- `EliminarResena` → solo elimina reseñas
- `ResenaController` → solo maneja HTTP (parsear request, responder)
- `PrismaResenaRepository` → solo habla con la base de datos
- `SupabaseAuthMiddleware` → solo verifica tokens

Si cambia la lógica de negocio → modificas el caso de uso.
Si cambia el ORM → modificas el repositorio.
Si cambia el framework HTTP → modificas el controlador.
Ninguno de los tres sabe del otro.

## O — Open/Closed Principle

Las clases están abiertas para extensión, cerradas para modificación:

- Para agregar "agregar reseña con imagen" → crear `CrearResenaConImagen` que extiende o compone `CrearResena`, sin tocarla
- Para soportar un nuevo proveedor de anime además de AniList → crear `KitsuClient` que implementa la misma interfaz, sin tocar `BuscarAnimes`
- `IUseCase<TInput, TOutput>` permite nuevos casos de uso sin modificar los existentes

## L — Liskov Substitution Principle

Cualquier implementación de repositorio es intercambiable:

```ts
// Hoy:
const animeRepo = new PrismaAnimeRepository()

// Mañana si migras a MongoDB:
const animeRepo = new MongoAnimeRepository()

// BuscarAnimes no se entera — depende de IAnimeRepository, no de Prisma
const buscarAnimes = new BuscarAnimes(animeRepo)
```

## I — Interface Segregation Principle

Los repositorios tienen interfaces específicas, no una sola mega-interfaz:

- `IAnimeRepository` → solo métodos de anime
- `IResenaRepository` → solo métodos de reseñas
- `IListaRepository` → solo métodos de lista
- `IUseCase<TInput, TOutput>` → interfaz mínima, solo `execute()`

Los casos de uso declaran exactamente qué necesitan en su constructor.

## D — Dependency Inversion Principle

Los módulos de alto nivel no dependen de los de bajo nivel.
Ambos dependen de abstracciones (interfaces):

```
ResenaController
    ↓ usa
CrearResena (caso de uso)
    ↓ depende de
IResenaRepository (interfaz — Domain)
    ↑ implementada por
PrismaResenaRepository (Infrastructure)
```

El contenedor `container.ts` es el único lugar donde se instancian
las implementaciones concretas y se inyectan hacia arriba.
Cambiar de Prisma a otro ORM = cambiar una línea en container.ts.
