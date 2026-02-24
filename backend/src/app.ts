import { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './core/exceptions/errorHandler';
import routes from './routes';

dotenv.config();

const app = express();

app.use(cors({
    origin: ["https://projeto-sesa-front.vercel.app", "http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
    res.json({
        name: 'SysFarma API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            health: '/health',
            api: '/api'
        }
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'SysFarma API is running' });
});

// Middleware for handling all errors (must be the last middleware)
app.use(errorHandler);

export default app;
