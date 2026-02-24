const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.usuario.update({
    where: { email: 'admin@sysfarma.gov.br' },
    data: { senha_hash: '$2b$08$dYH9KbcybANcwfbifWwKeOq//CpxXf.H3RHyF61tl/PoGiALBy5XS' }
})
    .then(u => console.log('Password reset to 123 for', u.email))
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
