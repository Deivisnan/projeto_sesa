const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    await prisma.fornecedor.create({
        data: {
            razao_social: 'MedQuímica Indústria Farmacêutica Ltda',
            cnpj: '12345678000190',
        }
    });
    console.log("Fornecedor inserido com sucesso!");
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
