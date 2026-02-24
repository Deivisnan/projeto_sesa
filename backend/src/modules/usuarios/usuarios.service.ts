import prisma from '../../core/database/prismaClient';
import { AppError } from '../../core/exceptions/AppError';
import bcrypt from 'bcryptjs';

export class UsuariosService {
    async listAll() {
        return prisma.usuario.findMany({
            include: { unidade: true },
            orderBy: { nome: 'asc' }
        });
    }

    async getById(id: string) {
        const user = await prisma.usuario.findUnique({
            where: { id },
            include: { unidade: true }
        });
        if (!user) throw new AppError('Usuário não encontrado', 404);
        return user;
    }

    async create(data: { nome: string; email: string; senha_plaintext: string; id_unidade: string; papel: string }) {
        const exists = await prisma.usuario.findUnique({ where: { email: data.email } });
        if (exists) throw new AppError('Este e-mail já está em uso por outro usuário', 400);

        const senha_hash = await bcrypt.hash(data.senha_plaintext, 10);

        return prisma.usuario.create({
            data: {
                nome: data.nome,
                email: data.email,
                senha_hash,
                id_unidade: data.id_unidade,
                papel: data.papel,
            },
            select: { id: true, nome: true, email: true, papel: true, ativo: true } // Evita retornar hash
        });
    }

    async resetPassword(id: string, nova_senha_plaintext: string) {
        const senha_hash = await bcrypt.hash(nova_senha_plaintext, 10);
        return prisma.usuario.update({
            where: { id },
            data: { senha_hash },
            select: { id: true, email: true }
        });
    }

    async toggleStatus(id: string, ativo: boolean) {
        return prisma.usuario.update({
            where: { id },
            data: { ativo },
            select: { id: true, nome: true, ativo: true }
        });
    }
}
