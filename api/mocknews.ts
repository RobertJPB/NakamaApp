import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 

async function main() { 
  await prisma.noticia.deleteMany({});
  
  await prisma.noticia.createMany({ 
    data: [
      { 
        titulo: 'Anunciada la segunda temporada de Solo Leveling', 
        resumen: 'Crunchyroll confirma la producción de la temporada 2 de Solo Leveling tras el éxito de la primera.', 
        urlOrigen: 'https://ramenparados.com/1', 
        imagenUrl: '/news1.jpg',
        fuente: 'RamenParaDos', 
        fechaPublicacion: new Date() 
      }, 
      { 
        titulo: 'Nuevos detalles de la película de Jujutsu Kaisen', 
        resumen: 'MAPPA revela nueva información y fecha de estreno para la esperada película.', 
        urlOrigen: 'https://ramenparados.com/2', 
        imagenUrl: '/news2.jpg',
        fuente: 'RamenParaDos', 
        fechaPublicacion: new Date(Date.now() - 3600000) 
      },
      { 
        titulo: 'Kimetsu no Yaiba: El Entrenamiento de los Pilares', 
        resumen: 'El primer episodio de la nueva temporada llegará a los cines de todo el mundo.', 
        urlOrigen: 'https://ramenparados.com/3', 
        imagenUrl: '/news3.jpg',
        fuente: 'RamenParaDos', 
        fechaPublicacion: new Date(Date.now() - 7200000) 
      },
      { 
        titulo: 'Oshi no Ko temporada 2 revela su fecha de estreno', 
        resumen: 'La segunda temporada del popular idol anime se estrenará este mismo año.', 
        urlOrigen: 'https://ramenparados.com/4', 
        imagenUrl: '/news4.jpg',
        fuente: 'RamenParaDos', 
        fechaPublicacion: new Date(Date.now() - 10800000) 
      },
      { 
        titulo: 'Chainsaw Man tendrá película adaptando el arco de Reze', 
        resumen: 'Tras los rumores, se confirma oficialmente la película secuela del anime.', 
        urlOrigen: 'https://ramenparados.com/5', 
        imagenUrl: '/news5.jpg',
        fuente: 'RamenParaDos', 
        fechaPublicacion: new Date(Date.now() - 14400000) 
      },
      { 
        titulo: 'Spy x Family Code: White es un éxito en taquilla', 
        resumen: 'La película de la familia Forger domina la cartelera japonesa en su fin de semana de estreno.', 
        urlOrigen: 'https://ramenparados.com/6', 
        imagenUrl: '/news6.jpg',
        fuente: 'RamenParaDos', 
        fechaPublicacion: new Date(Date.now() - 18000000) 
      }
    ] 
  }); 
  console.log('Local images used for mock news to bypass all restrictions'); 
} 
main();
