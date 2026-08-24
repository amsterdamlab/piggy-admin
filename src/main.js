import { initSupabase } from './services/supabase.js';
import { authService } from './services/authService.js';
import { Router } from './router.js';

async function bootstrap() {
  console.log('👑 Inicializando Piggy Master Admin Dashboard...');

  await initSupabase();
  await authService.checkSession();

  const appContainer = document.getElementById('app');
  if (appContainer) {
    const router = new Router(appContainer);
    router.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
