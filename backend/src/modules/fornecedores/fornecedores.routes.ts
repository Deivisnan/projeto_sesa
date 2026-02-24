import { Router, RequestHandler } from 'express';
import { FornecedoresController } from './fornecedores.controller';
import { ensureIsCAF } from '../../core/middlewares/auth.middleware';

const fornecedoresRoutes = Router();
const controller = new FornecedoresController();

fornecedoresRoutes.get('/', controller.listAll as RequestHandler);
fornecedoresRoutes.get('/:id', controller.getById as RequestHandler);
fornecedoresRoutes.post('/', ensureIsCAF as RequestHandler, controller.create as unknown as RequestHandler);

export { fornecedoresRoutes };
