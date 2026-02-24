import prisma from '../../core/database/prismaClient';
import { TipoMovEstoque } from '@prisma/client';
import { AppError } from '../../core/exceptions/AppError';

interface EfetuarRemessaDTO {
    id_solicitacao?: string;
    id_unidade_origem: string;
    id_unidade_destino: string;
    id_usuario_envio: string;
    itens: {
        id_lote: string;
        quantidade: number;
    }[];
}

export interface EntradaLoteDTO {
    id_unidade: string;
    id_usuario: string;
    id_medicamento: string;
    id_fornecedor: string;
    codigo_lote: string;
    data_fabricacao: string;
    data_validade: string;
    quantidade: number;
}

export class EstoqueService {
    async consultarEstoque(id_unidade: string, apenasVencidos = false) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        return prisma.estoque.findMany({
            where: {
                id_unidade,
                quantidade: { gt: 0 },
                lote: apenasVencidos
                    ? { data_validade: { lt: hoje } }
                    : { data_validade: { gte: hoje } }
            },
            include: {
                lote: {
                    include: {
                        medicamento: {
                            include: { grupo: true }
                        },
                        fornecedor: true
                    },
                },
            },
        });
    }

    async registrarEntradaLote(data: EntradaLoteDTO) {
        if (data.quantidade <= 0) throw new AppError('Quantidade precisa ser maior que zero.', 400);

        return await prisma.$transaction(async (tx: any) => {
            // 1. Create or ensure Lote exists
            const lote = await tx.lote.upsert({
                where: {
                    codigo_lote_id_medicamento_id_fornecedor: {
                        codigo_lote: data.codigo_lote,
                        id_medicamento: data.id_medicamento,
                        id_fornecedor: data.id_fornecedor
                    }
                },
                update: {}, // if exists, just use it
                create: {
                    id_medicamento: data.id_medicamento,
                    id_fornecedor: data.id_fornecedor,
                    codigo_lote: data.codigo_lote,
                    data_fabricacao: new Date(data.data_fabricacao),
                    data_validade: new Date(data.data_validade)
                }
            });

            // 2. Add quantity to the Stock physically
            const estoque = await tx.estoque.upsert({
                where: {
                    id_unidade_id_lote: {
                        id_unidade: data.id_unidade,
                        id_lote: lote.id
                    }
                },
                update: {
                    quantidade: { increment: data.quantidade }
                },
                create: {
                    id_unidade: data.id_unidade,
                    id_lote: lote.id,
                    quantidade: data.quantidade
                }
            });

            // 3. Register Audit trail
            await tx.movimentacaoEstoque.create({
                data: {
                    id_unidade: data.id_unidade,
                    id_lote: lote.id,
                    id_usuario: data.id_usuario,
                    tipo: TipoMovEstoque.ENTRADA_COMPRA,
                    quantidade: data.quantidade,
                    observacao: 'Carga Inicial / Recebimento de Fornecedor'
                }
            });

            return { lote, estoque };
        });
    }

    /**
     * Crticial Transaction Method
     * Safely deducts stock from CAF and adds to UBS
     */
    async efetuarRemessa(data: EfetuarRemessaDTO) {
        if (data.id_unidade_origem === data.id_unidade_destino) {
            throw new AppError('A unidade de origem e destino não podem ser as mesmas', 400);
        }

        return await prisma.$transaction(async (tx: any) => {
            // 1. Create Remessa registry
            const remessa = await tx.remessa.create({
                data: {
                    id_solicitacao: data.id_solicitacao,
                    id_unidade_origem: data.id_unidade_origem,
                    id_unidade_destino: data.id_unidade_destino,
                    id_usuario_envio: data.id_usuario_envio,
                },
            });

            for (const item of data.itens) {
                // 2. Obtain current stock for the item with row lock (pseudo-lock via application logic with check)
                const estoqueOrigem = await tx.estoque.findUnique({
                    where: {
                        id_unidade_id_lote: {
                            id_unidade: data.id_unidade_origem,
                            id_lote: item.id_lote,
                        },
                    },
                });

                if (!estoqueOrigem || estoqueOrigem.quantidade < item.quantidade) {
                    throw new AppError(
                        `Estoque insuficiente (Lote: ${item.id_lote}) na unidade de origem. Requer: ${item.quantidade}, Atual: ${estoqueOrigem?.quantidade || 0}`,
                        400
                    );
                }

                // 3. Deduce from Origin (CAF)
                await tx.estoque.update({
                    where: { id: estoqueOrigem.id },
                    data: { quantidade: { decrement: item.quantidade } },
                });

                // 4. Add to Destination (UBS)
                await tx.estoque.upsert({
                    where: {
                        id_unidade_id_lote: {
                            id_unidade: data.id_unidade_destino,
                            id_lote: item.id_lote,
                        },
                    },
                    update: {
                        quantidade: { increment: item.quantidade },
                    },
                    create: {
                        id_unidade: data.id_unidade_destino,
                        id_lote: item.id_lote,
                        quantidade: item.quantidade,
                    },
                });

                // 5. Register Items in Remessa
                await tx.itemRemessa.create({
                    data: {
                        id_remessa: remessa.id,
                        id_lote: item.id_lote,
                        quantidade: item.quantidade,
                    },
                });

                // 6. Record Movimentacoes (Audit Log)
                await tx.movimentacaoEstoque.createMany({
                    data: [
                        {
                            id_unidade: data.id_unidade_origem,
                            id_lote: item.id_lote,
                            id_usuario: data.id_usuario_envio,
                            tipo: TipoMovEstoque.SAIDA_REMESSA,
                            quantidade: -item.quantidade,
                            referencia_id: remessa.id,
                        },
                        {
                            id_unidade: data.id_unidade_destino,
                            id_lote: item.id_lote,
                            id_usuario: data.id_usuario_envio,
                            tipo: TipoMovEstoque.ENTRADA_REMESSA,
                            quantidade: item.quantidade,
                            referencia_id: remessa.id,
                        },
                    ],
                });
            }

            return remessa;
        });
    }

    async descartarLoteVencido(id_estoque: string, id_usuario_descarte: string) {
        return prisma.$transaction(async (tx: any) => {
            const estoque = await tx.estoque.findUnique({
                where: { id: id_estoque },
                include: { lote: true }
            });

            if (!estoque) throw new AppError('Registro de estoque não encontrado.', 404);
            if (estoque.quantidade <= 0) throw new AppError('Este lote já está zerado.', 400);

            const qtdDescarte = estoque.quantidade;

            await tx.estoque.update({
                where: { id: id_estoque },
                data: { quantidade: 0 }
            });

            await tx.movimentacaoEstoque.create({
                data: {
                    id_unidade: estoque.id_unidade,
                    id_lote: estoque.id_lote,
                    id_usuario: id_usuario_descarte,
                    tipo: TipoMovEstoque.PERDA_VENCIMENTO,
                    quantidade: -qtdDescarte,
                    observacao: `Descarte administrativo de lote vencido (${estoque.lote.codigo_lote}).`
                }
            });

            return { message: 'Lote descartado do sistema com sucesso. A quantidade e os custos foram anulados.' };
        });
    }

    async consultarHistoricoDescartes(id_unidade: string) {
        return prisma.movimentacaoEstoque.findMany({
            where: {
                id_unidade,
                tipo: TipoMovEstoque.PERDA_VENCIMENTO
            },
            include: {
                lote: { include: { medicamento: { include: { grupo: true } } } },
                usuario: { select: { nome: true } }
            },
            orderBy: {
                data_movimentacao: 'desc'
            }
        });
    }
}
