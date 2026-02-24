import { Router } from 'express';
import unidadesRoutes from './modules/unidades/unidades.routes';
import { estoqueRoutes } from './modules/estoque/estoque.routes';
import { medicamentosRoutes } from './modules/medicamentos/medicamentos.routes';
import { fornecedoresRoutes } from './modules/fornecedores/fornecedores.routes';
import { authRoutes } from './modules/auth/auth.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import { solicitacoesRoutes } from './modules/solicitacoes/solicitacoes.routes';
import { ensureAuthenticated } from './core/middlewares/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/unidades', ensureAuthenticated, unidadesRoutes);
router.use('/estoque', ensureAuthenticated, estoqueRoutes);
router.use('/medicamentos', ensureAuthenticated, medicamentosRoutes);
router.use('/fornecedores', ensureAuthenticated, fornecedoresRoutes);
router.use('/usuarios', ensureAuthenticated, usuariosRoutes);
router.use('/solicitacoes', ensureAuthenticated, solicitacoesRoutes);

export default router;
