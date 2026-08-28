/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETING OPERATIONS CENTER VIEW
   5 Main Tabs:
   1. Banners (news_billboard)
   2. Misiones (Misiones Globales + Misiones Flash)
   3. Bonos Consumo (user_marketing_bonuses) - Vista Unificada Directa
   4. Ciclos Completados (Granja Piggys Exclusivos + Piggys Exclusivos Config)
   5. Tips Dinámicos (dynamic_tips)
   ========================================================================== */

import { marketingService } from '../services/marketingService.js';
import { usersService } from '../services/usersService.js';
import { icons } from '../icons.js';

import { NewsTab } from './marketing/NewsTab.js';
import { MissionsTab } from './marketing/MissionsTab.js';
import { FlashMissionsTab } from './marketing/FlashMissionsTab.js';
import { BonosConsumoTab } from './marketing/BonosConsumoTab.js';
import { CycleMissionsTab } from './marketing/CycleMissionsTab.js';
import { ExclusiveConfigTab } from './marketing/ExclusiveConfigTab.js';
import { DynamicTipsTab } from './marketing/DynamicTipsTab.js';

export class MarketingView {
  constructor() {
    this.mainTab = 'banners'; // 'banners' | 'missions' | 'bonuses' | 'cycles' | 'tips'
    this.subTabs = {
      missions: 'global_missions', // 'global_missions' | 'flash_missions'
      cycles: 'exclusive_farm'     // 'exclusive_farm' | 'exclusive_config'
    };

    this.overview = null;
    this.container = null;
    this.profilesList = [];
    this.piggiesList = [];

    this.dataStore = {
      news_billboard: [],
      missions: [],
      user_flash_missions: [],
      user_marketing_bonuses: [],
      cycle_completion_missions: [],
      exclusive_piggy_config: [],
      dynamic_tips: []
    };

    // Sub-tab / Tab controllers
    this.controllers = {
      news_billboard: new NewsTab(this),
      missions: new MissionsTab(this),
      user_flash_missions: new FlashMissionsTab(this),
      user_marketing_bonuses: new BonosConsumoTab(this),
      cycle_completion_missions: new CycleMissionsTab(this),
      exclusive_piggy_config: new ExclusiveConfigTab(this),
      dynamic_tips: new DynamicTipsTab(this)
    };
  }

  async render() {
    const [overview, news, missions, flashMissions, userBonuses, cycleMissions, exclusiveConfigs, tips, profiles, piggies] = await Promise.all([
      marketingService.getMarketingOverview(),
      marketingService.getNews(),
      marketingService.getMissions(),
      marketingService.getUserFlashMissions(),
      marketingService.getUserMarketingBonuses(),
      marketingService.getCycleMissions(),
      marketingService.getExclusiveConfigs(),
      marketingService.getDynamicTips(),
      usersService.getUsers(),
      marketingService.getPiggies()
    ]);

    this.overview = overview;
    this.dataStore.news_billboard = news;
    this.dataStore.missions = missions;
    this.dataStore.user_flash_missions = flashMissions;
    this.dataStore.user_marketing_bonuses = userBonuses;
    this.dataStore.cycle_completion_missions = cycleMissions;
    this.dataStore.exclusive_piggy_config = exclusiveConfigs;
    this.dataStore.dynamic_tips = tips;
    this.profilesList = profiles || [];
    this.piggiesList = piggies || [];

    const totalMissions = this.dataStore.missions.length + this.dataStore.user_flash_missions.length;
    const totalBonuses = this.dataStore.user_marketing_bonuses.length;
    const totalCycles = this.dataStore.cycle_completion_missions.length + this.dataStore.exclusive_piggy_config.length;

    return `
      <div class="marketing-view">
        <!-- Tarjetas de métricas de operaciones de marketing -->
        <div class="marketing-header-metrics">
          <div class="stat-card" style="border-left: 4px solid var(--primary-pink);">
            <div class="stat-header">
              <span class="stat-title">Banners Activos</span>
              <div class="stat-icon" style="color: var(--primary-pink);">${icons.megaphone}</div>
            </div>
            <div class="stat-value">${this.overview.activeNewsCount} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/ ${this.overview.newsCount} total</span></div>
            <div class="stat-subtitle">En rotación en el Home</div>
          </div>

          <div class="stat-card" style="border-left: 4px solid var(--accent-gold);">
            <div class="stat-header">
              <span class="stat-title">Misiones</span>
              <div class="stat-icon" style="color: var(--accent-gold);">${icons.target}</div>
            </div>
            <div class="stat-value">${this.dataStore.missions.length} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">registradas + ${this.overview.activeFlashCount} flash</span></div>
            <div class="stat-subtitle">Retos y recompensas para usuarios</div>
          </div>

          <div class="stat-card" style="border-left: 4px solid var(--accent-green);">
            <div class="stat-header">
              <span class="stat-title">Bonos Consumo</span>
              <div class="stat-icon" style="color: var(--accent-green);">${icons.gift}</div>
            </div>
            <div class="stat-value">${this.dataStore.user_marketing_bonuses.length} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">otorgados (${this.overview.activeUserBonusesCount || 0} activos)</span></div>
            <div class="stat-subtitle">Incentivos para compras de carne</div>
          </div>

          <div class="stat-card" style="border-left: 4px solid var(--accent-purple);">
            <div class="stat-header">
              <span class="stat-title">Ciclos Completados</span>
              <div class="stat-icon" style="color: var(--accent-purple);">${icons.award}</div>
            </div>
            <div class="stat-value">${this.dataStore.cycle_completion_missions.length} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">ofertas (${this.dataStore.exclusive_piggy_config.length} config)</span></div>
            <div class="stat-subtitle">Piggys exclusivos post-ciclo</div>
          </div>

          <div class="stat-card" style="border-left: 4px solid var(--accent-blue);">
            <div class="stat-header">
              <span class="stat-title">Tips Dinámicos</span>
              <div class="stat-icon" style="color: var(--accent-blue);">${icons.lightbulb}</div>
            </div>
            <div class="stat-value">${this.overview.activeTipsCount} <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/ ${this.overview.tipsCount} total</span></div>
            <div class="stat-subtitle">Educación financiera activa</div>
          </div>
        </div>

        <!-- 5 Viñetas Principales de Marketing -->
        <div class="marketing-tabs-wrapper">
          <button class="marketing-tab-btn ${this.mainTab === 'banners' ? 'active' : ''}" data-maintab="banners">
            ${icons.megaphone}
            <span>Banners</span>
            <span class="marketing-tab-badge" id="badge-main-banners">${this.dataStore.news_billboard.length}</span>
          </button>

          <button class="marketing-tab-btn ${this.mainTab === 'missions' ? 'active' : ''}" data-maintab="missions">
            ${icons.target}
            <span>Misiones</span>
            <span class="marketing-tab-badge" id="badge-main-missions">${totalMissions}</span>
          </button>

          <button class="marketing-tab-btn ${this.mainTab === 'bonuses' ? 'active' : ''}" data-maintab="bonuses">
            ${icons.gift}
            <span>Bonos Consumo</span>
            <span class="marketing-tab-badge" id="badge-main-bonuses">${totalBonuses}</span>
          </button>

          <button class="marketing-tab-btn ${this.mainTab === 'cycles' ? 'active' : ''}" data-maintab="cycles">
            ${icons.award}
            <span>Ciclos Completados</span>
            <span class="marketing-tab-badge" id="badge-main-cycles">${totalCycles}</span>
          </button>

          <button class="marketing-tab-btn ${this.mainTab === 'tips' ? 'active' : ''}" data-maintab="tips">
            ${icons.lightbulb}
            <span>Tips Dinámicos</span>
            <span class="marketing-tab-badge" id="badge-main-tips">${this.dataStore.dynamic_tips.length}</span>
          </button>
        </div>

        <!-- Contenedor Principal con Sub-pestañas y Tabla -->
        <div class="card">
          <div id="marketing-subtabs-container">
            ${this.renderSubTabsHtml()}
          </div>
          <div id="marketing-datatable-container">
            ${this.renderActiveTableHtml()}
          </div>
        </div>
      </div>
    `;
  }

  renderSubTabsHtml() {
    if (this.mainTab === 'missions') {
      const activeSub = this.subTabs.missions;
      return `
        <div class="marketing-subtabs-wrapper">
          <button class="marketing-subtab-btn ${activeSub === 'global_missions' ? 'active' : ''}" data-subtab="global_missions">
            ${icons.target}
            <span>Misiones Globales</span>
            <span class="marketing-subtab-badge" id="badge-sub-missions">${this.dataStore.missions.length}</span>
          </button>

          <button class="marketing-subtab-btn ${activeSub === 'flash_missions' ? 'active' : ''}" data-subtab="flash_missions">
            ${icons.zap}
            <span>Misiones Flash</span>
            <span class="marketing-subtab-badge" id="badge-sub-flash">${this.dataStore.user_flash_missions.length}</span>
          </button>
        </div>
      `;
    }

    if (this.mainTab === 'cycles') {
      const activeSub = this.subTabs.cycles;
      return `
        <div class="marketing-subtabs-wrapper">
          <button class="marketing-subtab-btn ${activeSub === 'exclusive_farm' ? 'active' : ''}" data-subtab="exclusive_farm">
            ${icons.pig}
            <span>Granja Piggys Exclusivos</span>
            <span class="marketing-subtab-badge" id="badge-sub-cycle-missions">${this.dataStore.cycle_completion_missions.length}</span>
          </button>

          <button class="marketing-subtab-btn ${activeSub === 'exclusive_config' ? 'active' : ''}" data-subtab="exclusive_config">
            ${icons.sparkles}
            <span>Piggys Exclusivos</span>
            <span class="marketing-subtab-badge" id="badge-sub-exclusive-config">${this.dataStore.exclusive_piggy_config.length}</span>
          </button>
        </div>
      `;
    }

    return '';
  }

  getActiveKey() {
    if (this.mainTab === 'banners') return 'news_billboard';
    if (this.mainTab === 'bonuses') return 'user_marketing_bonuses';
    if (this.mainTab === 'tips') return 'dynamic_tips';
    if (this.mainTab === 'missions') {
      return this.subTabs.missions === 'global_missions' ? 'missions' : 'user_flash_missions';
    }
    if (this.mainTab === 'cycles') {
      return this.subTabs.cycles === 'exclusive_farm' ? 'cycle_completion_missions' : 'exclusive_piggy_config';
    }
    return 'news_billboard';
  }

  renderActiveTableHtml() {
    const key = this.getActiveKey();
    const controller = this.controllers[key];
    if (controller) {
      return controller.render(this.dataStore[key]);
    }
    return '<div class="p-4 text-center">Selecciona una opción</div>';
  }

  attachEvents(container) {
    this.container = container;

    // Main Tab Switching
    const mainTabButtons = container.querySelectorAll('.marketing-tab-btn');
    mainTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedMain = btn.getAttribute('data-maintab');
        if (selectedMain && selectedMain !== this.mainTab) {
          this.mainTab = selectedMain;
          mainTabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.updateView();
        }
      });
    });

    this.attachSubTabEvents();
    this.attachActiveTableEvents();
  }

  attachSubTabEvents() {
    const subTabButtons = this.container.querySelectorAll('.marketing-subtab-btn');
    subTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = btn.getAttribute('data-subtab');
        if (this.mainTab === 'missions') {
          this.subTabs.missions = sub;
        } else if (this.mainTab === 'cycles') {
          this.subTabs.cycles = sub;
        }
        subTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tableContainer = this.container.querySelector('#marketing-datatable-container');
        if (tableContainer) {
          tableContainer.innerHTML = this.renderActiveTableHtml();
          this.attachActiveTableEvents();
        }
      });
    });
  }

  updateView() {
    const subContainer = this.container.querySelector('#marketing-subtabs-container');
    const tableContainer = this.container.querySelector('#marketing-datatable-container');

    if (subContainer) {
      subContainer.innerHTML = this.renderSubTabsHtml();
      this.attachSubTabEvents();
    }

    if (tableContainer) {
      tableContainer.innerHTML = this.renderActiveTableHtml();
      this.attachActiveTableEvents();
    }
  }

  attachActiveTableEvents() {
    const tableContainer = this.container.querySelector('#marketing-datatable-container');
    const key = this.getActiveKey();
    const controller = this.controllers[key];
    if (controller && tableContainer) {
      controller.attachEvents(tableContainer);
    }
  }

  updateBadges() {
    if (!this.container) return;
    const badgeBanners = this.container.querySelector('#badge-main-banners');
    if (badgeBanners) badgeBanners.textContent = this.dataStore.news_billboard.length;

    const badgeMissions = this.container.querySelector('#badge-main-missions');
    if (badgeMissions) badgeMissions.textContent = this.dataStore.missions.length + this.dataStore.user_flash_missions.length;

    const badgeBonuses = this.container.querySelector('#badge-main-bonuses');
    if (badgeBonuses) badgeBonuses.textContent = this.dataStore.user_marketing_bonuses.length;

    const badgeCycles = this.container.querySelector('#badge-main-cycles');
    if (badgeCycles) badgeCycles.textContent = this.dataStore.cycle_completion_missions.length + this.dataStore.exclusive_piggy_config.length;

    const badgeTips = this.container.querySelector('#badge-main-tips');
    if (badgeTips) badgeTips.textContent = this.dataStore.dynamic_tips.length;

    const badgeSubMissions = this.container.querySelector('#badge-sub-missions');
    if (badgeSubMissions) badgeSubMissions.textContent = this.dataStore.missions.length;

    const badgeSubFlash = this.container.querySelector('#badge-sub-flash');
    if (badgeSubFlash) badgeSubFlash.textContent = this.dataStore.user_flash_missions.length;

    const badgeSubCycle = this.container.querySelector('#badge-sub-cycle-missions');
    if (badgeSubCycle) badgeSubCycle.textContent = this.dataStore.cycle_completion_missions.length;

    const badgeSubConfig = this.container.querySelector('#badge-sub-exclusive-config');
    if (badgeSubConfig) badgeSubConfig.textContent = this.dataStore.exclusive_piggy_config.length;
  }
}
