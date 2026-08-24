import { store } from './state.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';

import { LoginView } from './views/LoginView.js';
import { DashboardView } from './views/DashboardView.js';
import { UsersView } from './views/UsersView.js';
import { PiggiesView } from './views/PiggiesView.js';
import { MarketplaceView } from './views/MarketplaceView.js';
import { GourmetAlliesView } from './views/GourmetAlliesView.js';
import { FlashMissionsView } from './views/FlashMissionsView.js';
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
        title: 'Granja de Piggies',
        subtitle: 'Control de pesaje, estados de engorde y asignaciones'
      },
      '#marketplace': {
        view: MarketplaceView,
        title: 'Mercado de Cerditos',
        subtitle: 'Catálogo de cerdos, aceleradores y stock disponible'
      },
      '#gourmet-allies': {
        view: GourmetAlliesView,
        title: 'Piggy Gourmet & Aliados',
        subtitle: 'Catálogo de cortes, combos para canje y directorio de aliados'
      },
      '#missions': {
        view: FlashMissionsView,
        title: 'Misiones Flash & Gamificación',
        subtitle: 'Campañas de aceleración y retos comunitarios'
      },
      '#wallet': {
        view: WalletView,
        title: 'Tesorería & Billeteras',
        subtitle: 'Aprobación de comprobantes de recarga y liquidación de retiros'
      }
    };

    window.addEventListener('hashchange', () => this.navigate());
  }

  init() {
    this.navigate();
  }

  async navigate() {
    let hash = window.location.hash || '#dashboard';

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

    if (this.currentViewInstance && typeof this.currentViewInstance.destroy === 'function') {
      this.currentViewInstance.destroy();
    }

    this.currentViewInstance = new routeConfig.view();

    if (hash === '#login') {
      this.appContainer.innerHTML = `<div id="view-content">${this.currentViewInstance.render()}</div>`;
      this.currentViewInstance.attachEvents(this.appContainer.querySelector('#view-content'));
      return;
    }

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
