import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../core/database/prismaClient';
import { AppError } from '../../core/exceptions/AppError';
import { TokenPayload } from '../../@types/express';

class AuthService {
    async login(email: string, senha_plana: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { email },
            include: { unidade: true },
        });

        if (!usuario) {
            throw new AppError('E-mail ou senha incorretos.', 401);
        }

        if (!usuario.ativo) {
            throw new AppError('Usuário inativo. Contate o administrador.', 403);
        }

        const passwordMatch = await bcrypt.compare(senha_plana, usuario.senha_hash);

        if (!passwordMatch) {
            throw new AppError('Senha incorreta.', 401);
        }

        // Gerar token com Payload Multi-Tenant
        const payload: TokenPayload = {
            id: usuario.id,
            id_unidade: usuario.id_unidade,
            tipo_unidade: usuario.unidade.tipo,
            papel: usuario.papel,
        };

        const secret = process.env.JWT_SECRET || 'default_secret_key';
        const token = jwt.sign(payload, secret, {
            expiresIn: '1d', // Token válido por 1 dia
        });

        return {
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                papel: usuario.papel,
                unidade: {
                    id: usuario.unidade.id,
                    nome: usuario.unidade.nome,
                    tipo: usuario.unidade.tipo,
                }
            },
            token,
        };
    }

    // Rota auxiliar temporária para o usuário criar seu primeiro Admin da CAF
    async setupAdminDev(email: string, senha_plana: string) {
        // Verifica se já existe a CAF central
        let caf = await prisma.unidade.findFirst({ where: { tipo: 'CAF' } });
        if (!caf) {
            caf = await prisma.unidade.create({
                data: { nome: 'CAF Central Admin', tipo: 'CAF' }
            });
        }

        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError("Esse admin já existe");
        }

        const senha_hash = await bcrypt.hash(senha_plana, 8);

        return prisma.usuario.create({
            data: {
                nome: 'Administrador Master',
                email,
                senha_hash,
                papel: 'ADMIN',
                id_unidade: caf.id
            }
        });
    }
}

export const authService = new AuthService();
