const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.usuario.findMany()
    .then(u => console.log(JSON.stringify(u, null, 2)))
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
