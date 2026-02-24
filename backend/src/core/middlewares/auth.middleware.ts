import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../exceptions/AppError';
import { TokenPayload } from '../../@types/express';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError('Token JWT não fornecido', 401);
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
        req.user = decoded as TokenPayload;
        return next();
    } catch (err) {
        throw new AppError('Token JWT inválido ou expirado', 401);
    }
}

export function ensureIsCAF(req: Request, res: Response, next: NextFunction) {
    if (!req.user || req.user.tipo_unidade !== 'CAF') {
        throw new AppError('Acesso negado. Ação restrita a usuários da CAF central.', 403);
    }
    return next();
}

export function ensureIsTI(req: Request, res: Response, next: NextFunction) {
    if (!req.user || req.user.tipo_unidade !== 'TI') {
        throw new AppError('Acesso negado. Ação restrita ao departamento de Tecnologia (TI).', 403);
    }
    return next();
}
