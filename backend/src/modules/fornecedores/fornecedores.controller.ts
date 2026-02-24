import { Request, Response } from 'express';
import { FornecedoresService } from './fornecedores.service';

const fornecedoresService = new FornecedoresService();

export class FornecedoresController {
    async create(req: Request, res: Response) {
        const data = req.body;
        const result = await fornecedoresService.create(data);
        res.status(201).json(result);
    }

    async listAll(req: Request, res: Response) {
        const result = await fornecedoresService.listAll();
        res.json(result);
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const result = await fornecedoresService.getById(id as string);
        res.json(result);
    }
}
