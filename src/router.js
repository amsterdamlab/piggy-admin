/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - CLIENT SPA ROUTER
   Handles hash routes, layout assembly, and authentication guards
   ========================================================================== */

import { store } from './state.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';

import { LoginView } from './views/LoginView.js';
import { DashboardView } from './views/DashboardView.js';
import { UsersView } from './views/UsersView.js';
import { PiggiesView } from './views/PiggiesView.js';
import { MarketplaceView } from './views/MarketplaceView.js';
import { GourmetAlliesView } from './views/GourmetAlliesView.js';
import { MarketingView } from './views/MarketingView.js';
import { WalletView } from './views/WalletView.js';

export class Router {
  constructor(appContainer) {
    this.appContainer = appContainer;
    this.sidebar = new Sidebar();
    this.header = new Header({
      onRefresh: () => this.handleRefresh()
    });

    this.currentViewInstance = null;
    this.routes = {
      '#login': {
        view: LoginView,
        title: 'Iniciar Sesión',
        subtitle: 'Acceso a consola de administración'
      },
      '#dashboard': {
        view: DashboardView,
        title: 'Dashboard General',
        subtitle: 'Métricas y visión general del ecosistema Piggy'
      },
      '#users': {
        view: UsersView,
        title: 'Usuarios & CRM',
        subtitle: 'Gestión de perfiles de inversionistas, estados y billeteras'
      },
      '#piggies': {
        view: PiggiesView,
        title: 'Granja de Piggys',
        subtitle: 'Control de pesaje, estados de engorde y asignaciones'
      },
      '#marketplace': {
        view: MarketplaceView,
        title: 'Mercado de Piggys',
        subtitle: 'Catálogo de cerdos, aceleradores y stock disponible'
      },
      '#gourmet-allies': {
        view: GourmetAlliesView,
        title: 'Tienda & Aliados',
        subtitle: 'Catálogo de cortes, combos para canje y directorio de aliados'
      },
      '#marketing': {
        view: MarketingView,
        title: 'Centro de Marketing',
        subtitle: 'Gestión integral de noticias, misiones, promociones, cerditos exclusivos y tips de la app'
      },
      '#missions': {
        view: MarketingView,
        title: 'Centro de Marketing',
        subtitle: 'Gestión integral de noticias, misiones, promociones, cerditos exclusivos y tips de la app'
      },
      '#flash-missions': {
        view: MarketingView,
        title: 'Centro de Marketing',
        subtitle: 'Gestión integral de noticias, misiones, promociones, cerditos exclusivos y tips de la app'
      },
      '#missions-flash': {
        view: MarketingView,
        title: 'Centro de Marketing',
        subtitle: 'Gestión integral de noticias, misiones, promociones, cerditos exclusivos y tips de la app'
      },
      '#wallet': {
        view: WalletView,
        title: 'Pagos & Recargas',
        subtitle: 'Aprobación de recargas de saldo, liquidación de retiros y bonos de consumo'
      }
    };

    window.addEventListener('hashchange', () => this.navigate());
  }

  init() {
    this.navigate();
  }

  async navigate() {
    let hash = window.location.hash || '#dashboard';

    // Auth Guard Check
    const isAuthenticated = store.isAuthenticated();
    if (!isAuthenticated) {
      if (hash !== '#login') {
        window.location.hash = '#login';
        return;
      }
    } else if (hash === '#login') {
      window.location.hash = '#dashboard';
      return;
    }

    if (!this.routes[hash]) {
      hash = '#dashboard';
      window.location.hash = '#dashboard';
      return;
    }

    store.setActiveRoute(hash);
    const routeConfig = this.routes[hash];

    // Clean up previous view if needed
    if (this.currentViewInstance && typeof this.currentViewInstance.destroy === 'function') {
      this.currentViewInstance.destroy();
    }

    this.currentViewInstance = new routeConfig.view();

    if (hash === '#login') {
      // Full screen login
      this.appContainer.innerHTML = `<div id="view-content">${this.currentViewInstance.render()}</div>`;
      this.currentViewInstance.attachEvents(this.appContainer.querySelector('#view-content'));
      return;
    }

    // Authenticated Admin Layout
    const isFirstLayoutRender = !this.appContainer.querySelector('.admin-layout');

    if (isFirstLayoutRender) {
      this.appContainer.innerHTML = `
        <div class="admin-layout">
          <div id="sidebar-container">${this.sidebar.render()}</div>
          <div class="admin-main-wrapper">
            <div id="header-container">${this.header.render(routeConfig.title, routeConfig.subtitle)}</div>
            <main class="admin-content" id="view-content">
              <div style="display: flex; justify-content: center; padding: 4rem;">
                <div style="font-size: 2rem;">🐷 Cargando...</div>
              </div>
            </main>
          </div>
        </div>
      `;

      this.sidebar.attachEvents(this.appContainer.querySelector('#sidebar-container'));
      this.header.attachEvents(this.appContainer.querySelector('#header-container'));
    } else {
      this.header.updateTitle(routeConfig.title, routeConfig.subtitle);
      this.sidebar.updateActiveRoute(hash);
    }

    // Render View Content
    const viewContainer = this.appContainer.querySelector('#view-content');
    if (viewContainer) {
      viewContainer.innerHTML = `
        <div style="display: flex; justify-content: center; padding: 4rem;">
          <div style="font-size: 1.5rem; color: var(--text-muted);">Cargando módulo...</div>
        </div>
      `;

      const contentHtml = await this.currentViewInstance.render();
      viewContainer.innerHTML = contentHtml;
      if (typeof this.currentViewInstance.attachEvents === 'function') {
        this.currentViewInstance.attachEvents(viewContainer);
      }
    }
  }

  async handleRefresh() {
    await this.navigate();
  }
}
