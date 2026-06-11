import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string) => {
  if (typeof window !== 'undefined') {
    // Modo cliente: lee desde la ventana (inyectado por layout.tsx)
    return (window as any).__ENV?.[key] || '';
  }
  // Modo servidor
  return process.env[key] || '';
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Usamos el cliente anónimo para operaciones seguras
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder_key'
);
