import { AniListService } from './src/infrastructure/services/AniListService';

async function main() {
  const service = new AniListService();
  const res = await service.obtenerDetalle(16498);
  console.log(JSON.stringify(res.personajes.length, null, 2));
}

main().catch(console.error);
