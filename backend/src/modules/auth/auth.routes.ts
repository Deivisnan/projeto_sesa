import { Router } from 'express';
import { authController } from './auth.controller';
import { ensureAuthenticated } from '../../core/middlewares/auth.middleware';

const authRoutes = Router();

authRoutes.post('/login', authController.login);
authRoutes.post('/setup-dev', authController.setup);
authRoutes.post('/verify-password', ensureAuthenticated, authController.verifyPassword);

export { authRoutes };
