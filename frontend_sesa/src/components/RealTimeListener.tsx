"use client";
import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RealTimeListenerProps {
    events: string[];
}

export function RealTimeListener({ events }: RealTimeListenerProps) {
    const { socket } = useSocket();
    const router = useRouter();

    useEffect(() => {
        if (!socket) return;

        const handlers = events.map(event => {
            const handler = (data: any) => {
                if (data.mensagem) {
                    toast.info(`Atualização ao Vivo: ${data.mensagem}`);
                }
                router.refresh(); // Trigger Next.js App Router to refetch server components
            };
            socket.on(event, handler);
            return { event, handler };
        });

        return () => {
            handlers.forEach(({ event, handler }) => {
                socket.off(event, handler);
            });
        };
    }, [socket, events, router]);

    return null;
}
