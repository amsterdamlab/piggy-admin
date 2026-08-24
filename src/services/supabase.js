import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient = null;
let isMockMode = true;

export async function initSupabase() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http')) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      isMockMode = false;
      console.log('🐷 Supabase Admin: Conectado a base de datos de producción.');
      return true;
    } catch (error) {
      console.warn('🐷 Supabase Admin: Error al inicializar cliente, usando modo mock.', error);
    }
  }

  console.log('🐷 Supabase Admin: Ejecutando en modo resiliente.');
  isMockMode = true;
  return false;
}

export function getClient() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isMockMode = false;
    } catch (e) {
      console.error('Error getting Supabase client', e);
    }
  }
  return supabaseClient;
}

export function isUsingMockData() {
  return isMockMode;
}
