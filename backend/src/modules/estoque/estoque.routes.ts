import { Router, RequestHandler } from 'express';
import { EstoqueController } from './estoque.controller';
import { ensureIsCAF } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new EstoqueController();

router.get('/:id_unidade', controller.consultarEstoque as RequestHandler);
router.get('/vencidos/:id_unidade', controller.consultarVencidos as RequestHandler);
router.get('/descarte/historico/:id_unidade', controller.consultarHistoricoDescartes as RequestHandler);
router.post('/descarte/:id_estoque', ensureIsCAF as RequestHandler, controller.encerraLoteVencido as unknown as RequestHandler);
router.post('/remessa', controller.efetuarRemessa as unknown as RequestHandler);
router.post('/entrada', ensureIsCAF as RequestHandler, controller.registrarEntradaLote as unknown as RequestHandler);

export { router as estoqueRoutes };
