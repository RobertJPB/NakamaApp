import { KitsuService } from '../src/infrastructure/external/kitsu/KitsuService'

;(async () => {
  const svc = new KitsuService()
  for (const g of ['Horror', 'Comedy', 'Mecha', 'Romance']) {
    const t0 = Date.now()
    const res = await svc.obtenerPopulares(1, 22, g)
    const titulos = res.map((a: any) => a.titulo)
    const duplicados = titulos.filter((t: string, i: number) => titulos.indexOf(t) !== i)
    console.log(`=== ${g} (${Date.now() - t0}ms) — ${res.length} animes, duplicados: ${JSON.stringify(duplicados) || 'ninguno'} ===`)
    res.forEach((a: any, i: number) => console.log(`${i + 1}. ${a.titulo}`))
    console.log()
  }
})()
