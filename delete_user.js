const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser() {
  try {
    const user = await prisma.usuario.findUnique({
      where: { username: 'tango' }
    });
    
    if (user) {
      await prisma.usuario.delete({
        where: { id: user.id }
      });
      console.log('User tango deleted successfully');
    } else {
      console.log('User tango not found');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
