import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn("Aviso: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidos no .env do Backend.");
}

// Cria uma única instância cliente do Supabase para o backend
export const supabase = createClient(supabaseUrl, supabaseKey);

// O canal central de broadcast que usaremos para replicar o comportamento global do Socket.IO
export const sysfarmaChannel = supabase.channel('sysfarma');

// O Backend precisa se inscrever (subscribe) no canal para poder enviar mensagens Broadcast
sysfarmaChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
        console.log('Backend conectado ao Supabase Realtime (sysfarma).');
    }
});
