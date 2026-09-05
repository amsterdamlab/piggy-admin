/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - HEADER COMPONENT
   ========================================================================== */

import { icons } from '../icons.js';
import { isUsingMockData } from '../services/supabase.js';

export class Header {
  constructor({ onRefresh = null }) {
    this.onRefresh = onRefresh;
    this.element = null;
  }

  render(title = 'Dashboard General', subtitle = 'Métricas y visión general del ecosistema Piggy') {
    const isMock = isUsingMockData();

    return `
      <header class="admin-header" id="main-admin-header">
        <div class="header-left">
          <button class="mobile-menu-btn" id="mobile-menu-toggle" aria-label="Abrir Menú">
            ${icons.menu}
          </button>
          <div>
            <h1 class="header-title" id="header-page-title">${title}</h1>
            <p class="header-subtitle" id="header-page-subtitle">${subtitle}</p>
          </div>
        </div>

        <div class="header-right">
          <div class="env-indicator">
            <span class="env-dot ${isMock ? 'mock' : ''}"></span>
            <span>${isMock ? 'Modo Resiliente' : 'Supabase Conectado'}</span>
          </div>

          <button class="btn btn-secondary btn-icon" id="header-refresh-btn" title="Refrescar Datos">
            ${icons.refresh}
          </button>
        </div>
      </header>
    `;
  }

  attachEvents(parentElement) {
    this.element = parentElement.querySelector('#main-admin-header');
    if (!this.element) return;

    const refreshBtn = this.element.querySelector('#header-refresh-btn');
    if (refreshBtn && this.onRefresh) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.style.transform = 'rotate(180deg)';
        refreshBtn.style.transition = 'transform 0.4s ease';
        setTimeout(() => {
          refreshBtn.style.transform = 'none';
        }, 400);
        this.onRefresh();
      });
    }

    const menuToggle = this.element.querySelector('#mobile-menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const sidebar = document.querySelector('#main-admin-sidebar');
        const backdrop = document.querySelector('#sidebar-backdrop');
        if (sidebar) {
          const isOpen = sidebar.classList.toggle('open');
          if (backdrop) {
            backdrop.classList.toggle('active', isOpen);
          }
        }
      });
    }
  }

  updateTitle(title, subtitle) {
    if (!this.element) return;
    const titleEl = this.element.querySelector('#header-page-title');
    const subEl = this.element.querySelector('#header-page-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
  }
}
