import prisma from '../../core/database/prismaClient';
import { AppError } from '../../core/exceptions/AppError';

export interface FornecedorCreateDTO {
    razao_social: string;
    cnpj: string;
}

export class FornecedoresService {
    async create(data: FornecedorCreateDTO) {
        if (data.cnpj) {
            const existing = await prisma.fornecedor.findUnique({
                where: { cnpj: data.cnpj },
            });

            if (existing) {
                throw new AppError('Já existe um fornecedor cadastrado com este CNPJ.', 400);
            }
        }

        return prisma.fornecedor.create({
            data,
        });
    }

    async listAll() {
        return prisma.fornecedor.findMany({
            orderBy: { razao_social: 'asc' },
        });
    }

    async getById(id: string) {
        const fornecedor = await prisma.fornecedor.findUnique({
            where: { id },
        });

        if (!fornecedor) {
            throw new AppError('Fornecedor não encontrado.', 404);
        }

        return fornecedor;
    }
}
