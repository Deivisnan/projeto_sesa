import { Router, RequestHandler } from 'express';
import { MedicamentosController } from './medicamentos.controller';
import { ensureIsCAF } from '../../core/middlewares/auth.middleware';

const medicamentosRoutes = Router();
const controller = new MedicamentosController();

// Listagem em Árvore Completa
medicamentosRoutes.get('/', controller.listTree as RequestHandler);

// Buscar Histórico Global de Auditoria
medicamentosRoutes.get('/auditoria', controller.getAllAuditoria as unknown as RequestHandler);

// Buscar Auditoria
medicamentosRoutes.get('/auditoria/:entidade/:id_entidade', controller.getAuditoria as unknown as RequestHandler);

// Buscar todos os Grupos (Sem junção com Estoque Ativo) - Usado em formulários
medicamentosRoutes.get('/grupos', controller.getAllGrupos as unknown as RequestHandler);

// Criação de Grupos (CAF apenas)
medicamentosRoutes.post('/grupos', ensureIsCAF as RequestHandler, controller.createGrupo as unknown as RequestHandler);

// Criação de Apresentações filhas atreladas a um Grupo
medicamentosRoutes.post('/grupos/:id_grupo/apresentacoes', ensureIsCAF as RequestHandler, controller.createApresentacao as unknown as RequestHandler);

// Atualização de Grupos
medicamentosRoutes.put('/grupos/:id', ensureIsCAF as RequestHandler, controller.updateGrupo as unknown as RequestHandler);

// Exclusão de Grupos
medicamentosRoutes.delete('/grupos/:id', ensureIsCAF as RequestHandler, controller.deleteGrupo as unknown as RequestHandler);

// Atualização de Apresentações
medicamentosRoutes.put('/:id', ensureIsCAF as RequestHandler, controller.updateApresentacao as unknown as RequestHandler);

// Exclusão de Apresentações
medicamentosRoutes.delete('/:id', ensureIsCAF as RequestHandler, controller.deleteApresentacao as unknown as RequestHandler);

export { medicamentosRoutes };
