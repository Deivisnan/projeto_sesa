import { Router, RequestHandler } from 'express';
import { UnidadesController } from './unidades.controller';
import { ensureIsCAF, ensureIsTI } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new UnidadesController();

// We cast to RequestHandler to satisfy Express type definitions
router.get('/', controller.listAll as RequestHandler);
router.get('/:id', controller.getById as RequestHandler);
router.post('/', ensureIsTI as RequestHandler, controller.create as unknown as RequestHandler); // Using unknown trick because of express async handler typings

// TI Management routes
router.delete('/:id', ensureIsTI as RequestHandler, controller.delete as unknown as RequestHandler);

// Permissões de Medicamentos (CAF Dashboard & Fetch API)
router.get('/:id/medicamentos-permitidos', controller.getMedicamentosPermitidos as unknown as RequestHandler);
router.post('/:id/medicamentos-permitidos', ensureIsCAF as RequestHandler, controller.setMedicamentosPermitidos as unknown as RequestHandler);

export default router;
