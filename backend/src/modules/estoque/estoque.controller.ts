import { Request, Response } from 'express';
import { EstoqueService } from './estoque.service';
import { AppError } from '../../core/exceptions/AppError';

const estoqueService = new EstoqueService();

export class EstoqueController {
    async registrarEntradaLote(req: Request, res: Response) {
        const { id_medicamento, id_fornecedor, codigo_lote, data_fabricacao, data_validade, quantidade } = req.body;

        // Force unit and user from authenticated payload
        const id_unidade = req.user!.id_unidade;
        const id_usuario = req.user!.id;

        if (!id_medicamento || !codigo_lote || !quantidade) {
            throw new AppError('Medicamento, Lote e Quantidade são obrigatórios.', 400);
        }

        const data = await estoqueService.registrarEntradaLote({
            id_unidade,
            id_usuario,
            id_medicamento,
            id_fornecedor,
            codigo_lote,
            data_fabricacao,
            data_validade,
            quantidade
        });

        res.status(201).json({ status: 'sucesso', ...data });
    }

    async consultarEstoque(req: Request, res: Response) {
        let { id_unidade } = req.params;

        // Multi-tenant RBAC: non-CAF users can only see their own stock
        if (req.user?.tipo_unidade !== 'CAF') {
            id_unidade = req.user!.id_unidade;
        }

        if (!id_unidade) {
            throw new AppError('O ID da Unidade é obrigatório', 400);
        }

        const data = await estoqueService.consultarEstoque(id_unidade as string);
        res.json(data);
    }

    async consultarVencidos(req: Request, res: Response) {
        let { id_unidade } = req.params;

        if (req.user?.tipo_unidade !== 'CAF') {
            id_unidade = req.user!.id_unidade;
        }

        if (!id_unidade) {
            throw new AppError('O ID da Unidade é obrigatório', 400);
        }

        const data = await estoqueService.consultarEstoque(id_unidade as string, true);
        res.json(data);
    }

    async encerraLoteVencido(req: Request, res: Response) {
        const { id_estoque } = req.params;
        const id_usuario = req.user!.id;

        const data = await estoqueService.descartarLoteVencido(id_estoque as string, id_usuario);
        res.json(data);
    }

    async consultarHistoricoDescartes(req: Request, res: Response) {
        let { id_unidade } = req.params;
        if (req.user?.tipo_unidade !== 'CAF') {
            id_unidade = req.user!.id_unidade;
        }

        const data = await estoqueService.consultarHistoricoDescartes(id_unidade as string);
        res.json(data);
    }

    async efetuarRemessa(req: Request, res: Response) {
        let { id_solicitacao, id_unidade_origem, id_unidade_destino, itens } = req.body;

        // Force the active user ID from JWT
        const id_usuario_envio = req.user!.id;

        // Multi-tenant RBAC: non-CAF users can only send from their own unit
        if (req.user?.tipo_unidade !== 'CAF') {
            id_unidade_origem = req.user!.id_unidade;
        }

        if (!id_unidade_origem || !id_unidade_destino || !itens || !itens.length) {
            throw new AppError('Dados incompletos para a remessa. Verifique as unidades e os itens.', 400);
        }

        const data = await estoqueService.efetuarRemessa({
            id_solicitacao,
            id_unidade_origem,
            id_unidade_destino,
            id_usuario_envio,
            itens,
        });

        res.status(201).json({ status: 'sucesso', remessa: data });
    }
}
