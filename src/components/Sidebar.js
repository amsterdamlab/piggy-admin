/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - SIDEBAR COMPONENT
   ========================================================================== */

import { icons } from '../icons.js';
import { store } from '../state.js';
import { authService } from '../services/authService.js';

export class Sidebar {
  constructor() {
    this.element = null;
    this.unsubscribeRoute = null;
    this.unsubscribePending = null;
  }

  render() {
    const admin = store.getAdmin() || { full_name: 'Master Admin', email: 'admin@piggyapp.co' };
    const currentRoute = store.getState().activeRoute || '#dashboard';
    const pendingCount = store.getState().pendingCounts.total || 0;

    const navItems = [
      { id: '#dashboard', label: 'Dashboard', icon: icons.dashboard },
      { id: '#users', label: 'Usuarios & CRM', icon: icons.users },
      { id: '#piggies', label: 'Granja de Piggies', icon: icons.pig },
      { id: '#marketplace', label: 'Mercado de Cerdos', icon: icons.marketplace },
      { id: '#gourmet-allies', label: 'Gourmet & Aliados', icon: icons.gourmet },
      { id: '#missions', label: 'Misiones Flash', icon: icons.zap },
      {
        id: '#wallet',
        label: 'Tesorería & Pagos',
        icon: icons.wallet,
        badge: pendingCount > 0 ? pendingCount : null
      }
    ];

    const html = `
      <aside class="admin-sidebar" id="main-admin-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo-icon" style="background: transparent; box-shadow: none; padding: 0;">
            <img src="/piggy-favicon.svg" alt="Piggy Logo" style="width: 38px; height: 38px; object-fit: contain;" />
          </div>
          <div>
            <div class="sidebar-brand-title">Piggy Admin <span class="sidebar-brand-badge">Master</span></div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Panel de Control</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-category">Principal</div>
          ${navItems.slice(0, 3).map(item => this.renderNavItem(item, currentRoute)).join('')}

          <div class="nav-category" style="margin-top: 0.5rem;">Gestión & Ventas</div>
          ${navItems.slice(3, 6).map(item => this.renderNavItem(item, currentRoute)).join('')}

          <div class="nav-category" style="margin-top: 0.5rem;">Finanzas</div>
          ${navItems.slice(6).map(item => this.renderNavItem(item, currentRoute)).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="admin-user-info">
            <div class="admin-avatar" style="background: var(--bg-card); border: 1px solid var(--border-color); color: var(--primary-pink);">
              ${icons.users}
            </div>
            <div class="admin-user-details">
              <div class="admin-user-name">${admin.full_name || 'Admin Piggy'}</div>
              <div class="admin-user-role">${admin.role || 'Super Administrador'}</div>
            </div>
            <button class="btn btn-icon btn-secondary" id="sidebar-logout-btn" title="Cerrar Sesión" style="padding: 0.4rem;">
              ${icons.logOut}
            </button>
          </div>
        </div>
      </aside>
    `;

    return html;
  }

  renderNavItem(item, currentRoute) {
    const isActive = currentRoute === item.id;
    return `
      <a href="${item.id}" class="nav-item ${isActive ? 'active' : ''}" data-route="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${item.badge ? `<span class="nav-badge badge-danger" id="nav-badge-wallet">${item.badge}</span>` : ''}
      </a>
    `;
  }

  attachEvents(parentElement) {
    this.element = parentElement.querySelector('#main-admin-sidebar');
    if (!this.element) return;

    // Logout button
    const logoutBtn = this.element.querySelector('#sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm('¿Deseas cerrar la sesión de administrador?')) {
          await authService.logout();
          window.location.hash = '#login';
        }
      });
    }

    // Subscribe to state updates
    if (!this.unsubscribeRoute) {
      this.unsubscribeRoute = store.subscribe('route_changed', (newRoute) => {
        this.updateActiveRoute(newRoute);
      });
    }

    if (!this.unsubscribePending) {
      this.unsubscribePending = store.subscribe('pending_counts_changed', (counts) => {
        this.updatePendingBadge(counts.total);
      });
    }
  }

  updateActiveRoute(route) {
    if (!this.element) return;
    this.element.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-route') === route) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  updatePendingBadge(total) {
    if (!this.element) return;
    const walletLink = this.element.querySelector('[data-route="#wallet"]');
    if (!walletLink) return;

    let badge = walletLink.querySelector('.nav-badge');
    if (total > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge badge-danger';
        badge.id = 'nav-badge-wallet';
        walletLink.appendChild(badge);
      }
      badge.textContent = total;
    } else if (badge) {
      badge.remove();
    }
  }
}
