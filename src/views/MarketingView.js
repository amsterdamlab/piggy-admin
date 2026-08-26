/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETING OPERATIONS CENTER VIEW
   Unified control center orchestrating the 6 marketing sub-tabs:
   1. news_billboard
   2. user_flash_missions
   3. missions
   4. exclusive_piggy_config
   5. cycle_completion_missions
   6. dynamic_tips
   ========================================================================== */

import { marketingService } from '../services/marketingService.js';
import { icons } from '../icons.js';

import { NewsTab } from './marketing/NewsTab.js';
import { FlashMissionsTab } from './marketing/FlashMissionsTab.js';
import { MissionsTab } from './marketing/MissionsTab.js';
import { ExclusiveConfigTab } from './marketing/ExclusiveConfigTab.js';
import { CycleMissionsTab } from './marketing/CycleMissionsTab.js';
import { DynamicTipsTab } from './marketing/DynamicTipsTab.js';

export class MarketingView {
  constructor() {
    this.currentTab = 'news_billboard';
    this.overview = null;
    this.container = null;

    this.dataStore = {
      news_billboard: [],
      user_flash_missions: [],
      missions: [],
      exclusive_piggy_config: [],
      cycle_completion_missions: [],
      dynamic_tips: []
    };

    // Sub-tab controllers
    this.tabs = {
      news_billboard: new NewsTab(this),
      user_flash_missions: new FlashMissionsTab(this),
      missions: new MissionsTab(this),
      exclusive_piggy_config: new ExclusiveConfigTab(this),
      cycle_completion_missions: new CycleMissionsTab(this),
      dynamic_tips: new DynamicTipsTab(this)
    };
  }

  async render() {
    const [overview, news, flashMissions, missions, exclusiveConfigs, cycleMissions, tips] = await Promise.all([
      marketingService.getMarketingOverview(),
      marketingService.getNews(),
      marketingService.getUserFlashMissions(),
      marketingService.getMissions(),
      marketingService.getExclusiveConfigs(),
      marketingService.getCycleMissions(),
      marketingService.getDynamicTips()
    ]);

    this.overview = overview;
    this.dataStore.news_billboard = news;
    this.dataStore.user_flash_missions = flashMissions;
    this.dataStore.missions = missions;
    this.dataStore.exclusive_piggy_config = exclusiveConfigs;
    this.dataStore.cycle_completion_missions = cycleMissions;
    this.dataStore.dynamic_tips = tips;

    return `
      <div class="marketing-view">
        <!-- Tarjetas de métricas de operaciones de marketing -->
        <div class="marketing-header-metrics">
          <div class="stat-card" style="border-left: 4px solid var(--primary-pink);">
            <div class="stat-header">
              <span class="stat-title">Noticias & Banners</span>
              <div class="stat-icon" style="color: var(--primary-pink);">${icons.megaphone}</div>
            </div>
            <div class="stat-value">${this.overview.activeNewsCount} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/ ${this.overview.newsCount} total</span></div>
            <div class="stat-subtitle">En rotación en el Home</div>
          </div>

          <div class="stat-card" style="border-left: 4px solid var(--accent-gold);">
            <div class="stat-header">
              <span class="stat-title">Misiones Flash</span>
              <div class="stat-icon" style="color: var(--accent-gold);">${icons.zap}</div>
            </div>
            <div class="stat-value">${this.overview.activeFlashCount} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/ ${this.overview.flashCount} total</span></div>
            <div class="stat-subtitle">Retos activos para usuarios</div>
          </div>

          <div class="stat-card" style="border-left: 4px solid var(--accent-purple);">
            <div class="stat-header">
              <span class="stat-title">Piggys Exclusivos</span>
              <div class="stat-icon" style="color: var(--accent-purple);">${icons.sparkles}</div>
            </div>
            <div class="stat-value">${this.overview.activeExclusiveCount} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/ ${this.overview.exclusiveCount} conf</span></div>
            <div class="stat-subtitle">Planes especiales en venta</div>
          </div>

          <div class="stat-card" style="border-left: 4px solid var(--accent-green);">
            <div class="stat-header">
              <span class="stat-title">Tips Dinámicos</span>
              <div class="stat-icon" style="color: var(--accent-green);">${icons.lightbulb}</div>
            </div>
            <div class="stat-value">${this.overview.activeTipsCount} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/ ${this.overview.tipsCount} total</span></div>
            <div class="stat-subtitle">Educación financiera activa</div>
          </div>
        </div>

        <!-- Barra de Viñetas / Pestañas de Marketing -->
        <div class="marketing-tabs-wrapper">
          <button class="marketing-tab-btn ${this.currentTab === 'news_billboard' ? 'active' : ''}" data-tab="news_billboard">
            ${icons.megaphone}
            <span>Noticias & Banners</span>
            <span class="marketing-tab-badge" id="badge-news_billboard">${this.dataStore.news_billboard.length}</span>
          </button>

          <button class="marketing-tab-btn ${this.currentTab === 'user_flash_missions' ? 'active' : ''}" data-tab="user_flash_missions">
            ${icons.zap}
            <span>Misiones Flash</span>
            <span class="marketing-tab-badge" id="badge-user_flash_missions">${this.dataStore.user_flash_missions.length}</span>
          </button>

          <button class="marketing-tab-btn ${this.currentTab === 'missions' ? 'active' : ''}" data-tab="missions">
            ${icons.target}
            <span>Catálogo de Misiones</span>
            <span class="marketing-tab-badge" id="badge-missions">${this.dataStore.missions.length}</span>
          </button>

          <button class="marketing-tab-btn ${this.currentTab === 'exclusive_piggy_config' ? 'active' : ''}" data-tab="exclusive_piggy_config">
            ${icons.sparkles}
            <span>Piggys Exclusivos</span>
            <span class="marketing-tab-badge" id="badge-exclusive_piggy_config">${this.dataStore.exclusive_piggy_config.length}</span>
          </button>

          <button class="marketing-tab-btn ${this.currentTab === 'cycle_completion_missions' ? 'active' : ''}" data-tab="cycle_completion_missions">
            ${icons.award}
            <span>Ciclos de Maduración</span>
            <span class="marketing-tab-badge" id="badge-cycle_completion_missions">${this.dataStore.cycle_completion_missions.length}</span>
          </button>

          <button class="marketing-tab-btn ${this.currentTab === 'dynamic_tips' ? 'active' : ''}" data-tab="dynamic_tips">
            ${icons.lightbulb}
            <span>Tips Dinámicos</span>
            <span class="marketing-tab-badge" id="badge-dynamic_tips">${this.dataStore.dynamic_tips.length}</span>
          </button>
        </div>

        <!-- Contenedor Principal de la Tabla Activa -->
        <div class="card">
          <div id="marketing-datatable-container">
            ${this.renderCurrentTabHtml()}
          </div>
        </div>
      </div>
    `;
  }

  renderCurrentTabHtml() {
    const activeController = this.tabs[this.currentTab];
    if (activeController) {
      return activeController.render(this.dataStore[this.currentTab]);
    }
    return '<div class="p-4 text-center">Selecciona una viñeta</div>';
  }

  attachEvents(container) {
    this.container = container;

    const tabButtons = container.querySelectorAll('.marketing-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedTab = btn.getAttribute('data-tab');
        if (selectedTab && selectedTab !== this.currentTab) {
          this.currentTab = selectedTab;
          tabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.switchTab();
        }
      });
    });

    this.attachActiveTabEvents();
  }

  switchTab() {
    const tableContainer = this.container.querySelector('#marketing-datatable-container');
    if (tableContainer) {
      tableContainer.innerHTML = this.renderCurrentTabHtml();
      this.attachActiveTabEvents();
    }
  }

  attachActiveTabEvents() {
    const tableContainer = this.container.querySelector('#marketing-datatable-container');
    const activeController = this.tabs[this.currentTab];
    if (activeController && tableContainer) {
      activeController.attachEvents(tableContainer);
    }
  }

  updateBadges() {
    if (!this.container) return;
    Object.keys(this.dataStore).forEach(key => {
      const badge = this.container.querySelector('#badge-' + key);
      if (badge) {
        badge.textContent = this.dataStore[key].length;
      }
    });
  }
}
