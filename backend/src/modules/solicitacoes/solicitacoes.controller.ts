import { Request, Response } from 'express';
import { SolicitacoesService } from './solicitacoes.service';

const solicitacoesService = new SolicitacoesService();

export class SolicitacoesController {
    async create(req: Request, res: Response) {
        const { itens } = req.body;
        const id_unidade_solicitante = req.user?.id_unidade!;
        const id_usuario_solicitante = req.user?.id!;

        const data = await solicitacoesService.create({
            id_unidade_solicitante,
            id_usuario_solicitante,
            itens
        });

        res.status(201).json(data);
    }

    async list(req: Request, res: Response) {
        // Se CAF, lista tudo (Aguardando analise)
        if (req.user?.tipo_unidade === 'CAF') {
            const data = await solicitacoesService.listAll();
            return res.json(data);
        }

        // Se Unidade, lista apenas as próprias
        const data = await solicitacoesService.listByUnidade(req.user?.id_unidade!);
        res.json(data);
    }

    async aprovar(req: Request, res: Response) {
        const { id } = req.params;
        const { itens } = req.body;
        const id_usuario_aprovador = req.user?.id!;

        const data = await solicitacoesService.aprovar({
            id_solicitacao: id as string,
            id_usuario_aprovador,
            itens
        });

        res.json(data);
    }

    async despachar(req: Request, res: Response) {
        const { id } = req.params;
        const id_usuario_despacho = req.user?.id!;

        const data = await solicitacoesService.despachar(id as string, id_usuario_despacho);
        res.json(data);
    }

    async relatorio(req: Request, res: Response) {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: 'Datas inicial e final (start, end) são obrigatórias.' });
        }

        const dados = await solicitacoesService.gerarRelatorio(start as string, end as string);
        res.json(dados);
    }

    async receber(req: Request, res: Response) {
        const { id } = req.params;
        const id_unidade_recebedora = req.user?.id_unidade!;
        const id_usuario_recebedor = req.user?.id!;

        const data = await solicitacoesService.receber(id as string, id_unidade_recebedora, id_usuario_recebedor);
        res.json(data);
    }

    async recusar(req: Request, res: Response) {
        const { id } = req.params;
        const { motivo } = req.body;
        const id_usuario_recusador = req.user?.id!;

        const data = await solicitacoesService.recusar(id as string, id_usuario_recusador, motivo || 'Falta de estoque');
        res.json(data);
    }

    async listarRemessasRecentes(req: Request, res: Response) {
        const data = await solicitacoesService.listarRemessasRecentes(5);
        res.json(data);
    }
}
