import prisma from '../../core/database/prismaClient';
import { AppError } from '../../core/exceptions/AppError';

export interface GrupoCreateDTO {
    nome: string;
    estoque_minimo?: number;
}

export interface ApresentacaoCreateDTO {
    apresentacao: string;
    codigo_br?: string;
    estoque_minimo?: number;
}

export class MedicamentosService {
    // 1. Criar Grupo Farmacológico
    async createGrupo(data: GrupoCreateDTO, id_usuario?: string) {
        const existing = await prisma.medicamentoGrupo.findUnique({
            where: { nome: data.nome }
        });
        if (existing) {
            throw new AppError('Já existe um grupo cadastrado com este nome.', 400);
        }

        const novo = await prisma.medicamentoGrupo.create({
            data: {
                nome: data.nome,
                estoque_minimo: data.estoque_minimo || 0
            }
        });

        if (id_usuario) {
            await prisma.auditoria.create({
                data: {
                    entidade: 'MedicamentoGrupo',
                    id_entidade: novo.id,
                    acao: 'CRIACAO',
                    id_usuario,
                    detalhes: JSON.stringify({ nome: novo.nome })
                }
            });
        }

        return novo;
    }

    // 2. Criar Apresentação/Dosagem vinculada ao Pai
    async createApresentacao(id_grupo: string, data: ApresentacaoCreateDTO, id_usuario?: string) {
        const grupo = await prisma.medicamentoGrupo.findUnique({ where: { id: id_grupo } });
        if (!grupo) throw new AppError('Grupo farmacológico não encontrado.', 404);

        if (data.codigo_br) {
            const byCode = await prisma.medicamento.findUnique({ where: { codigo_br: data.codigo_br } });
            if (byCode) throw new AppError('Código BR já está em uso.', 400);
        }

        const sameApresentacao = await prisma.medicamento.findFirst({
            where: { id_grupo, apresentacao: data.apresentacao }
        });
        if (sameApresentacao) throw new AppError('Esta apresentação já existe para este grupo.', 400);

        const nova = await prisma.medicamento.create({
            data: {
                id_grupo,
                apresentacao: data.apresentacao,
                codigo_br: data.codigo_br || null,
                estoque_minimo: data.estoque_minimo || 0
            }
        });

        if (id_usuario) {
            await prisma.auditoria.create({
                data: {
                    entidade: 'Medicamento',
                    id_entidade: nova.id,
                    acao: 'CRIACAO',
                    id_usuario,
                    detalhes: JSON.stringify({ apresentacao: nova.apresentacao, grupo_nome: grupo.nome })
                }
            });
        }

        return nova;
    }

    // 3. Listar Árvore Completa
    async listTree() {
        const grupos = await prisma.medicamentoGrupo.findMany({
            orderBy: { nome: 'asc' },
            include: {
                medicamentos: {
                    orderBy: { apresentacao: 'asc' },
                    include: {
                        lotes: {
                            include: {
                                estoque: true
                            }
                        }
                    }
                }
            }
        });

        // Compute total current stock across all lots and units for each presentation and group
        return grupos.map((grupo: any) => {
            let totalGrupo = 0;
            const medicamentosMapeados = grupo.medicamentos.map((med: any) => {
                const totalApresentacao = med.lotes.reduce((sum: number, lote: any) => {
                    return sum + lote.estoque.reduce((sq: number, est: any) => sq + est.quantidade, 0);
                }, 0);

                totalGrupo += totalApresentacao;

                // Return without the raw lotes/estoque array to keep response clean
                return {
                    id: med.id,
                    id_grupo: med.id_grupo,
                    codigo_br: med.codigo_br,
                    apresentacao: med.apresentacao,
                    estoque_minimo: med.estoque_minimo,
                    estoque_atual: totalApresentacao
                };
            });

            return {
                id: grupo.id,
                nome: grupo.nome,
                estoque_minimo: grupo.estoque_minimo,
                estoque_atual: totalGrupo,
                medicamentos: medicamentosMapeados
            };
        });
    }

    // 3.5 Listar Grupos Simplificados para Formulários (Sem depender de Lotes/Estoque)
    async getAllGrupos() {
        return prisma.medicamentoGrupo.findMany({
            orderBy: { nome: 'asc' },
            include: {
                medicamentos: {
                    orderBy: { apresentacao: 'asc' }
                }
            }
        });
    }

    // 4. Update Grupo
    async updateGrupo(id: string, data: Partial<GrupoCreateDTO>, id_usuario?: string) {
        const atualizado = await prisma.medicamentoGrupo.update({
            where: { id },
            data: {
                nome: data.nome,
                estoque_minimo: data.estoque_minimo
            }
        });

        if (id_usuario) {
            await prisma.auditoria.create({
                data: {
                    entidade: 'MedicamentoGrupo',
                    id_entidade: id,
                    acao: 'EDICAO',
                    id_usuario,
                    detalhes: JSON.stringify(data)
                }
            });
        }

        return atualizado;
    }

    // 5. Delete Grupo
    async deleteGrupo(id: string, id_usuario?: string) {
        // Will fail at DB level if there are linked apresentacoes (Foreign Key Restrict)

        const grupo = await prisma.medicamentoGrupo.findUnique({ where: { id } });

        const deletado = await prisma.medicamentoGrupo.delete({
            where: { id }
        });

        if (id_usuario && grupo) {
            await prisma.auditoria.create({
                data: {
                    entidade: 'MedicamentoGrupo',
                    id_entidade: id,
                    acao: 'EXCLUSAO',
                    id_usuario,
                    detalhes: JSON.stringify({ nome: grupo.nome })
                }
            });
        }

        return deletado;
    }

    // 6. Update Apresentacao
    async updateApresentacao(id: string, data: Partial<ApresentacaoCreateDTO>, id_usuario?: string) {
        const atualizada = await prisma.medicamento.update({
            where: { id },
            data: {
                apresentacao: data.apresentacao,
                codigo_br: data.codigo_br,
                estoque_minimo: data.estoque_minimo
            }
        });

        if (id_usuario) {
            const med = await prisma.medicamento.findUnique({ where: { id }, include: { grupo: true } });
            await prisma.auditoria.create({
                data: {
                    entidade: 'Medicamento',
                    id_entidade: id,
                    acao: 'EDICAO',
                    id_usuario,
                    detalhes: JSON.stringify({ ...data, grupo_nome: med?.grupo.nome })
                }
            });
        }

        return atualizada;
    }

    // 7. Delete Apresentacao
    async deleteApresentacao(id: string, id_usuario?: string) {
        // Will fail at DB level if there are linked lotes/estoque/solicitacoes (Foreign Key Restrict)

        const med = await prisma.medicamento.findUnique({ where: { id }, include: { grupo: true } });

        const deletado = await prisma.medicamento.delete({
            where: { id }
        });

        if (id_usuario && med) {
            await prisma.auditoria.create({
                data: {
                    entidade: 'Medicamento',
                    id_entidade: id,
                    acao: 'EXCLUSAO',
                    id_usuario,
                    detalhes: JSON.stringify({ apresentacao: med.apresentacao, grupo_nome: med.grupo.nome })
                }
            });
        }

        return deletado;
    }

    // 8. Buscar Auditoria por Item
    async getAuditoria(entidade: string, id_entidade: string) {
        return prisma.auditoria.findMany({
            where: {
                entidade,
                id_entidade
            },
            include: {
                usuario: {
                    select: {
                        nome: true,
                        papel: true
                    }
                }
            },
            orderBy: {
                data_hora: 'desc'
            }
        });
    }

    // 9. Buscar Todas as Auditorias do Catálogo
    async getAllAuditoria() {
        return prisma.auditoria.findMany({
            where: {
                entidade: {
                    in: ['MedicamentoGrupo', 'Medicamento']
                }
            },
            include: {
                usuario: {
                    select: {
                        nome: true,
                        papel: true
                    }
                }
            },
            orderBy: {
                data_hora: 'desc'
            },
            take: 100 // limit to last 100 actions for performance
        });
    }
}
