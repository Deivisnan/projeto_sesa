import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../core/exceptions/AppError';
import prisma from '../../core/database/prismaClient';
import bcrypt from 'bcryptjs';

class AuthController {
    async login(req: Request, res: Response) {
        const { email, senha } = req.body;

        if (!email || !senha) {
            throw new AppError('E-mail e senha são obrigatórios', 400);
        }

        const authData = await authService.login(email, senha);
        res.json(authData);
    }

    async setup(req: Request, res: Response) {
        const { email, senha } = req.body;
        if (!email || !senha) {
            throw new AppError('E-mail e senha são obrigatórios', 400);
        }

        const admin = await authService.setupAdminDev(email, senha);
        res.status(201).json({ message: "Admin setup completo!", email: admin.email });
    }

    async verifyPassword(req: Request, res: Response) {
        // Obter id do usuário autenticado no token (precisa do middleware ensureAuthenticated na rota, ou checkar aqui)
        const id_usuario = req.user?.id;
        const { senha } = req.body;

        if (!id_usuario) throw new AppError('Usuário não autenticado', 401);
        if (!senha) throw new AppError('Senha é obrigatória', 400);

        const usuario = await prisma.usuario.findUnique({ where: { id: id_usuario } });
        if (!usuario) throw new AppError('Sua sessão expirou devido a uma atualização no servidor. Por favor, recarregue a página, faça o logout e entre novamente.', 401);

        const passwordMatch = await bcrypt.compare(senha, usuario.senha_hash);
        if (!passwordMatch) throw new AppError('Senha incorreta', 401);

        res.json({ valid: true });
    }
}

export const authController = new AuthController();
