import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }

    // Log unknown errors for debugging
    console.error('Unhandled Error:', err);

    const errorMessage = err.message || '';
    if (errorMessage.includes('prepared statement') || errorMessage.includes('42P05')) {
        return res.status(500).json({
            status: 'error',
            message: 'Erro de conexão com o banco (Prepared Statement). Certifique-se de que o DATABASE_URL no Vercel termina com ?pgbouncer=true',
        });
    }

    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};
