export interface TokenPayload {
    id: string; // User ID
    id_unidade: string;
    tipo_unidade: 'TI' | 'CAF' | 'UBS' | 'UPA' | 'HOSPITAL';
    papel: string; // e.g., 'ADMIN', 'GESTOR_CAF', 'ATENDENTE'
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
