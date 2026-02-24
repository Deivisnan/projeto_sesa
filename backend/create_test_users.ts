import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const senhaHash = await bcrypt.hash('123456', 10);

    // 1. Criar ou buscar unidade TI
    let unidadeTI = await prisma.unidade.findFirst({ where: { tipo: 'TI' } });
    if (!unidadeTI) {
        unidadeTI = await prisma.unidade.create({
            data: { nome: 'Departamento de TI - Root', tipo: 'TI' }
        });
    }

    // 2. Criar ou buscar unidade UBS
    let unidadeUBS = await prisma.unidade.findFirst({ where: { tipo: 'UBS' } });
    if (!unidadeUBS) {
        unidadeUBS = await prisma.unidade.create({
            data: { nome: 'UBS Central Teste', tipo: 'UBS' }
        });
    }

    // 3. Criar usuários
    const userTI = await prisma.usuario.upsert({
        where: { email: 'ti@sesa.gov.br' },
        update: { senha_hash: senhaHash, id_unidade: unidadeTI.id },
        create: {
            nome: 'Administrador TI',
            email: 'ti@sesa.gov.br',
            senha_hash: senhaHash,
            id_unidade: unidadeTI.id,
            papel: 'ADMIN'
        }
    });

    const userUBS = await prisma.usuario.upsert({
        where: { email: 'ubs@sesa.gov.br' },
        update: { senha_hash: senhaHash, id_unidade: unidadeUBS.id },
        create: {
            nome: 'Enfermeiro UBS',
            email: 'ubs@sesa.gov.br',
            senha_hash: senhaHash,
            id_unidade: unidadeUBS.id,
            papel: 'USUARIO'
        }
    });

    console.log('--- CREDENCIAIS GERADAS COM SUCESSO ---');
    console.log(`TI Login: ${userTI.email} | Senha: 123456`);
    console.log(`UBS Login: ${userUBS.email} | Senha: 123456`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
