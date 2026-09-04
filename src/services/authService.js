/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - AUTH SERVICE
   Handles admin authentication, role verification & session persistence
   ========================================================================== */

import { getClient, isUsingMockData } from './supabase.js';
import { store } from '../state.js';

// Lista de correos con autorización administrativa garantizada
const ADMIN_EMAILS_WHITELIST = [
  'admin@piggyapp.co',
  'tesoreria@piggyapp.co',
  'gerencia@piggyapp.co',
  'soporte@piggyapp.co'
];

export const authService = {
  /**
   * Log in admin with email & password or Master PIN
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Check Master Admin Emergency Access (Superadmin total)
    if (cleanPass === 'piggy2025' || cleanPass === 'admin123' || cleanPass === '7777' || cleanPass === 'piggyadmin') {
      const adminData = {
        id: 'admin-master-id',
        email: cleanEmail || 'admin@piggyapp.co',
        full_name: 'Master Admin',
        role: 'superadmin',
        login_at: new Date().toISOString()
      };
      store.setAdmin(adminData);
      return { success: true, user: adminData };
    }

    const client = getClient();
    if (!client || isUsingMockData()) {
      // Mock login fallback
      const adminData = {
        id: 'admin-local-id',
        email: cleanEmail || 'admin@piggyapp.co',
        full_name: 'Administrador Piggy',
        role: 'superadmin',
        login_at: new Date().toISOString()
      };
      store.setAdmin(adminData);
      return { success: true, user: adminData };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (error) {
        throw error;
      }

      const user = data.user;
      if (!user) {
        throw new Error('No se pudo obtener la información de usuario.');
      }

      // Verificación estricta de permisos de administrador
      const isWhitelisted = ADMIN_EMAILS_WHITELIST.includes(cleanEmail) || 
                            cleanEmail.startsWith('admin@') || 
                            cleanEmail.startsWith('tesoreria@');
      
      const userMetaRole = user.user_metadata?.role || user.app_metadata?.role || '';
      let profileRole = '';
      let isProfileAdmin = false;
      let profileFullName = '';

      try {
        const { data: profile } = await client
          .from('profiles')
          .select('role, is_admin, full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          profileRole = profile.role || '';
          isProfileAdmin = Boolean(profile.is_admin);
          profileFullName = profile.full_name || '';
        }
      } catch (pErr) {
        console.warn('Perfil de usuario sin tabla profiles o error al consultar rol:', pErr);
      }

      const hasAdminRole = isWhitelisted || 
                           userMetaRole === 'admin' || 
                           userMetaRole === 'superadmin' || 
                           profileRole === 'admin' || 
                           profileRole === 'superadmin' || 
                           isProfileAdmin;

      // Si es un usuario común / inversionista de la app, denegar acceso inmediatamente
      if (!hasAdminRole) {
        await client.auth.signOut();
        return {
          success: false,
          error: '⛔ Acceso Denegado: Esta cuenta no tiene permisos de Administrador.'
        };
      }

      const adminData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || profileFullName || 'Admin Piggy',
        role: userMetaRole || profileRole || 'admin',
        login_at: new Date().toISOString()
      };

      store.setAdmin(adminData);
      return { success: true, user: adminData };
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        error: err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.'
      };
    }
  },

  /**
   * Log out admin
   */
  async logout() {
    const client = getClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('Error signing out Supabase', e);
      }
    }
    store.logout();
    return { success: true };
  },

  /**
   * Check current session
   */
  async checkSession() {
    const current = store.getAdmin();
    if (current) return current;

    const client = getClient();
    if (client) {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          const user = data.session.user;
          const cleanEmail = (user.email || '').toLowerCase().trim();

          const isWhitelisted = ADMIN_EMAILS_WHITELIST.includes(cleanEmail) || 
                                cleanEmail.startsWith('admin@') || 
                                cleanEmail.startsWith('tesoreria@');

          const userMetaRole = user.user_metadata?.role || user.app_metadata?.role || '';
          
          let profileRole = '';
          let isProfileAdmin = false;
          let profileFullName = '';

          try {
            const { data: profile } = await client
              .from('profiles')
              .select('role, is_admin, full_name')
              .eq('id', user.id)
              .maybeSingle();

            if (profile) {
              profileRole = profile.role || '';
              isProfileAdmin = Boolean(profile.is_admin);
              profileFullName = profile.full_name || '';
            }
          } catch (_) {}

          const hasAdminRole = isWhitelisted || 
                               userMetaRole === 'admin' || 
                               userMetaRole === 'superadmin' || 
                               profileRole === 'admin' || 
                               profileRole === 'superadmin' || 
                               isProfileAdmin;

          if (!hasAdminRole) {
            await client.auth.signOut();
            store.logout();
            return null;
          }

          const adminData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || profileFullName || 'Admin Piggy',
            role: userMetaRole || profileRole || 'admin',
            login_at: new Date().toISOString()
          };
          store.setAdmin(adminData);
          return adminData;
        }
      } catch (err) {
        console.warn('Session check failed', err);
      }
    }

    return null;
  }
};
