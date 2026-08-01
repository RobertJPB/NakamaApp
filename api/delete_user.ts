import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function deleteUser() {
  try {
    const user = await prisma.usuario.findUnique({
      where: { username: 'claudio' }
    });
    
    if (user) {
      await prisma.usuario.delete({
        where: { id: user.id }
      });
      console.log('User claudio deleted successfully');
    } else {
      console.log('User claudio not found');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
