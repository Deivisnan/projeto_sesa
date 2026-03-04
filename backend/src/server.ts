import app from './app';
import { createServer } from 'http';
import { initSocket } from './core/socket';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

// Inicializa o WebSocket
initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
