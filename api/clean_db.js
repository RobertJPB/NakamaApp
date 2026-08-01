const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Borrando todos los animes de la base de datos...');
  
  // Al borrar los animes, por Cascade se borrarán:
  // - lista_usuario (las listas personales de cada usuario)
  // - resenas (todas las reseñas apuntando a animes antiguos)
  // - personajes y calificaciones
  // - anime_generos, etc.
  const deletedAnimes = await prisma.anime.deleteMany({});
  console.log('Animes borrados:', deletedAnimes.count);

  console.log('Borrando publicaciones, comentarios y feed...');
  await prisma.comentario.deleteMany({});
  await prisma.publicacion.deleteMany({});
  await prisma.feed.deleteMany({});

  console.log('Limpieza completada exitosamente.');
}

main()
  .catch(e => {
    console.error('Error limpiando BD:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
