import { Request, Response } from 'express';
import { UnidadesService } from './unidades.service';
import { AppError } from '../../core/exceptions/AppError';

const unidadesService = new UnidadesService();

export class UnidadesController {
    async listAll(req: Request, res: Response) {
        // Multi-tenant RBAC
        if (req.user?.tipo_unidade !== 'CAF' && req.user?.tipo_unidade !== 'TI') {
            const data = await unidadesService.getById(req.user!.id_unidade);
            return res.json([data]);
        }

        const data = await unidadesService.listAll();
        res.json(data);
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;

        // Multi-tenant RBAC
        if (req.user?.tipo_unidade !== 'CAF' && req.user?.tipo_unidade !== 'TI' && req.user?.id_unidade !== id) {
            throw new AppError('Acesso Negado. Você só pode visualizar a sua própria unidade.', 403);
        }

        const data = await unidadesService.getById(id as string);
        res.json(data);
    }

    async create(req: Request, res: Response) {
        const { nome, cnes, tipo, endereco } = req.body;

        if (!nome || !tipo) {
            throw new AppError('Nome and Tipo are required fields', 400);
        }

        const data = await unidadesService.create({ nome, cnes, tipo, endereco });
        res.status(201).json(data);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        await unidadesService.deleteUnidade(id as string);
        res.json({ message: 'Unidade desativada com sucesso' });
    }

    async getMedicamentosPermitidos(req: Request, res: Response) {
        const { id } = req.params;
        const permitidos = await unidadesService.getMedicamentosPermitidos(id as string);
        res.json(permitidos);
    }

    async setMedicamentosPermitidos(req: Request, res: Response) {
        const { id } = req.params;
        const { ids_medicamentos } = req.body; // Array de IDs
        try {
            require('fs').appendFileSync('debug-post.txt', `[REQ] Unidade: ${id} | Body: ${JSON.stringify(ids_medicamentos)}\n`);
        } catch (e) { }

        await unidadesService.setMedicamentosPermitidos(id as string, ids_medicamentos || []);
        res.json({ message: 'Permissões de catálogo atualizadas com sucesso' });
    }
}
