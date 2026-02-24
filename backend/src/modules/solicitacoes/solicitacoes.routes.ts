import { Router, RequestHandler } from 'express';
import { SolicitacoesController } from './solicitacoes.controller';
import { ensureIsCAF } from '../../core/middlewares/auth.middleware';

const solicitacoesRoutes = Router();
const controller = new SolicitacoesController();

solicitacoesRoutes.get('/relatorio', ensureIsCAF as RequestHandler, controller.relatorio as unknown as RequestHandler);
solicitacoesRoutes.get('/remessas-recentes', ensureIsCAF as RequestHandler, controller.listarRemessasRecentes as unknown as RequestHandler);
solicitacoesRoutes.post('/', controller.create as unknown as RequestHandler);
solicitacoesRoutes.get('/', controller.list as unknown as RequestHandler);
solicitacoesRoutes.post('/:id/aprovar', ensureIsCAF as RequestHandler, controller.aprovar as unknown as RequestHandler);
solicitacoesRoutes.post('/:id/recusar', ensureIsCAF as RequestHandler, controller.recusar as unknown as RequestHandler);
solicitacoesRoutes.post('/:id/despachar', ensureIsCAF as RequestHandler, controller.despachar as unknown as RequestHandler);
solicitacoesRoutes.post('/:id/receber', controller.receber as unknown as RequestHandler);

export { solicitacoesRoutes };
