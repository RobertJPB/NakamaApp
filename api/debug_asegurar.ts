import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const id = '248bf4f8-42b7-410f-9470-7a427acd347b'
  const email = 'claudio@test.com'
  const username = 'claudio'
  const nombreDisplay = 'Claudio'
  
  try {
    const user = await prisma.usuario.create({
      data: {
        id,
        email,
        username,
        nombreDisplay,
        avatarUrl: null
      }
    })
    console.log('User created:', user)
  } catch (err) {
    console.error('Error creating user:', err)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
