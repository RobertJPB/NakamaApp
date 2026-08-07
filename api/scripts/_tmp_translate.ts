import { translateText } from '../src/infrastructure/external/kitsu/KitsuService'

async function main() {
  const res = await fetch('https://kitsu.io/api/edge/anime/12', { headers: { Accept: 'application/vnd.api+json' } })
  const data = await res.json() as any
  const sinopsisEn = data.data?.attributes?.synopsis || ''
  console.log('Largo sinopsis EN:', sinopsisEn.length)

  const t = await translateText(sinopsisEn)
  console.log('Traduccion:', t ? t.slice(0, 200) : 'NULL')
  if (t && /QUERY|MAX ALLOWED/i.test(t)) console.log('!!! ERROR PRESENTE EN TRADUCCION')
  else console.log('OK: sin error')
}

main().catch(e => { console.error(e); process.exit(1) })
