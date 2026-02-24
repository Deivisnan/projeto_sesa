import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const unidade = await prisma.unidade.findFirst({ where: { tipo: 'UBS' } });
        const med = await prisma.medicamento.findFirst();

        if (!unidade || !med) {
            console.log('Sem dados');
            return;
        }

        console.log(`Tentando inserir Permissao para Unidade: ${unidade.id} ${unidade.nome} e Med: ${med.id}`);

        await prisma.unidadeMedicamentoPermitido.deleteMany({ where: { id_unidade: unidade.id } });

        await prisma.unidadeMedicamentoPermitido.createMany({
            data: [{ id_unidade: unidade.id, id_medicamento: med.id }]
        });

        console.log('Insercao funcionou!');
    } catch (err) {
        console.error('ERRO:', err);
    } finally {
        await prisma.$disconnect();
    }
}
run();
