import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.user.findFirst();
    console.log('User fields:', Object.keys(user || {}));
    if (user && 'rating' in user) {
      console.log('Rating field exists');
    } else {
      console.log('Rating field is MISSING');
    }
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
