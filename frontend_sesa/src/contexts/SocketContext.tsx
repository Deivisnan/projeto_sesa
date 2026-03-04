"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

// We keep the MockSocket interface matching what components expect to prevent huge refactors
export interface MockSocket {
    on: (event: string, callback: (payload: any) => void) => void;
    off: (event: string, callback: (payload: any) => void) => void;
}

interface SocketContextData {
    socket: MockSocket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<MockSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Only run Supabase logic in the browser, not during Next.js server build
        if (typeof window === 'undefined') return;

        if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
            console.error('Supabase URL ou Key não encontrados no frontend!');
            return;
        }

        const channel = supabase.channel('sysfarma');

        // Dictionary to hold all socket.on callbacks
        // We put it inside a ref or keep it scoped safely
        const handlers: Record<string, Function[]> = {};

        // Listen to all broadcast events on the sysfarma channel from Backend
        channel.on('broadcast', { event: '*' }, (payload) => {
            console.log('Supabase Realtime Recebido:', payload.event, payload.payload);
            const callbacks = handlers[payload.event] || [];
            callbacks.forEach(cb => cb(payload.payload));
        });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Supabase Realtime Conectado: sysfarma channel');
                setIsConnected(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                console.log('Supabase Realtime Desconectado', status);
                setIsConnected(false);
            }
        });

        // The adapter allowing React components to use `socket.on` perfectly linked to Supabase
        const mockSocket: MockSocket = {
            on: (event: string, callback: (payload: any) => void) => {
                if (!handlers[event]) handlers[event] = [];
                handlers[event].push(callback);
            },
            off: (event: string, callback: (payload: any) => void) => {
                if (!handlers[event]) return;
                handlers[event] = handlers[event].filter(cb => cb !== callback);
            }
        };

        setSocket(mockSocket);

        return () => {
            // Clean up: unsubscribe from the channel so Next.js build workers don't hang!
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
