import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const senha = 'admin';

    console.log('--- Iniciando Seed de Produção ---');

    // 1. Criar ou buscar CAF Central
    let unidadedefault = await prisma.unidade.findFirst({
        where: { tipo: 'CAF' }
    });

    if (!unidadedefault) {
        unidadedefault = await prisma.unidade.create({
            data: {
                nome: 'CAF Central SESA',
                tipo: 'CAF'
            }
        });
        console.log('✅ Unidade CAF criada.');
    }

    // 2. Criar Usuário Admin CAF
    const emailAdmin = 'admin@sysfarma.com';
    const existingUser = await prisma.usuario.findUnique({
        where: { email: emailAdmin }
    });

    if (!existingUser) {
        const senha_hash = await bcrypt.hash(senha, 8);
        await prisma.usuario.create({
            data: {
                id: '550e8400-e29b-41d4-a716-446655440001', // ID fixo para consistência se necessário
                nome: 'Administrador CAF',
                email: emailAdmin,
                senha_hash,
                papel: 'ADMIN',
                id_unidade: unidadedefault.id
            }
        });
        console.log(`✅ Usuário admin CAF criado: ${emailAdmin} / ${senha}`);
    }

    // 3. Criar ou buscar Unidade TI
    let unidadeTi = await prisma.unidade.findFirst({
        where: { tipo: 'TI' }
    });

    if (!unidadeTi) {
        unidadeTi = await prisma.unidade.create({
            data: {
                nome: 'Departamento de TI SESA',
                tipo: 'TI'
            }
        });
        console.log('✅ Unidade TI criada.');
    }

    // 4. Criar Usuário TI
    const emailTi = 'ti@sysfarma.com';
    const existingTi = await prisma.usuario.findUnique({
        where: { email: emailTi }
    });

    if (!existingTi) {
        const senha_hash = await bcrypt.hash(senha, 8);
        await prisma.usuario.create({
            data: {
                nome: 'Suporte TI',
                email: emailTi,
                senha_hash,
                papel: 'ADMIN',
                id_unidade: unidadeTi.id
            }
        });
        console.log(`✅ Usuário TI criado: ${emailTi} / ${senha}`);
    }

    console.log('--- Seed Concluído com Sucesso ---');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
