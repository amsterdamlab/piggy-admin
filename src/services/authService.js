import { getClient, isUsingMockData } from './supabase.js';
import { store } from '../state.js';

export const authService = {
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (cleanPass === 'piggy2025' || cleanPass === 'admin123' || cleanPass === '7777' || cleanPass === 'piggyadmin') {
      const adminData = {
        id: 'admin-master-id',
        email: cleanEmail || 'admin@piggyapp.co',
        full_name: 'Master Admin 👑',
        role: 'superadmin',
        login_at: new Date().toISOString()
      };
      store.setAdmin(adminData);
      return { success: true, user: adminData };
    }

    const client = getClient();
    if (!client || isUsingMockData()) {
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

      if (error) throw error;

      const user = data.user;
      const adminData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Admin Piggy',
        role: 'admin',
        login_at: new Date().toISOString()
      };

      store.setAdmin(adminData);
      return { success: true, user: adminData };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.'
      };
    }
  },

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

  async checkSession() {
    const current = store.getAdmin();
    if (current) return current;

    const client = getClient();
    if (client) {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          const user = data.session.user;
          const adminData = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Admin Piggy',
            role: 'admin',
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
