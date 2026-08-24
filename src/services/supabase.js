/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - SUPABASE CLIENT WRAPPER
   Direct production connection with resilient fallback
   ========================================================================== */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://elhsvitbqzivgajccify.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GsffdyFVoy0M5t_4WfzZvA_KdpDr1HD';

let supabaseClient = null;
let isMockMode = false;

/**
 * Initialize the Supabase client.
 */
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
      console.log('🐷 Supabase Admin: Conectado a la base de datos de producción.');
      return true;
    } catch (error) {
      console.warn('🐷 Supabase Admin: Error al inicializar cliente, usando modo fallback.', error);
    }
  }

  isMockMode = false;
  return false;
}

/**
 * Get the initialized Supabase client
 */
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

/**
 * Check if backend is in Mock mode
 */
export function isUsingMockData() {
  return isMockMode;
}
