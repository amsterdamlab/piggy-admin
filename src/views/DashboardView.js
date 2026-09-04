/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - DASHBOARD VIEW
   Main executive analytics view with Chart.js, KPIs, and Top Investors
   ========================================================================== */

import { dashboardService } from '../services/dashboardService.js';
import { renderStatCard } from '../components/StatCard.js';
import { ChartWrapper } from '../components/ChartWrapper.js';
import { icons } from '../icons.js';

export class DashboardView {
  constructor() {
    this.chart = null;
  }

  async render() {
    const metrics = await dashboardService.getSummaryMetrics();
    const topInvestors = await dashboardService.getTopInvestors();

    const formattedCapital = `$${Number(metrics.totalInvested || 0).toLocaleString('es-CO')}`;

    return `
      <div class="dashboard-view">
        <!-- KPI Cards Grid (Directly linked to modules) -->
        <div class="stats-grid">
          ${renderStatCard({
            title: 'Capital Total Gestionado',
            value: formattedCapital,
            subtitle: '+18.4% vs mes anterior',
            iconSvg: icons.dollar,
            color: 'pink',
            href: '#wallet'
          })}

          ${renderStatCard({
            title: 'Piggys en Engorde Activo',
            value: `${metrics.activePiggies} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">/ ${metrics.totalPiggies}</span>`,
            subtitle: 'Ciclo óptimo de 19 semanas',
            iconSvg: icons.pig,
            color: 'gold',
            href: '#piggies'
          })}

          ${renderStatCard({
            title: 'Usuarios Registrados',
            value: metrics.totalUsers,
            subtitle: 'Comunidad de engorde digital',
            iconSvg: icons.users,
            color: 'green',
            href: '#users'
          })}

          ${renderStatCard({
            title: 'Solicitudes Pendientes',
            value: `<span style="color: ${metrics.pendingRequests > 0 ? 'var(--accent-red)' : 'var(--text-primary)'};">${metrics.pendingRequests}</span>`,
            subtitle: metrics.pendingRequests > 0 ? 'Requiere revisión en pagos y recargas' : 'Al día',
            iconSvg: icons.wallet,
            color: metrics.pendingRequests > 0 ? 'purple' : 'blue',
            href: '#wallet'
          })}
        </div>

        <!-- Chart Section -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${icons.dashboard} Evolución de Capital y Activos</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Crecimiento histórico de inversión y volumen de Piggys
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <span class="badge badge-success">En Crecimiento</span>
            </div>
          </div>
          <div style="height: 320px; width: 100%; position: relative;">
            <canvas id="dashboard-trend-chart"></canvas>
          </div>
        </div>

        <!-- Bottom Grid: Top Investors & Quick Actions -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem;">
          <!-- Top Investors Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${icons.users} Top Inversionistas</h3>
              <a href="#users" class="btn btn-secondary btn-sm">Ver Todos</a>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Inversionista</th>
                    <th>Piggys</th>
                    <th>Inversión</th>
                    <th>Nivel ROI</th>
                  </tr>
                </thead>
                <tbody>
                  ${topInvestors.map(inv => `
                    <tr>
                      <td>
                        <div style="font-weight: 700;">${inv.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${inv.contact}</div>
                      </td>
                      <td style="font-weight: 800; color: var(--primary-pink);">${inv.piggiesCount} Piggys</td>
                      <td style="font-weight: 700; color: var(--accent-green);">$${(inv.totalInvested).toLocaleString('es-CO')}</td>
                      <td><span class="badge badge-warning">${inv.roiTier}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Quick Actions & Protocol -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${icons.zap} Acciones Rápidas</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              <a href="#wallet" class="btn btn-secondary" style="justify-content: space-between; padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="color: var(--accent-gold);">${icons.wallet}</span>
                  <div style="text-align: left;">
                    <div style="font-weight: 700;">Revisar Recargas de Saldo</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Aprobar transferencias Bre-B y pagos QR</div>
                  </div>
                </div>
                ${icons.arrowUpRight}
              </a>

              <a href="#marketplace" class="btn btn-secondary" style="justify-content: space-between; padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="color: var(--primary-pink);">${icons.marketplace}</span>
                  <div style="text-align: left;">
                    <div style="font-weight: 700;">Agregar un Nuevo Piggy al Mercado</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Crear oferta con bono ROI para usuarios</div>
                  </div>
                </div>
                ${icons.arrowUpRight}
              </a>

              <a href="#flash-missions" class="btn btn-secondary" style="justify-content: space-between; padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="color: var(--accent-gold);">${icons.zap}</span>
                  <div style="text-align: left;">
                    <div style="font-weight: 700;">Lanzar Ofertas Flash</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Crear y programar misiones u ofertas flash</div>
                  </div>
                </div>
                ${icons.arrowUpRight}
              </a>

              <a href="#marketing-bonuses" class="btn btn-secondary" style="justify-content: space-between; padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="color: var(--accent-purple);">${icons.gift}</span>
                  <div style="text-align: left;">
                    <div style="font-weight: 700;">Asignar Bonos de Consumo</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Emitir y programar bonos de consumo en Marketing</div>
                  </div>
                </div>
                ${icons.arrowUpRight}
              </a>

              <a href="#piggies" class="btn btn-secondary" style="justify-content: space-between; padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="color: var(--accent-red);">${icons.pig}</span>
                  <div style="text-align: left;">
                    <div style="font-weight: 700;">Próximos Piggys en Liquidación</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Monitorear cerditos a liquidar en Granja de Piggys</div>
                  </div>
                </div>
                ${icons.arrowUpRight}
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async attachEvents(container) {
    const canvas = container.querySelector('#dashboard-trend-chart');
    if (canvas) {
      this.chart = new ChartWrapper(canvas);
      const chartData = await dashboardService.getChartData();
      this.chart.renderLineChart(chartData);
    }
  }

  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
