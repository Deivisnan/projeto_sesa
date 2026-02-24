import prisma from '../../core/database/prismaClient';
import { TipoUnidade } from '@prisma/client';
import { AppError } from '../../core/exceptions/AppError';

interface CreateUnidadeDTO {
    nome: string;
    cnes?: string;
    tipo: TipoUnidade;
    endereco?: string;
}

export class UnidadesService {
    async listAll() {
        return prisma.unidade.findMany({
            orderBy: { nome: 'asc' },
        });
    }

    async getById(id: string) {
        const unidade = await prisma.unidade.findUnique({
            where: { id },
        });

        if (!unidade) {
            throw new AppError('Unidade not found', 404);
        }

        return unidade;
    }

    async create(data: CreateUnidadeDTO) {
        if (data.cnes) {
            const exists = await prisma.unidade.findUnique({
                where: { cnes: data.cnes },
            });
            if (exists) {
                throw new AppError('Unidade with this CNES already exists', 400);
            }
        }

        return prisma.unidade.create({
            data,
        });
    }

    async deleteUnidade(id: string) {
        // Soft delete para manter a auditoria/histórico intactos
        return prisma.unidade.update({
            where: { id },
            data: { ativo: false }
        });
    }

    async getMedicamentosPermitidos(id_unidade: string) {
        const permitidos = await prisma.unidadeMedicamentoPermitido.findMany({
            where: { id_unidade },
            include: {
                medicamento: {
                    include: { grupo: true }
                }
            }
        });
        return permitidos.map(p => p.medicamento);
    }

    async setMedicamentosPermitidos(id_unidade: string, ids_medicamentos: string[]) {
        try {
            await prisma.unidadeMedicamentoPermitido.deleteMany({
                where: { id_unidade }
            });

            if (ids_medicamentos && ids_medicamentos.length > 0) {
                const data = ids_medicamentos.map(id_med => ({
                    id_unidade,
                    id_medicamento: id_med
                }));
                await prisma.unidadeMedicamentoPermitido.createMany({ data });
            }
            return true;
        } catch (error: any) {
            console.error("ERRO GRAVE NO PRISMA AO SALVAR CATÁLOGO:", error);
            try {
                require('fs').appendFileSync('debug-post.txt', `[ERRO PRISMA] ${error.message}\n`);
            } catch (e) { }
            throw new AppError(`Falha SQL Interna: ${error.message || 'Erro no banco de dados'}`, 500);
        }
    }
}
