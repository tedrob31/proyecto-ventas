import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Usamos el cliente anónimo para operaciones seguras (RLS en el futuro)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
