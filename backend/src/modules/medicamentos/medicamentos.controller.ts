import { Request, Response } from 'express';
import { MedicamentosService } from './medicamentos.service';
import prisma from '../../core/database/prismaClient';
import bcrypt from 'bcryptjs';
import { AppError } from '../../core/exceptions/AppError';

const medicamentosService = new MedicamentosService();

export class MedicamentosController {

    // Lista todos os grupos e suas apresentações filhas
    async listTree(req: Request, res: Response) {
        const result = await medicamentosService.listTree();
        res.json(result);
    }

    // Lista os grupos sem atrelar a lotes para formulários
    async getAllGrupos(req: Request, res: Response) {
        const result = await medicamentosService.getAllGrupos();
        res.json(result);
    }

    // Busca o histórico de auditoria global do catálogo
    async getAllAuditoria(req: Request, res: Response) {
        const result = await medicamentosService.getAllAuditoria();
        res.json(result);
    }

    // Busca histórico de auditoria
    async getAuditoria(req: Request, res: Response) {
        const { entidade, id_entidade } = req.params;
        const result = await medicamentosService.getAuditoria(entidade as string, id_entidade as string);
        res.json(result);
    }

    // Cria um Grupo Pai (ex: Paracetamol)
    async createGrupo(req: Request, res: Response) {
        const data = req.body;
        const result = await medicamentosService.createGrupo(data, req.user?.id);
        res.status(201).json(result);
    }

    // Cria um item Filho para o Grupo Pai (ex: Comprimido 500mg)
    async createApresentacao(req: Request, res: Response) {
        const { id_grupo } = req.params;
        const data = req.body;
        const result = await medicamentosService.createApresentacao(id_grupo as string, data, req.user?.id);
        res.status(201).json(result);
    }

    // Atualiza um Grupo Pai
    async updateGrupo(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = req.body;
        const result = await medicamentosService.updateGrupo(id, data, req.user?.id);
        res.json(result);
    }

    // Exclui um Grupo Pai (exige senha e verifica vínculo)
    async deleteGrupo(req: Request, res: Response) {
        const id = req.params.id as string;
        const { senha } = req.body;

        if (!req.user?.id) throw new AppError('Usuário não autenticado no token.', 401);
        if (!senha) throw new AppError('Senha de confirmação é obrigatória.', 400);

        const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
        if (!usuario) throw new AppError('Sua sessão expirou devido a uma atualização no servidor. Por favor, recarregue a página, faça o logout e entre novamente.', 401);

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) throw new AppError('Senha incorreta.', 401);

        try {
            await medicamentosService.deleteGrupo(id, req.user?.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.code === 'P2003' || (error.message && error.message.includes('violates RESTRICT setting'))) {
                throw new AppError('Não é possível excluir este princípio ativo pois ele já possui variações vinculadas. Por favor, exclua as variações/dosagens primeiro.', 400);
            }
            throw error;
        }
    }

    // Atualiza uma Apresentação Filha
    async updateApresentacao(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = req.body;
        const result = await medicamentosService.updateApresentacao(id, data, req.user?.id);
        res.json(result);
    }

    // Exclui uma Apresentação Filha (exige senha e verifica vínculo de estoque/lote)
    async deleteApresentacao(req: Request, res: Response) {
        const id = req.params.id as string;
        const { senha } = req.body;

        if (!req.user?.id) throw new AppError('Usuário não autenticado no token.', 401);
        if (!senha) throw new AppError('Senha de confirmação é obrigatória.', 400);

        const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
        if (!usuario) throw new AppError('Sua sessão expirou devido a uma atualização no servidor. Por favor, recarregue a página, faça o logout e entre novamente.', 401);

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) throw new AppError('Senha incorreta.', 401);

        try {
            await medicamentosService.deleteApresentacao(id, req.user?.id);
            res.status(204).send();
        } catch (error: any) {
            if (error.code === 'P2003' || (error.message && error.message.includes('violates RESTRICT setting'))) {
                throw new AppError('Não é possível excluir esta variação pois já existem lotes ou estoques vinculados a ela no banco de dados.', 400);
            }
            throw error;
        }
    }
}
