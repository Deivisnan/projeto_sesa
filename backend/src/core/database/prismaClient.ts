import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = (globalThis as any).prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') (globalThis as any).prismaGlobal = prisma;
