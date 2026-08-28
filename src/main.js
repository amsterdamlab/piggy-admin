/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - ENTRY POINT
   ========================================================================== */

import { initSupabase } from './services/supabase.js';
import { authService } from './services/authService.js';
import { Router } from './router.js';
import './styles/formEnhancements.css';

async function bootstrap() {
  console.log('👑 Inicializando Piggy Master Admin Dashboard...');

  // 1. Initialize Supabase Backend
  await initSupabase();

  // 2. Check existing admin session
  await authService.checkSession();

  // 3. Mount Application Router
  const appContainer = document.getElementById('app');
  if (appContainer) {
    const router = new Router(appContainer);
    router.init();
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
