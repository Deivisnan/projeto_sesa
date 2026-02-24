import { Router, RequestHandler } from 'express';
import { UsuariosController } from './usuarios.controller';
import { ensureIsTI } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new UsuariosController();

/** Gestão de Contas é Restrita à área de TI **/
router.use(ensureIsTI as RequestHandler);

router.get('/', controller.listAll as RequestHandler);
router.get('/:id', controller.getById as RequestHandler);
router.post('/', controller.create as unknown as RequestHandler);
router.patch('/:id', controller.update as unknown as RequestHandler);
router.patch('/:id/reset-senha', controller.resetPassword as unknown as RequestHandler);
router.patch('/:id/status', controller.toggleStatus as unknown as RequestHandler);

export default router;
