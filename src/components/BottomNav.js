/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MOBILE BOTTOM NAVIGATION COMPONENT
   Fixed thumb-friendly navigation for small screens with real-time badges
   ========================================================================== */

import { icons } from '../icons.js';
import { store } from '../state.js';

export class BottomNav {
  constructor() {
    this.element = null;
    this.unsubscribeRoute = null;
    this.unsubscribePending = null;
  }

  render() {
    const currentRoute = store.getState().activeRoute || '#dashboard';
    const pendingCount = store.getState().pendingCounts?.total || 0;

    const navItems = [
      { id: '#dashboard', label: 'Dashboard', icon: icons.dashboard },
      { id: '#piggies', label: 'Granja', icon: icons.pig },
      { id: '#marketplace', label: 'Mercado', icon: icons.marketplace },
      { 
        id: '#wallet', 
        label: 'Billetera', 
        icon: icons.wallet, 
        badge: pendingCount > 0 ? pendingCount : null 
      }
    ];

    return `
      <nav class="mobile-bottom-nav" id="main-mobile-bottom-nav">
        ${navItems.map(item => this.renderNavItem(item, currentRoute)).join('')}
        <button type="button" class="bottom-nav-item" id="bottom-nav-more-btn" aria-label="Abrir Menú Completo">
          <span class="bottom-nav-icon">${icons.menu}</span>
          <span class="bottom-nav-label">Más</span>
        </button>
      </nav>
    `;
  }

  renderNavItem(item, currentRoute) {
    const isActive = currentRoute === item.id;
    return `
      <a href="${item.id}" class="bottom-nav-item ${isActive ? 'active' : ''}" data-bottom-route="${item.id}">
        <span class="bottom-nav-icon">
          ${item.icon}
          ${item.badge ? `<span class="bottom-nav-badge">${item.badge}</span>` : ''}
        </span>
        <span class="bottom-nav-label">${item.label}</span>
      </a>
    `;
  }

  attachEvents(parentElement) {
    this.element = parentElement.querySelector('#main-mobile-bottom-nav') || parentElement;
    if (!this.element) return;

    // More button toggles sidebar drawer
    const moreBtn = this.element.querySelector('#bottom-nav-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
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

    // Subscribe to route changes
    if (!this.unsubscribeRoute) {
      this.unsubscribeRoute = store.subscribe('route_changed', (newRoute) => {
        this.updateActiveRoute(newRoute);
      });
    }

    // Subscribe to pending counts changes
    if (!this.unsubscribePending) {
      this.unsubscribePending = store.subscribe('pending_counts_changed', (counts) => {
        this.updatePendingBadge(counts?.total || 0);
      });
    }
  }

  updateActiveRoute(route) {
    if (!this.element) return;
    this.element.querySelectorAll('[data-bottom-route]').forEach(el => {
      if (el.getAttribute('data-bottom-route') === route) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  updatePendingBadge(total) {
    if (!this.element) return;
    const walletLink = this.element.querySelector('[data-bottom-route="#wallet"]');
    if (!walletLink) return;

    const iconWrapper = walletLink.querySelector('.bottom-nav-icon');
    if (!iconWrapper) return;

    let badge = iconWrapper.querySelector('.bottom-nav-badge');
    if (total > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'bottom-nav-badge';
        iconWrapper.appendChild(badge);
      }
      badge.textContent = total;
    } else if (badge) {
      badge.remove();
    }
  }
}
