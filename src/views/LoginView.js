/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - LOGIN VIEW
   ========================================================================== */

import { authService } from '../services/authService.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';

export class LoginView {
  constructor() {
    this.element = null;
  }

  render() {
    return `
      <div class="login-wrapper">
        <div class="login-card">
          <div style="margin-bottom: 1.25rem;">
            <img src="/piggy-favicon.svg" alt="Piggy Logo" style="width: 68px; height: 68px; margin: 0 auto; display: block; border-radius: 50%;" />
          </div>
          <h2 class="login-title">Piggy Admin</h2>
          <p class="login-subtitle">Ingreso seguro a la consola de administración y tesorería</p>

          <form id="admin-login-form">
            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="login-email">Correo Electrónico / Administrador</label>
              <input 
                type="email" 
                id="login-email" 
                class="form-input" 
                placeholder="admin@piggyapp.co" 
                value="admin@piggyapp.co"
                required 
                autocomplete="email"
              />
            </div>

            <div class="form-group" style="text-align: left;">
              <label class="form-label" for="login-password">Contraseña o Master PIN</label>
              <input 
                type="password" 
                id="login-password" 
                class="form-input" 
                placeholder="••••••••" 
                required 
                autocomplete="current-password"
              />
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                Puedes usar tu contraseña de Supabase o el PIN Maestro de Administrador.
              </div>
            </div>

            <button type="submit" class="btn btn-primary" id="login-submit-btn" style="width: 100%; margin-top: 1rem;">
              <span>Ingresar al Panel</span>
              ${icons.arrowUpRight}
            </button>
          </form>

          <div style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-muted);">
            Piggy Agro-Fintech Platform &bull; v2.0
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    this.element = container;
    const form = this.element.querySelector('#admin-login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = this.element.querySelector('#login-email').value;
      const password = this.element.querySelector('#login-password').value;
      const submitBtn = this.element.querySelector('#login-submit-btn');

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Verificando...</span>`;

      try {
        const result = await authService.login(email, password);
        if (result.success) {
          toast.success(`¡Bienvenido, ${result.user.full_name}!`);
          window.location.hash = '#dashboard';
        } else {
          toast.error(result.error || 'Credenciales no autorizadas');
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Ingresar al Panel</span> ${icons.arrowUpRight}`;
        }
      } catch (err) {
        toast.error('Ocurrió un error inesperado');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Ingresar al Panel</span> ${icons.arrowUpRight}`;
      }
    });
  }
}
