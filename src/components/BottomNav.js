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
      { 
        id: '#wallet', 
        label: 'Billetera', 
        icon: icons.wallet, 
        badge: pendingCount > 0 ? pendingCount : null 
      },
      { id: '#marketplace', label: 'Mercado', icon: icons.marketplace },
      { id: '#flash-missions', label: 'Ofertas', icon: icons.zap },
      { id: '#piggies', label: 'Granja', icon: icons.pig }
    ];

    return `
      <nav class="mobile-bottom-nav" id="main-mobile-bottom-nav">
        ${navItems.map(item => this.renderNavItem(item, currentRoute)).join('')}
      </nav>
    `;
  }

  renderNavItem(item, currentRoute) {
    const isOfertas = (
      currentRoute === '#flash-missions' || 
      currentRoute === '#missions-flash' || 
      currentRoute === '#missions' || 
      currentRoute === '#marketing' || 
      currentRoute === '#marketing-bonuses' || 
      currentRoute === '#bonos-consumo'
    ) && item.id === '#flash-missions';
    const isActive = currentRoute === item.id || isOfertas;

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
    const isOfertas = (
      route === '#flash-missions' || 
      route === '#missions-flash' || 
      route === '#missions' || 
      route === '#marketing' || 
      route === '#marketing-bonuses' || 
      route === '#bonos-consumo'
    );

    this.element.querySelectorAll('[data-bottom-route]').forEach(el => {
      const bottomRoute = el.getAttribute('data-bottom-route');
      const isActive = (bottomRoute === route) || (bottomRoute === '#flash-missions' && isOfertas);
      if (isActive) {
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
