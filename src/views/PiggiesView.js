/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGIES FARM VIEW
   Granja de Piggys, Métricas de Engorde, Liquidaciones y Gestión de Cerditos
   ========================================================================== */

import { piggiesService } from '../services/piggiesService.js';
import { usersService } from '../services/usersService.js';
import { DataTable } from '../components/DataTable.js';
import { renderStatCard } from '../components/StatCard.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';
import { resolveImageUrl, getFallbackImageUrl, PIGGY_PRESET_IMAGES } from '../utils/imageUtils.js';
import { formatCurrency, parseCurrency, setupCurrencyInput } from '../utils/formUtils.js';
import { 
  PIGGY_CATEGORIES, 
  getPiggyCategoryInfo, 
  getPiggyCategoryBadge, 
  renderCategorySelectOptions 
} from '../utils/piggyCategories.js';

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

    // Categorías más vendidas/compradas
    const catCounts = {};
    let totalCapital = 0;
    let totalExpectedPayout = 0;

    this.piggies.forEach(p => {
      const catKey = (p.category || 'estandar').toLowerCase();
      catCounts[catKey] = (catCounts[catKey] || 0) + 1;

      const cap = Number(p.investmentAmount || 1000000);
      totalCapital += cap;
      const baseRoi = 0.10; // 10% promedio base
      const extraRoi = Number(p.extraRoiBonus || 0);
      const totalRoiRate = baseRoi + extraRoi;
      totalExpectedPayout += cap * (1 + totalRoiRate);
    });

    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const top1 = sortedCats[0];
    const top2 = sortedCats[1];

    let topCatTitle = 'Sin datos';
    let topCatSubtitle = 'Sin compras';

    if (top1) {
      const info1 = getPiggyCategoryInfo(top1[0]);
      const pct1 = Math.round((top1[1] / (this.piggies.length || 1)) * 100);
      topCatTitle = `${info1.shortLabel || info1.label} (${top1[1]})`;
      if (top2) {
        const info2 = getPiggyCategoryInfo(top2[0]);
        topCatSubtitle = `2° ${info2.shortLabel || info2.label} (${top2[1]} un.) · ${pct1}% pref.`;
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
      urgentLiquidations
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
            return `
              <div>
                ${getPiggyCategoryBadge(p.category, catInfo.label)}
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
                ${p.extraRoiBonus > 0 ? `+${(p.extraRoiBonus * 100).toFixed(1)}% Extra` : 'ROI Estándar'}
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
          header: 'Liquidación',
          render: (p) => {
            if (!p.endDate) {
              return `<div style="font-size: 0.8rem; color: var(--text-muted);">19 semanas</div>`;
            }
            const days = this.calculateDaysRemaining(p.endDate);
            const dateFormatted = new Date(p.endDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
            
            let daysBadge = '';
            if (p.status === 'engorde' && days !== null) {
              if (days >= 0 && days <= 7) {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--accent-red); font-weight: 800; margin-top: 2px;">🔴 En ${days} ${days === 1 ? 'día' : 'días'}</div>`;
              } else if (days > 7 && days <= 15) {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 800; margin-top: 2px;">🟡 En ${days} días</div>`;
              } else if (days > 15) {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">En ${days} días</div>`;
              } else {
                daysBadge = `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">Vencido</div>`;
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
            title: 'Total Piggys Engorde',
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
            title: 'Capital Total vs ROI',
            value: metrics.formattedCapital,
            subtitle: `Retorno est.: ${metrics.formattedPayout} (+${metrics.avgRoiPct}%)`,
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
                Monitoreo preventivo para planificar y asegurar los pagos a inversionistas antes de su solicitud.
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
                  const dateStr = new Date(piggy.endDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
                  const resolvedImg = resolveImageUrl(piggy.imageUrl || 'assets/piggies/stage3/et3-1.jpg');
                  const fallbackImg = getFallbackImageUrl(piggy.imageUrl || 'assets/piggies/stage3/et3-1.jpg');
                  const payout = piggy.investmentAmount * (1 + 0.10 + (piggy.extraRoiBonus || 0));

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
                              ${isCritical ? '🚨' : '⏳'} ${piggy.daysRemaining === 0 ? '¡Hoy!' : `Faltan ${piggy.daysRemaining}d`}
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
                          <div style="color: var(--text-muted); font-size: 0.7rem;">Inversionista:</div>
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

  formatDateForInput(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  openEditPiggyModal(piggy) {
    const currentCat = (piggy.category || 'estandar').toLowerCase();
    const formattedEndDate = this.formatDateForInput(piggy.endDate);
    const resolvedInitialImg = resolveImageUrl(piggy.imageUrl || 'assets/piggies/stage1/et1-1.jpg');
    const fallbackInitialImg = getFallbackImageUrl(piggy.imageUrl || 'assets/piggies/stage1/et1-1.jpg');

    modal.open({
      title: `Editar Piggy: ${piggy.name}`,
      contentHtml: `
        <form id="edit-piggy-form">
          <div class="form-row">
            <div class="form-group" style="flex: 1.5;">
              <label class="form-label">Usuario / Dueño</label>
              <input type="text" class="form-input" value="${piggy.userName} (${piggy.userPhone})" disabled />
            </div>

            <div class="form-group" style="flex: 1.5;">
              <label class="form-label" for="edit-name-input">Nombre o Etiqueta</label>
              <input type="text" id="edit-name-input" class="form-input" value="${piggy.name}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-category-select">Categoría del Piggy</label>
              <select id="edit-category-select" class="form-select">
                ${renderCategorySelectOptions(currentCat)}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-status-select">Estado del Ciclo</label>
              <select id="edit-status-select" class="form-select">
                <option value="engorde" ${piggy.status === 'engorde' ? 'selected' : ''}>Engorde</option>
                <option value="completado" ${piggy.status === 'completado' ? 'selected' : ''}>Completado</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-contract-code-input">Código de Contrato</label>
              <input 
                type="text" 
                id="edit-contract-code-input" 
                class="form-input" 
                value="${piggy.contractCode || ''}" 
                placeholder="Ej: PG-2026-001" 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-contract-url-input">URL del Contrato</label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input 
                  type="text" 
                  id="edit-contract-url-input" 
                  class="form-input" 
                  value="${piggy.contractUrl || ''}" 
                  placeholder="https://... o ruta del archivo" 
                />
                ${piggy.contractUrl ? `
                  <a href="${piggy.contractUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-icon btn-sm" title="Abrir enlace de contrato">
                    ${icons.arrowUpRight}
                  </a>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-end-date-input">Fecha de Liquidación</label>
              <input 
                type="date" 
                id="edit-end-date-input" 
                class="form-input" 
                value="${formattedEndDate}" 
              />
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">
                Fecha proyectada para finalización y pago del ciclo
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-roi-input">Bono Extra ROI (ej: 0.02 = +2%)</label>
              <input 
                type="number" 
                id="edit-roi-input" 
                class="form-input" 
                step="0.005" 
                min="0" 
                max="0.1" 
                value="${piggy.extraRoiBonus}" 
                required 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-weight-input">Peso Actual (kg)</label>
              <input 
                type="number" 
                id="edit-weight-input" 
                class="form-input" 
                step="0.1" 
                min="10" 
                max="180" 
                value="${piggy.currentWeight}" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-final-weight-input">Peso Final (kg)</label>
              <input 
                type="number" 
                id="edit-final-weight-input" 
                class="form-input" 
                step="0.1" 
                min="10" 
                max="200" 
                value="${piggy.finalWeight || 100.0}" 
              />
            </div>
          </div>

          <!-- Selector de Imagen de Cerdito -->
          <div class="form-group">
            <label class="form-label">Seleccionar Cerdito Prediseñado (Etapas 1, 2 y 3)</label>
            <div class="piggy-preset-gallery" id="edit-preset-gallery" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;">
              ${PIGGY_PRESET_IMAGES.map(p => `
                <div class="piggy-preset-card ${piggy.imageUrl === p.path ? 'active' : ''}" data-path="${p.path}" title="${p.label}" style="cursor: pointer; flex-shrink: 0; width: 44px; height: 44px; border-radius: var(--radius-sm); border: 2px solid ${piggy.imageUrl === p.path ? 'var(--primary-pink)' : 'var(--border-color)'}; overflow: hidden; background: var(--bg-dark);">
                  <img src="${resolveImageUrl(p.path)}" alt="${p.label}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${getFallbackImageUrl(p.path)}';" />
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-image-url-input">URL Imagen del Cerdito</label>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <input 
                type="text" 
                id="edit-image-url-input" 
                class="form-input" 
                value="${piggy.imageUrl || ''}" 
                placeholder="assets/piggies/stage1/et1-1.jpg o https://..." 
              />
              <div id="edit-image-preview-box" style="width: 44px; height: 44px; border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow: hidden; background: var(--bg-dark); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <img id="edit-image-preview-img" src="${resolvedInitialImg}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackInitialImg}';" />
              </div>
            </div>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const urlInput = modalBody.querySelector('#edit-image-url-input');
        const previewImg = modalBody.querySelector('#edit-image-preview-img');
        const presetCards = modalBody.querySelectorAll('.piggy-preset-card');

        // Preset selection
        presetCards.forEach(card => {
          card.addEventListener('click', () => {
            presetCards.forEach(c => {
              c.classList.remove('active');
              c.style.borderColor = 'var(--border-color)';
            });
            card.classList.add('active');
            card.style.borderColor = 'var(--primary-pink)';
            const path = card.getAttribute('data-path');
            urlInput.value = path;
            if (previewImg) {
              previewImg.src = resolveImageUrl(path);
            }
          });
        });

        // Input live change
        urlInput.addEventListener('input', () => {
          const val = urlInput.value.trim();
          if (previewImg) {
            previewImg.src = val ? resolveImageUrl(val) : fallbackInitialImg;
          }
        });
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Guardar Cambios',
          class: 'btn-success',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const name = root.querySelector('#edit-name-input')?.value?.trim();
            const category = root.querySelector('#edit-category-select')?.value;
            const status = root.querySelector('#edit-status-select')?.value;
            const contractCode = root.querySelector('#edit-contract-code-input')?.value?.trim();
            const contractUrl = root.querySelector('#edit-contract-url-input')?.value?.trim();
            const endDateVal = root.querySelector('#edit-end-date-input')?.value;
            const roi = root.querySelector('#edit-roi-input')?.value;
            const weight = root.querySelector('#edit-weight-input')?.value;
            const finalWeight = root.querySelector('#edit-final-weight-input')?.value;
            const imageUrl = root.querySelector('#edit-image-url-input')?.value?.trim();

            if (!name) {
              toast.error('El nombre del cerdito no puede estar vacío');
              return;
            }

            const res = await piggiesService.updatePiggy(piggy.id, {
              name,
              category,
              status,
              contractCode,
              contractUrl,
              endDate: endDateVal ? new Date(endDateVal + 'T12:00:00Z').toISOString() : null,
              extraRoiBonus: Number(roi),
              currentWeight: Number(weight),
              finalWeight: finalWeight ? Number(finalWeight) : null,
              imageUrl
            });

            if (res.success) {
              toast.success('Piggy actualizado correctamente');
              // Actualizar datos locales
              piggy.name = name;
              piggy.category = category;
              piggy.status = status;
              piggy.contractCode = contractCode;
              piggy.contractUrl = contractUrl;
              piggy.endDate = endDateVal ? new Date(endDateVal + 'T12:00:00Z').toISOString() : null;
              piggy.extraRoiBonus = Number(roi);
              piggy.currentWeight = Number(weight);
              piggy.finalWeight = finalWeight ? Number(finalWeight) : null;
              piggy.imageUrl = imageUrl;

              // Refrescar vista completa
              if (this.container) {
                this.piggies = await piggiesService.getPiggies('all');
                this.container.innerHTML = this.renderViewTemplate();
                this.attachEvents(this.container);
              } else {
                this.dataTable.setData(this.piggies);
              }
              m.close();
            } else {
              toast.error(res.error || 'Error al actualizar cerdito');
            }
          }
        }
      ]
    });
  }

  async openCreatePiggyModal() {
    const users = await usersService.getUsers();

    modal.open({
      title: 'Asignar Nuevo Piggy a Usuario',
      contentHtml: `
        <form id="create-piggy-form">
          <div class="form-group">
            <label class="form-label" for="piggy-user-select">Seleccionar Usuario Dueño</label>
            <select id="piggy-user-select" class="form-select" required>
              ${users.map(u => `<option value="${u.id}">${u.fullName} (${u.whatsapp})</option>`).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="new-piggy-name">Nombre / Raza</label>
              <input type="text" id="new-piggy-name" class="form-input" placeholder="Ej: Piggy Landrace Premium" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="new-piggy-category">Categoría</label>
              <select id="new-piggy-category" class="form-select">
                ${renderCategorySelectOptions('estandar')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="new-piggy-amount">Inversión</label>
              <div class="currency-input-wrapper">
                <span class="currency-input-prefix">$</span>
                <input type="text" id="new-piggy-amount" class="form-input" value="${formatCurrency(1000000)}" placeholder="1.000.000" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="new-piggy-contract">Código Contrato (Opcional)</label>
              <input type="text" id="new-piggy-contract" class="form-input" placeholder="Ej: PG-2026-001" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="new-piggy-weight">Peso Inicial (kg)</label>
              <input type="number" id="new-piggy-weight" class="form-input" value="15.0" step="0.5" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="new-piggy-roi">Bono Extra ROI (ej: 0.01)</label>
              <input type="number" id="new-piggy-roi" class="form-input" value="0.00" step="0.005" />
            </div>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const amountInput = modalBody.querySelector('#new-piggy-amount');
        setupCurrencyInput(amountInput);
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Asignar y Crear',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const userId = root.querySelector('#piggy-user-select')?.value;
            const name = root.querySelector('#new-piggy-name')?.value?.trim();
            const category = root.querySelector('#new-piggy-category')?.value;
            const contractCode = root.querySelector('#new-piggy-contract')?.value?.trim();
            const amount = parseCurrency(root.querySelector('#new-piggy-amount')?.value);
            const weight = root.querySelector('#new-piggy-weight')?.value;
            const roi = root.querySelector('#new-piggy-roi')?.value;

            if (!name) {
              toast.error('Ingresa un nombre para el cerdito');
              return;
            }

            const res = await piggiesService.createPiggyForUser(userId, {
              name,
              category,
              contractCode,
              investmentAmount: Number(amount || 0),
              currentWeight: Number(weight),
              extraRoiBonus: Number(roi),
              status: 'engorde'
            });

            if (res.success) {
              toast.success('¡Piggy asignado exitosamente!');
              this.piggies = await piggiesService.getPiggies('all');
              if (this.container) {
                this.container.innerHTML = this.renderViewTemplate();
                this.attachEvents(this.container);
              }
              m.close();
            } else {
              toast.error(res.error || 'Error al crear Piggy');
            }
          }
        }
      ]
    });
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
