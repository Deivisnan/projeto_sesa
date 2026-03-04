import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Aviso: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidos no .env do Backend.");
}

// Cria uma única instância cliente do Supabase para o backend
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// O canal central de broadcast que usaremos para replicar o comportamento global do Socket.IO
export const sysfarmaChannel = supabase.channel('sysfarma');
