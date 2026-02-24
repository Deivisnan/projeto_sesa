import { Request, Response } from 'express';
import { UsuariosService } from './usuarios.service';
import { AppError } from '../../core/exceptions/AppError';

const usuariosService = new UsuariosService();

export class UsuariosController {
    async listAll(req: Request, res: Response) {
        const data = await usuariosService.listAll();
        res.json(data);
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const data = await usuariosService.getById(id as string);
        res.json(data);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { nome, email, id_unidade, papel } = req.body;
        const data = await usuariosService.update(id as string, { nome, email, id_unidade, papel });
        res.json(data);
    }

    async create(req: Request, res: Response) {
        const { nome, email, senha, id_unidade, papel } = req.body;
        if (!nome || !email || !senha || !id_unidade || !papel) {
            throw new AppError('Todos os campos (nome, email, senha, id_unidade e papel) são obrigatórios.', 400);
        }

        const data = await usuariosService.create({ nome, email, senha_plaintext: senha, id_unidade, papel });
        res.status(201).json(data);
    }

    async resetPassword(req: Request, res: Response) {
        const { id } = req.params;
        const { nova_senha } = req.body;

        if (!nova_senha) throw new AppError('A nova senha é obrigatória', 400);

        await usuariosService.resetPassword(id as string, nova_senha);
        res.json({ message: 'Senha redefinida com sucesso pelo administrador.' });
    }

    async toggleStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { ativo } = req.body; // Boolean

        if (typeof ativo !== 'boolean') throw new AppError('O campo "ativo" precisa ser um valor booleano (true/false)', 400);

        const data = await usuariosService.toggleStatus(id as string, ativo);
        res.json(data);
    }
}
