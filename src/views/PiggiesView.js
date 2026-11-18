/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGIES FARM VIEW
   Granja de Piggys, Métricas de Engorde, Liquidaciones y Gestión de Cerditos
   ========================================================================== */

import { piggiesService } from '../services/piggiesService.js';
import { DataTable } from '../components/DataTable.js';
import { renderStatCard } from '../components/StatCard.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';
import { resolveImageUrl, getFallbackImageUrl } from '../utils/imageUtils.js';
import { 
  getPiggyCategoryInfo, 
  getPiggyCategoryBadge, 
  calculatePiggyProjectedReturn
} from '../utils/piggyCategories.js';
import { openEditPiggyModal, openCreatePiggyModal } from './piggies/PiggyModals.js';

export class PiggiesView {
  constructor() {
    this.dataTable = null;
    this.piggies = [];
    this.container = null;
  }

  async render() {
    this.piggies = await piggiesService.getPiggies('all');
    return this.renderViewTemplate();
  }

  calculateDaysRemaining(endDateStr) {
    if (!endDateStr) return null;
    const targetDate = new Date(endDateStr);
    if (isNaN(targetDate.getTime())) return null;
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const targetUtc = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    return Math.ceil((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
  }

  getMetrics() {
    const engordeCount = this.piggies.filter(p => p.status === 'engorde').length;
    const completadosCount = this.piggies.filter(p => p.status === 'completado').length;

    // Contar activos en engorde por usuario para aplicar la tabla escalonada por cohorte
    const activeCountByUser = {};
    this.piggies.forEach(p => {
      if (p.status === 'engorde') {
        activeCountByUser[p.userId] = (activeCountByUser[p.userId] || 0) + 1;
      }
    });

    // Categorías más vendidas/compradas
    const catCounts = {};
    let totalCapital = 0;
    let totalExpectedPayout = 0;

    this.piggies.forEach(p => {
      const catKey = (p.category || 'estandar').toLowerCase();
      catCounts[catKey] = (catCounts[catKey] || 0) + 1;

      const cap = Number(p.investmentAmount || 1000000);
      totalCapital += cap;
      const calc = calculatePiggyProjectedReturn(p, activeCountByUser[p.userId] || 1);
      totalExpectedPayout += calc.totalPayout;
    });

    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const top1 = sortedCats[0];
    const top2 = sortedCats[1];
    const top3 = sortedCats[2];

    let topCatTitle = 'Sin datos';
    let topCatSubtitle = 'Sin compras';

    if (top1) {
      const info1 = getPiggyCategoryInfo(top1[0]);
      const pct1 = Math.round((top1[1] / (this.piggies.length || 1)) * 100);
      topCatTitle = `${info1.shortLabel || info1.label} <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">(${top1[1]})</span>`;

      const subLines = [];
      if (top2) {
        const info2 = getPiggyCategoryInfo(top2[0]);
        const pct2 = Math.round((top2[1] / (this.piggies.length || 1)) * 100);
        subLines.push(`<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">2° ${info2.shortLabel || info2.label} (${top2[1]} un.) · ${pct2}% pref.</div>`);
      }
      if (top3) {
        const info3 = getPiggyCategoryInfo(top3[0]);
        const pct3 = Math.round((top3[1] / (this.piggies.length || 1)) * 100);
        subLines.push(`<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">3° ${info3.shortLabel || info3.label} (${top3[1]} un.) · ${pct3}% pref.</div>`);
      }

      if (subLines.length > 0) {
        topCatSubtitle = subLines.join('');
      } else {
        topCatSubtitle = `${pct1}% de preferencia en compras`;
      }
    }

    const avgRoiPct = totalCapital > 0 ? (((totalExpectedPayout - totalCapital) / totalCapital) * 100).toFixed(1) : '10.0';
    const formattedCapital = `$${totalCapital.toLocaleString('es-CO')}`;
    const formattedPayout = `$${Math.round(totalExpectedPayout).toLocaleString('es-CO')}`;

    // Próximos piggys a liquidar (entre 0 y 15 días, solo activos en engorde)
    const urgentLiquidations = this.piggies
      .filter(p => p.status === 'engorde' && p.endDate)
      .map(p => {
        const days = this.calculateDaysRemaining(p.endDate);
        return { ...p, daysRemaining: days };
      })
      .filter(p => p.daysRemaining !== null && p.daysRemaining >= 0 && p.daysRemaining <= 15)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      engordeCount,
      completadosCount,
      topCatTitle,
      topCatSubtitle,
      formattedCapital,
      formattedPayout,
      avgRoiPct,
      urgentLiquidations,
      activeCountByUser
    };
  }

  renderViewTemplate() {
    const metrics = this.getMetrics();

    // Configurar DataTable
    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar por cerdito, contrato o usuario...',
      filters: [
        { label: 'Engorde', value: 'engorde' },
        { label: 'Completado', value: 'completado' }
      ],
      actionButton: {
        text: 'Asignar Piggy Manual',
        icon: icons.plus,
        onClick: () => this.openCreatePiggyModal()
      },
      columns: [
        {
          header: 'Cerdito / Lote',
          render: (p) => {
            const resolvedSrc = resolveImageUrl(p.imageUrl || 'assets/piggies/stage1/et1-1.jpg');
            const fallbackSrc = getFallbackImageUrl(p.imageUrl || 'assets/piggies/stage1/et1-1.jpg');
            return `
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 42px; height: 42px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-dark); border: 1px solid var(--border-color); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                  <img src="${resolvedSrc}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackSrc}';" />
                </div>
                <div>
                  <div style="font-weight: 800; color: var(--primary-pink); font-size: 0.92rem;">${p.name}</div>
                  <div style="font-size: 0.73rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem; margin-top: 2px;">
                    <span style="color: var(--text-muted);">${icons.fileText}</span>
                    <span style="color: ${p.contractCode ? 'var(--text-secondary)' : 'var(--text-muted)'}; font-weight: 600;">
                      ${p.contractCode ? p.contractCode : 'Sin Contrato'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }
        },
        {
          header: 'USUARIO',
          render: (p) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${p.userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.userPhone}</div>
            </div>
          `
        },
        {
          header: 'CATEGORÍA',
          render: (p) => {
            const catInfo = getPiggyCategoryInfo(p.category);
            const cohortTag = p.planVersion === 'v2_2026' ? `V2 · ${p.cycleDays || 122}d` : `V1 · ${p.cycleDays || 144}d`;
            return `
              <div>
                ${getPiggyCategoryBadge(p.category, catInfo.label)}
                <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 600; margin-top: 2px;">${cohortTag}</div>
              </div>
            `;
          }
        },
        {
          header: 'VALOR',
          render: (p) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">$${p.investmentAmount.toLocaleString('es-CO')}</div>
              <div style="font-size: 0.75rem; color: var(--accent-green); font-weight: 700;">
                ${p.extraRoiBonus > 0 ? `+${(p.extraRoiBonus * 100).toFixed(0)}% Extra` : 'Beneficio Base'}
              </div>
            </div>
          `
        },
        {
          header: 'Estado',
          render: (p) => {
            const isCompleted = p.status === 'completado';
            const badgeClass = isCompleted ? 'badge-success' : 'badge-warning';
            const label = isCompleted ? 'Completado' : 'Engorde';
            return `<span class="badge ${badgeClass}">${label}</span>`;
          }
        },
        {
          header: 'Fecha Compra',
          sortValue: (p) => (p.purchaseDate ? new Date(p.purchaseDate).getTime() : 0),
          render: (p) => {
            if (!p.purchaseDate) {
              return `<div style="font-size: 0.8rem; color: var(--text-muted);">Sin registro</div>`;
            }
            const d = new Date(p.purchaseDate);
            if (isNaN(d.getTime())) {
              return `<div style="font-size: 0.8rem; color: var(--text-muted);">N/A</div>`;
            }
            const dateFormatted = d.toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            return `
              <div>
                <div style="font-size: 0.82rem; color: var(--text-primary); font-weight: 600;">${dateFormatted}</div>
              </div>
            `;
          }
        },
        {
          header: 'Liquidación',
          sortValue: (p) => (p.endDate ? new Date(p.endDate).getTime() : 0),
          render: (p) => {
            if (!p.endDate) {
              return `<div style="font-size: 0.8rem; color: var(--text-muted);">19 semanas</div>`;
            }
            const days = this.calculateDaysRemaining(p.endDate);
            const dateFormatted = new Date(p.endDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let daysBadge = '';
            if (p.status === 'engorde' && days !== null) {
              if (days === 0) {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--accent-red); font-weight: 800; margin-top: 2px;">Vence: Hoy</div>`;
              } else if (days > 0 && days <= 7) {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--accent-red); font-weight: 800; margin-top: 2px;">Vence en: ${days} ${days === 1 ? 'día' : 'días'}</div>`;
              } else if (days > 7 && days <= 15) {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 800; margin-top: 2px;">Vence en: ${days} días</div>`;
              } else if (days > 15) {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Vence en: ${days} días</div>`;
              } else {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--accent-red); margin-top: 2px; font-weight: 700;">Vencido</div>`;
              }
            }

            return `
              <div>
                <div style="font-size: 0.82rem; color: var(--text-primary); font-weight: 600;">${dateFormatted}</div>
                ${daysBadge}
              </div>
            `;
          }
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (p) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit-piggy" title="Editar Piggy">
                ${icons.edit} <span>Editar</span>
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete-piggy" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: this.piggies,
      onRowAction: (action, piggy) => this.handleAction(action, piggy)
    });

    return `
      <div class="piggies-view">
        <!-- 1. BLOQUE DE MÉTRICAS ANALÍTICAS SUPERIORES -->
        <div class="stats-grid">
          ${renderStatCard({
            title: 'Total Piggys<br>Engorde',
            value: `${metrics.engordeCount} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);">/ ${this.piggies.length}</span>`,
            subtitle: 'Ciclo biológico activo',
            iconSvg: icons.pig,
            color: 'pink'
          })}

          ${renderStatCard({
            title: 'Total Piggys Completados',
            value: `${metrics.completadosCount}`,
            subtitle: 'Ciclos finalizados con éxito',
            iconSvg: icons.shieldCheck,
            color: 'green'
          })}

          ${renderStatCard({
            title: 'Categoría Más Vendida',
            value: metrics.topCatTitle,
            subtitle: metrics.topCatSubtitle,
            iconSvg: icons.sparkles,
            color: 'gold'
          })}

          ${renderStatCard({
            title: 'Compras vs Beneficio',
            value: metrics.formattedCapital,
            subtitle: `Liquidación est.: ${metrics.formattedPayout} (+${metrics.avgRoiPct}%)`,
            iconSvg: icons.dollar,
            color: 'purple'
          })}
        </div>

        <!-- 2. WIDGET: PRÓXIMOS PIGGYS A ENTRAR EN LIQUIDACIÓN (0 a 15 DÍAS) -->
        <div class="card" style="margin-bottom: 1.75rem; border: 1px solid ${metrics.urgentLiquidations.length > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'};">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="color: ${metrics.urgentLiquidations.some(p => p.daysRemaining <= 7) ? 'var(--accent-red)' : 'var(--accent-gold)'};">
                    ${icons.alertTriangle}
                  </span>
                  Próximos Piggys a Entrar en Liquidación
                </h3>
                <span class="badge ${metrics.urgentLiquidations.length > 0 ? (metrics.urgentLiquidations.some(p => p.daysRemaining <= 7) ? 'badge-danger' : 'badge-warning') : 'badge-neutral'}" style="font-weight: 800;">
                  ${metrics.urgentLiquidations.length} en rango (0-15 días)
                </span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                Monitoreo preventivo para planificar y asegurar los pagos a participantes antes de su solicitud.
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem;">
              <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--accent-red); font-weight: 700;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-red); display: inline-block;"></span>
                0 a 7 días (Crítico / Inminente)
              </span>
              <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--accent-gold); font-weight: 700;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-gold); display: inline-block;"></span>
                7 a 15 días (Alerta)
              </span>
            </div>
          </div>

          <div style="padding: 1rem 1.25rem;">
            ${metrics.urgentLiquidations.length > 0 ? `
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
                ${metrics.urgentLiquidations.map(piggy => {
                  const isCritical = piggy.daysRemaining <= 7;
                  const borderCol = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
                  const bgCol = isCritical ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)';
                  const badgeCol = isCritical ? 'var(--accent-red)' : 'var(--accent-gold)';
                  const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)';
                  const dateStr = new Date(piggy.endDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  const resolvedImg = resolveImageUrl(piggy.imageUrl || 'assets/piggies/stage3/et3-1.jpg');
                  const fallbackImg = getFallbackImageUrl(piggy.imageUrl || 'assets/piggies/stage3/et3-1.jpg');
                  const payout = calculatePiggyProjectedReturn(piggy, metrics.activeCountByUser[piggy.userId] || 1).totalPayout;

                  return `
                    <div style="background: ${bgCol}; border: 1px solid ${borderCol}; border-radius: var(--radius-md); padding: 0.95rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem; transition: transform 0.2s ease;">
                      <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                        <div style="width: 46px; height: 46px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-dark); border: 1px solid var(--border-color); flex-shrink: 0;">
                          <img src="${resolvedImg}" alt="${piggy.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackImg}';" />
                        </div>
                        <div style="flex: 1; min-width: 0;">
                          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 2px;">
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${piggy.name}</div>
                            <span style="background: ${badgeBg}; color: ${badgeCol}; border: 1px solid ${borderCol}; font-weight: 800; font-size: 0.72rem; padding: 2px 7px; border-radius: var(--radius-full); white-space: nowrap;">
                              ${piggy.daysRemaining === 0 ? 'Vence Hoy' : `Vence en: ${piggy.daysRemaining}d`}
                            </span>
                          </div>
                          <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
                            <span>${icons.fileText}</span>
                            <span style="font-weight: 600; color: var(--text-secondary);">${piggy.contractCode || 'Sin contrato'}</span>
                          </div>
                        </div>
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.25); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem;">
                        <div>
                          <div style="color: var(--text-muted); font-size: 0.7rem;">Participante:</div>
                          <div style="font-weight: 700; color: var(--text-primary);">${piggy.userName}</div>
                        </div>
                        <div style="text-align: right;">
                          <div style="color: var(--text-muted); font-size: 0.7rem;">Fecha Liquidación:</div>
                          <div style="font-weight: 700; color: ${badgeCol};">${dateStr}</div>
                        </div>
                      </div>

                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-size: 0.7rem; color: var(--text-muted);">Proyección Liquidación:</div>
                          <div style="font-weight: 800; color: var(--accent-green); font-size: 0.9rem;">$${Math.round(payout).toLocaleString('es-CO')}</div>
                        </div>
                        <button class="btn btn-secondary btn-sm" data-action="quick-edit-piggy" data-piggy-id="${piggy.id}" style="font-size: 0.72rem; padding: 0.35rem 0.65rem;">
                          ${icons.edit} Gestionar
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div style="padding: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; background: rgba(255, 255, 255, 0.02); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
                <span style="color: var(--accent-green); display: inline-block; margin-bottom: 0.35rem;">${icons.shieldCheck}</span>
                <div>No hay cerditos en engorde con fecha de liquidación en los próximos 15 días.</div>
              </div>
            `}
          </div>
        </div>

        <!-- 3. TABLA PRINCIPAL DE GRANJA DE PIGGYS -->
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${icons.pig} Granja de Piggys</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Control de ciclo biológico, categorías, contratos y liquidaciones
              </div>
            </div>
            <div>
              <span class="badge badge-success">Engorde Activo: ${metrics.engordeCount}</span>
            </div>
          </div>

          <div id="piggies-datatable-container">
            ${this.dataTable.render()}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    this.container = container;
    if (this.dataTable) {
      this.dataTable.attachEvents(container.querySelector('#piggies-datatable-container'));
    }

    // Eventos para botones de gestión rápida en el widget de liquidaciones
    const quickEditButtons = container.querySelectorAll('[data-action="quick-edit-piggy"]');
    quickEditButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-piggy-id');
        const piggy = this.piggies.find(p => String(p.id) === String(id));
        if (piggy) {
          this.openEditPiggyModal(piggy);
        }
      });
    });
  }

  handleAction(action, piggy) {
    if (action === 'edit-piggy') {
      this.openEditPiggyModal(piggy);
    } else if (action === 'delete-piggy') {
      if (confirm(`¿Estás seguro de eliminar el cerdito "${piggy.name}"?`)) {
        this.deletePiggy(piggy.id);
      }
    }
  }

  formatDateTimeForInput(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  openEditPiggyModal(piggy) {
    return openEditPiggyModal(this, piggy);
  }

  async openCreatePiggyModal() {
    return openCreatePiggyModal(this);
  }

  async deletePiggy(piggyId) {
    const res = await piggiesService.deletePiggy(piggyId);
    if (res.success) {
      toast.success('Piggy eliminado');
      this.piggies = this.piggies.filter(p => p.id !== piggyId);
      if (this.container) {
        this.container.innerHTML = this.renderViewTemplate();
        this.attachEvents(this.container);
      }
    } else {
      toast.error(res.error || 'Error al eliminar');
    }
  }
}
