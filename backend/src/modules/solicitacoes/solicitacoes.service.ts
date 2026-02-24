import prisma from '../../core/database/prismaClient';
import { AppError } from '../../core/exceptions/AppError';

interface CriarSolicitacaoDTO {
    id_unidade_solicitante: string;
    id_usuario_solicitante: string;
    itens: { id_medicamento: string; quantidade_solicitada: number }[];
}

interface AprovarSolicitacaoDTO {
    id_solicitacao: string;
    id_usuario_aprovador: string;
    itens: { id_item_solicitacao: string; id_medicamento: string; quantidade_aprovada: number }[];
}

export class SolicitacoesService {
    async create(data: CriarSolicitacaoDTO) {
        if (!data.itens || data.itens.length === 0) {
            throw new AppError('A solicitação precisa ter ao menos um item.', 400);
        }

        // Transação para criar a solicitação e os itens associados
        const solicitacao = await prisma.$transaction(async (tx: any) => {
            const nova = await tx.solicitacao.create({
                data: {
                    id_unidade_solicitante: data.id_unidade_solicitante,
                    id_usuario_solicitante: data.id_usuario_solicitante,
                    status: 'AGUARDANDO_ANALISE'
                }
            });

            const itensData = data.itens.map(item => ({
                id_solicitacao: nova.id,
                id_medicamento: item.id_medicamento,
                quantidade_solicitada: item.quantidade_solicitada
            }));

            await tx.itemSolicitacao.createMany({
                data: itensData
            });

            return nova;
        });

        return solicitacao;
    }

    async listByUnidade(id_unidade: string) {
        return prisma.solicitacao.findMany({
            where: { id_unidade_solicitante: id_unidade },
            include: {
                itens: {
                    include: {
                        medicamento: {
                            include: { grupo: true }
                        }
                    }
                },
                usuario: { select: { nome: true } }
            },
            orderBy: { data_solicitacao: 'desc' }
        });
    }

    async listAll() {
        return prisma.solicitacao.findMany({
            include: {
                unidade: { select: { nome: true, tipo: true } },
                itens: {
                    include: {
                        medicamento: {
                            include: { grupo: true }
                        }
                    }
                },
                usuario: { select: { nome: true } }
            },
            orderBy: { data_solicitacao: 'desc' }
        });
    }

    async aprovar(data: AprovarSolicitacaoDTO) {
        return prisma.$transaction(async (tx: any) => {
            const caf = await tx.unidade.findFirst({
                where: { tipo: 'CAF' }
            });

            if (!caf) throw new AppError('Unidade Central CAF não encontrada no sistema.', 500);

            // Atualiza status da solicitação
            await tx.solicitacao.update({
                where: { id: data.id_solicitacao },
                data: { status: 'EM_SEPARACAO' }
            });

            for (const item of data.itens) {
                if (item.quantidade_aprovada > 0) {
                    const estoques = await tx.estoque.findMany({
                        where: { id_unidade: caf.id, lote: { id_medicamento: item.id_medicamento }, quantidade: { gt: 0 } },
                    });

                    const estoqueTotal = estoques.reduce((acc, est) => acc + est.quantidade, 0);

                    if (item.quantidade_aprovada > estoqueTotal) {
                        const med = await tx.medicamento.findUnique({ where: { id: item.id_medicamento }, include: { grupo: true } });
                        throw new AppError(`ESTOQUE_INSUFICIENTE|${med?.grupo?.nome} - ${med?.apresentacao}|${estoqueTotal}|${item.quantidade_aprovada}|${item.id_item_solicitacao}|${item.id_medicamento}`, 400);
                    }
                }

                // Apenas registra e salva a quantidade aprovada
                await tx.itemSolicitacao.update({
                    where: { id: item.id_item_solicitacao },
                    data: { quantidade_aprovada: item.quantidade_aprovada }
                });
            }

            return { message: 'Aprovação registrada com sucesso! Pedido enviado para Separação.' };
        });
    }

    async despachar(id_solicitacao: string, id_usuario_despacho: string) {
        return prisma.$transaction(async (tx: any) => {
            const sol = await tx.solicitacao.findUnique({
                where: { id: id_solicitacao },
                include: { itens: true }
            });

            if (!sol) throw new AppError('Solicitação não encontrada', 404);
            if (sol.status !== 'EM_SEPARACAO') throw new AppError('Apenas solicitações em separação podem ser despachadas.', 400);

            // Fetch CAF
            const caf = await tx.unidade.findFirst({ where: { tipo: 'CAF' } });
            if (!caf) throw new AppError('CAF não encontrada no sistema', 404);

            for (const item of sol.itens) {
                let restante = item.quantidade_aprovada || 0;

                if (restante > 0) {
                    const estoques = await tx.estoque.findMany({
                        where: { id_unidade: caf.id, lote: { id_medicamento: item.id_medicamento }, quantidade: { gt: 0 } },
                        include: { lote: true },
                        orderBy: { lote: { data_validade: 'asc' } }
                    });

                    // FIFO
                    for (const est of estoques) {
                        if (restante <= 0) break;

                        const qtdDeduzir = Math.min(est.quantidade, restante);
                        restante -= qtdDeduzir;

                        await tx.estoque.update({
                            where: { id: est.id },
                            data: { quantidade: est.quantidade - qtdDeduzir }
                        });

                        await tx.movimentacaoEstoque.create({
                            data: {
                                id_unidade: caf.id,
                                id_lote: est.id_lote,
                                id_usuario: id_usuario_despacho,
                                tipo: 'SAIDA_REMESSA',
                                quantidade: -qtdDeduzir,
                                referencia_id: id_solicitacao,
                                observacao: `Expedição no Despacho da Remessa ${id_solicitacao.split('-')[0]}`
                            }
                        });
                    }

                    if (restante > 0) {
                        const estoqueTotal = estoques.reduce((acc: number, est: any) => acc + est.quantidade, 0);
                        const med = await tx.medicamento.findUnique({ where: { id: item.id_medicamento }, include: { grupo: true } });
                        throw new AppError(`ESTOQUE_INSUFICIENTE|${med?.grupo?.nome} - ${med?.apresentacao}|${estoqueTotal}|${item.quantidade_aprovada}|${item.id}|${item.id_medicamento}`, 400);
                    }
                }
            }

            await tx.solicitacao.update({
                where: { id: id_solicitacao },
                data: { status: 'DESPACHADA' }
            });

            return { message: 'Caixas despachadas. Estoque central deduzido definitivamente.' };
        });
    }

    async receber(id_solicitacao: string, id_unidade_recebedora: string, id_usuario_recebedor: string) {
        return prisma.$transaction(async (tx: any) => {
            const sol = await tx.solicitacao.findUnique({
                where: { id: id_solicitacao }
            });

            if (!sol) throw new AppError('Solicitação não encontrada', 404);
            if (sol.id_unidade_solicitante !== id_unidade_recebedora) throw new AppError('Esta solicitação não pertence a esta unidade.', 403);
            if (sol.status !== 'DESPACHADA') throw new AppError('Apenas solicitações despachadas pela CAF podem ser recebidas.', 400);

            // TODO (Futuro): Injetar o estoque recebido na tabela Estoque desta Unidade Local

            await tx.solicitacao.update({
                where: { id: id_solicitacao },
                data: { status: 'ATENDIDA_INTEGRAL' }
            });

            return { message: 'Entrega confirmada com sucesso! Remessa concluída.' };
        });
    }

    async gerarRelatorio(dataInicial: string, dataFinal: string) {
        const solicitacoes = await prisma.solicitacao.findMany({
            where: {
                status: { in: ['EM_SEPARACAO', 'DESPACHADA', 'ATENDIDA_INTEGRAL', 'ATENDIDA_PARCIAL'] },
                data_solicitacao: {
                    gte: new Date(dataInicial),
                    lte: new Date(new Date(dataFinal).setUTCHours(23, 59, 59, 999))
                }
            },
            include: {
                unidade: { select: { nome: true } },
                itens: {
                    include: {
                        medicamento: {
                            include: { grupo: true }
                        }
                    }
                }
            },
            orderBy: { data_solicitacao: 'asc' }
        });

        return solicitacoes;
    }

    async recusar(id_solicitacao: string, id_usuario_recusador: string, motivo: string) {
        return prisma.$transaction(async (tx: any) => {
            const sol = await tx.solicitacao.findUnique({
                where: { id: id_solicitacao }
            });

            if (!sol) throw new AppError('Solicitação não encontrada', 404);
            if (sol.status !== 'AGUARDANDO_ANALISE' && sol.status !== 'EM_SEPARACAO') {
                throw new AppError('Apenas solicitações aguardando análise ou em separação podem ser recusadas/canceladas.', 400);
            }

            // Apenas atualiza o status para RECUSADA
            await tx.solicitacao.update({
                where: { id: id_solicitacao },
                data: { status: 'RECUSADA' }
            });

            return { message: motivo };
        });
    }

    async listarRemessasRecentes(limit: number = 5) {
        // Consulta Remessas Avulsas
        const remessas = await prisma.remessa.findMany({
            take: limit,
            orderBy: { data_envio: 'desc' },
            include: {
                unidadeDestino: { select: { nome: true } },
                usuarioEnvio: { select: { nome: true } },
                itens: true
            }
        });

        // Consulta Solicitações Despachadas ou Entregues
        const solicitacoes = await prisma.solicitacao.findMany({
            where: {
                status: {
                    in: ['DESPACHADA', 'ATENDIDA_INTEGRAL', 'ATENDIDA_PARCIAL']
                }
            },
            take: limit,
            orderBy: { data_solicitacao: 'desc' },
            include: {
                unidade: { select: { nome: true } },
                usuario: { select: { nome: true } },
                itens: true
            }
        });

        // Unificar, Normalizar e Ordenar por Data Decrescente
        const unificado = [
            ...remessas.map((r: any) => ({
                id: r.id,
                tipo_logistica: 'REMESSA_AVULSA',
                data_evento: r.data_envio,
                destino: r.unidadeDestino.nome,
                responsavel: r.usuarioEnvio.nome,
                quantidade_itens: r.itens.length
            })),
            ...solicitacoes.map((s: any) => ({
                id: s.id,
                tipo_logistica: 'SOLICITACAO_ATENDIDA',
                data_evento: s.data_solicitacao,
                destino: s.unidade.nome,
                responsavel: s.usuario.nome,
                quantidade_itens: s.itens.length
            }))
        ];

        unificado.sort((a, b) => b.data_evento.getTime() - a.data_evento.getTime());

        return unificado.slice(0, limit);
    }
}
