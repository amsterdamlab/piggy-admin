/* ==========================================================================
   MARKETING - CICLOS: SUB-TAB 1: GRANJA PIGGYS EXCLUSIVOS (cycle_completion_missions)
   Muestra cerditos puestos a disposición al completar ciclo y estado de compra
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';
import { getPiggyCategoryBadge, getPiggyCategoryInfo, renderCategorySelectOptions } from '../../utils/piggyCategories.js';
import { formatCurrency, parseCurrency, setupCurrencyInput, setupDateTimePicker } from '../../utils/formUtils.js';

export class CycleMissionsTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    const rawData = data || [];
    const profiles = this.parentView.profilesList || [];
    const piggies = this.parentView.piggiesList || [];

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.id] = p;
    });

    // 1. Cálculos para Tarjetas de Métricas
    const acceptedOffers = rawData.filter(r => r.is_completed === true);
    const acceptedCount = acceptedOffers.length;
    const totalAcceptedVolume = acceptedOffers.reduce((sum, r) => sum + Number(r.price || 0), 0);

    // Identificar compradores y acumular estadísticas por usuario
    const buyerStatsMap = {};
    acceptedOffers.forEach(r => {
      if (r.user_id) {
        if (!buyerStatsMap[r.user_id]) {
          const p = profileMap[r.user_id] || {};
          buyerStatsMap[r.user_id] = {
            user_id: r.user_id,
            name: p.fullName || p.full_name || p.name || `Usuario ${r.user_id.slice(0, 8)}`,
            email: p.email || '',
            phone: p.whatsapp || p.phone || '',
            count: 0,
            totalVolume: 0,
            offers: []
          };
        }
        buyerStatsMap[r.user_id].count += 1;
        buyerStatsMap[r.user_id].totalVolume += Number(r.price || 0);
        buyerStatsMap[r.user_id].offers.push(r);
      }
    });

    let topBuyerName = 'Ninguno';
    let topBuyerCount = 0;
    let topBuyerVolume = 0;
    Object.values(buyerStatsMap).forEach(buyer => {
      if (buyer.count > topBuyerCount) {
        topBuyerCount = buyer.count;
        topBuyerVolume = buyer.totalVolume;
        topBuyerName = buyer.name;
      }
    });

    // 2. Cálculo en tiempo real de Piggys por completar ciclo en <= 15 días
    const now = new Date();
    const activeEngordePiggies = piggies.filter(p => p.status === 'engorde' && p.end_date);
    
    const maturingPiggies = activeEngordePiggies.map(p => {
      const endDate = new Date(p.end_date);
      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const user = profileMap[p.user_id] || {};
      return {
        ...p,
        diffDays,
        userName: user.fullName || user.full_name || user.name || p.full_name || 'Inversionista',
        userEmail: user.email || '',
        userPhone: user.whatsapp || user.phone || ''
      };
    }).sort((a, b) => a.diffDays - b.diffDays);

    const maturingWithin15Days = maturingPiggies.filter(p => p.diffDays >= 0 && p.diffDays <= 15);

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar ofertas por usuario o tipo de piggy...',
      actionButton: {
        text: 'Nueva Oferta Post-Ciclo',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Usuario',
          render: (row) => {
            if (!row.user_id) {
              return '<span class="badge badge-neutral" style="font-weight: 700;">Global (Todos)</span>';
            }
            const p = profileMap[row.user_id] || {};
            const name = p.fullName || p.full_name || p.name || 'Inversionista';
            const email = p.email || row.user_id;
            return `
              <div>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">
                  ${name}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace; margin-top: 1px;">
                  ${email}
                </div>
                <div style="margin-top: 5px;">
                  <button class="btn btn-secondary btn-sm" data-action="view-user-detail" data-uid="${row.user_id}" style="padding: 2px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px; border-radius: var(--radius-sm);" title="Ver Detalle del Usuario">
                    ${icons.eye || icons.user} <span>Ver Detalle</span>
                  </button>
                </div>
              </div>
            `;
          }
        },
        {
          header: 'Oferta',
          render: (row) => {
            const piggyBadge = getPiggyCategoryBadge(row.piggy_type, row.piggy_label);

            const priceHtml = `
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem; margin-top: 1px;">
                $${Number(row.price || 0).toLocaleString('es-CO')}
              </div>
            `;

            return `
              <div>
                ${piggyBadge}
                ${priceHtml}
              </div>
            `;
          }
        },
        {
          header: 'Creación',
          render: (row) => `
            <span style="font-size: 0.78rem; color: var(--text-muted); font-family: monospace;">
              ${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '-'}
            </span>
          `
        },
        {
          header: 'Estado',
          render: (row) => {
            if (row.is_completed === true) {
              const pDate = row.purchased_at ? new Date(row.purchased_at).toLocaleDateString('es-CO') : '';
              return `
                <div>
                  <span class="badge badge-success">Aceptada</span>
                  ${pDate ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; font-family: monospace;">${pDate}</div>` : ''}
                </div>
              `;
            }

            const isExpired = row.expires_at ? new Date(row.expires_at) <= new Date() : false;
            if (isExpired) {
              return '<span class="badge badge-danger">Cancelada</span>';
            }
            return '<span class="badge badge-warning">Pendiente</span>';
          }
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit" title="Editar Oferta Post-Ciclo">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete" style="color: var(--accent-red);" title="Eliminar Oferta Post-Ciclo">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: rawData,
      onRowAction: (action, row) => this.handleAction(action, row)
    });

    return `
      <div class="cycle-missions-tab-container">
        <!-- Bloques de Métricas de Ciclos Completados -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          
          <!-- Bloque 1 (Izquierda): Volumen Total Adquirido (Verde con Botón Popup) -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
              <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-green); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
                  🏆 Volumen Total Adquirido
                </div>
                <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-green);">
                  $${totalAcceptedVolume.toLocaleString('es-CO')}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                  ${acceptedCount} ofertas recompradas
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-view-cycle-buyers" style="padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 5px; margin-top: 2px; border-color: rgba(16, 185, 129, 0.4); color: var(--accent-green);" title="Ver compradores y ofertas adquiridas">
                ${icons.eye || icons.award} <span>Ver Compradores</span>
              </button>
            </div>
          </div>

          <!-- Bloque 2 (Centro): Top Inversionista en Ofertas Post-Ciclo -->
          <div style="background: rgba(255, 75, 139, 0.08); border: 1px solid rgba(255, 75, 139, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--primary-pink); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              🔥 Top Inversionista Post-Ciclo
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${topBuyerName}">
              ${topBuyerName}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              ${topBuyerCount > 0 ? `${topBuyerCount} ofertas ($${topBuyerVolume.toLocaleString('es-CO')})` : 'Sin compras registradas'}
            </div>
          </div>

          <!-- Bloque 3 (Derecha): Usuarios por Completar Ciclo (<= 15 Días) -->
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
              <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-blue); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
                  ⏳ Usuarios por Completar Ciclo
                </div>
                <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-blue);">
                  ${maturingWithin15Days.length} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">en ≤ 15 días</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                  ${maturingPiggies.length} cerditos en engorde
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-view-maturing-piggies" style="padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 5px; margin-top: 2px; border-color: rgba(59, 130, 246, 0.4); color: var(--accent-blue);" title="Ver cerditos próximos a finalizar ciclo">
                ${icons.clock || icons.calendar || icons.eye} <span>Ver Próximos</span>
              </button>
            </div>
          </div>

        </div>

        ${this.dataTable.render()}
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container);
    }

    const btnBuyers = container.querySelector('#btn-view-cycle-buyers');
    if (btnBuyers) {
      btnBuyers.addEventListener('click', () => {
        this.openBuyersModal();
      });
    }

    const btnMaturing = container.querySelector('#btn-view-maturing-piggies');
    if (btnMaturing) {
      btnMaturing.addEventListener('click', () => {
        this.openMaturingPiggiesModal();
      });
    }
  }

  openBuyersModal() {
    const rawData = this.parentView.dataStore.cycle_completion_missions || [];
    const profiles = this.parentView.profilesList || [];
    const profileMap = {};
    profiles.forEach(p => profileMap[p.id] = p);

    const acceptedOffers = rawData.filter(r => r.is_completed === true);
    const buyerStatsMap = {};

    acceptedOffers.forEach(r => {
      if (r.user_id) {
        if (!buyerStatsMap[r.user_id]) {
          const p = profileMap[r.user_id] || {};
          buyerStatsMap[r.user_id] = {
            user_id: r.user_id,
            name: p.fullName || p.full_name || p.name || 'Inversionista',
            email: p.email || '',
            phone: p.whatsapp || p.phone || '',
            count: 0,
            totalVolume: 0,
            userObj: p
          };
        }
        buyerStatsMap[r.user_id].count += 1;
        buyerStatsMap[r.user_id].totalVolume += Number(r.price || 0);
      }
    });

    const buyersList = Object.values(buyerStatsMap).sort((a, b) => b.totalVolume - a.totalVolume);
    const totalVolume = buyersList.reduce((sum, b) => sum + b.totalVolume, 0);

    const listHtml = buyersList.length > 0 ? buyersList.map((buyer, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; margin-bottom: 0.6rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); color: var(--accent-green); font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${idx + 1}
          </div>
          <div style="min-width: 0;">
            <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${buyer.name}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
              ${buyer.email} ${buyer.phone ? `• ${buyer.phone}` : ''}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1.25rem; margin-left: 1rem;">
          <div style="text-align: right;">
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Ofertas Adquiridas</div>
            <div style="font-weight: 800; color: var(--primary-pink); font-size: 0.95rem;">
              ${buyer.count} ${buyer.count === 1 ? 'oferta' : 'ofertas'}
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Monto Recomprado</div>
            <div style="font-weight: 800; color: var(--accent-green); font-size: 1.05rem;">
              $${buyer.totalVolume.toLocaleString('es-CO')}
            </div>
          </div>

          <button class="btn btn-secondary btn-sm view-cycle-user-btn" data-user-id="${buyer.user_id}" style="padding: 4px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;" title="Ver Detalle del Usuario">
            ${icons.eye || icons.user} <span>Ver Detalle</span>
          </button>
        </div>
      </div>
    `).join('') : '<div class="p-4 text-center text-muted">No se han registrado compras de ofertas de ciclos aún.</div>';

    modal.open({
      title: 'Compradores de Ofertas Post-Ciclo',
      contentHtml: `
        <div>
          <!-- Resumen -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding: 0.85rem 1.1rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total Recomprado</div>
              <div style="font-weight: 800; font-size: 1.3rem; color: var(--accent-green);">
                $${totalVolume.toLocaleString('es-CO')}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Inversionistas Compradores</div>
              <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary);">
                ${buyersList.length} usuarios
              </div>
            </div>
          </div>

          <div style="max-height: 55vh; overflow-y: auto; padding-right: 0.25rem;">
            ${listHtml}
          </div>
        </div>
      `,
      footerButtons: [
        { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
      ]
    });

    setTimeout(() => {
      const modalEl = document.querySelector('.modal-container');
      if (modalEl) {
        modalEl.querySelectorAll('.view-cycle-user-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const uid = btn.getAttribute('data-user-id');
            const user = profileMap[uid] || {};
            modal.close();
            this.openUserProfileModal(user);
          });
        });
      }
    }, 100);
  }

  openMaturingPiggiesModal() {
    const profiles = this.parentView.profilesList || [];
    const piggies = this.parentView.piggiesList || [];
    const profileMap = {};
    profiles.forEach(p => profileMap[p.id] = p);

    const now = new Date();
    const activeEngordePiggies = piggies.filter(p => p.status === 'engorde' && p.end_date);

    const maturingPiggies = activeEngordePiggies.map(p => {
      const endDate = new Date(p.end_date);
      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const user = profileMap[p.user_id] || {};
      return {
        ...p,
        diffDays,
        userName: user.fullName || user.full_name || user.name || p.full_name || 'Inversionista',
        userEmail: user.email || '',
        userPhone: user.whatsapp || user.phone || ''
      };
    }).sort((a, b) => a.diffDays - b.diffDays);

    const listHtml = maturingPiggies.length > 0 ? maturingPiggies.map((p, idx) => {
      const isUrgent = p.diffDays <= 15;
      const badgeStyle = isUrgent 
        ? 'background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: var(--accent-gold); font-weight: 800;'
        : 'background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: var(--accent-blue); font-weight: 700;';

      const amountVal = Number(p.investment_amount || p.amount || 0);

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; margin-bottom: 0.6rem; background: var(--bg-sidebar); border: 1px solid ${isUrgent ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}; border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${idx + 1}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${p.userName}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
                ${p.name || 'Piggy'} (${p.category || 'engorde'}) • ${p.userEmail}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1.25rem; margin-left: 1rem;">
            ${amountVal > 0 ? `
              <div style="text-align: right;">
                <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Inversión</div>
                <div style="font-weight: 700; color: var(--primary-pink); font-size: 0.85rem;">
                  $${amountVal.toLocaleString('es-CO')}
                </div>
              </div>
            ` : ''}

            <div style="text-align: right;">
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Finaliza Ciclo</div>
              <div style="font-size: 0.82rem; font-family: monospace; color: var(--text-primary); font-weight: 700;">
                ${new Date(p.end_date).toLocaleDateString('es-CO')}
              </div>
            </div>

            <div>
              <span class="badge" style="${badgeStyle} font-size: 0.75rem; padding: 3px 8px;">
                ${p.diffDays <= 0 ? '¡Hoy completa!' : `en ${p.diffDays} días`}
              </span>
            </div>

            <button class="btn btn-secondary btn-sm direct-cycle-offer-btn" data-user-id="${p.user_id}" style="padding: 4px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;" title="Disparar Oferta de Granja Exclusiva">
              ${icons.award || icons.plus} <span>Lanzar Oferta</span>
            </button>
          </div>
        </div>
      `;
    }).join('') : '<div class="p-4 text-center text-muted">No hay cerditos en engorde activo en este momento.</div>';

    modal.open({
      title: 'Próximos Cerditos a Completar Ciclo',
      contentHtml: `
        <div>
          <!-- Resumen -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding: 0.85rem 1.1rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Cerditos en Engorde Activo</div>
              <div style="font-weight: 800; font-size: 1.3rem; color: var(--accent-blue);">
                ${maturingPiggies.length} piggies
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Urgentes (≤ 15 Días)</div>
              <div style="font-weight: 800; font-size: 1.1rem; color: var(--accent-gold);">
                ${maturingPiggies.filter(p => p.diffDays <= 15).length} por madurar
              </div>
            </div>
          </div>

          <div style="max-height: 55vh; overflow-y: auto; padding-right: 0.25rem;">
            ${listHtml}
          </div>
        </div>
      `,
      footerButtons: [
        { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
      ]
    });

    setTimeout(() => {
      const modalEl = document.querySelector('.modal-container');
      if (modalEl) {
        modalEl.querySelectorAll('.direct-cycle-offer-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const uid = btn.getAttribute('data-user-id');
            modal.close();
            this.openModal({ user_id: uid });
          });
        });
      }
    }, 100);
  }

  handleAction(action, row) {
    if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar esta oferta de cerdito exclusivo?`)) {
        marketingService.deleteCycleMission(row.id).then(res => {
          if (res.success) {
            toast.success('Oferta eliminada');
            this.parentView.dataStore.cycle_completion_missions = this.parentView.dataStore.cycle_completion_missions.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.cycle_completion_missions);
            this.parentView.updateBadges();
          } else {
            toast.error(res.error || 'Error al eliminar');
          }
        });
      }
    } else if (action === 'view-user-detail') {
      const p = (this.parentView.profilesList || []).find(prof => prof.id === row.user_id) || {};
      this.openUserProfileModal(p);
    }
  }

  openUserProfileModal(user) {
    const fullName = user.fullName || user.full_name || 'Inversionista';
    const email = user.email || 'No registrado';
    const whatsapp = user.whatsapp || user.phone || 'No registrado';
    const cedula = user.cedula || 'No registrada';
    const refCode = user.referralCode || user.referral_code || 'Sin código';
    const bankName = user.bankName || user.bank_name || 'No registrado';
    const bankBreveKey = user.bankBreveKey || user.bank_breve_key || 'No registrada';
    const walletBalance = Number(user.walletBalance || user.wallet_balance || 0);
    const totalCompraPiggies = Number(user.totalCompraPiggies || user.total_compra_piggies || 0);
    const activePiggiesCount = user.activePiggiesCount !== undefined ? user.activePiggiesCount : 0;
    const totalPiggiesCount = user.totalPiggiesCount !== undefined ? user.totalPiggiesCount : 0;

    modal.open({
      title: `Detalle del Usuario: ${fullName}`,
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- 1. Información de Identificación & Contacto -->
          <div style="background: var(--bg-dark); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
              Información de Identificación & Contacto
            </div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.85rem;">
              ${fullName}
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
              <div>
                <span style="color: var(--text-muted);">Email:</span>
                <div style="font-weight: 700; color: var(--accent-blue); font-family: monospace;">${email}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">WhatsApp:</span>
                <div style="font-weight: 700; color: var(--accent-green);">${whatsapp}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Cédula:</span>
                <div style="font-weight: 700; color: var(--text-primary);">${cedula}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Código Referido:</span>
                <div style="font-weight: 700; color: var(--accent-gold); font-family: monospace;">${refCode}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Banco:</span>
                <div style="font-weight: 700; color: var(--primary-pink);">${bankName}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Llave Bre-B:</span>
                <div style="font-weight: 700; color: var(--accent-gold); font-family: monospace;">${bankBreveKey}</div>
              </div>
            </div>
          </div>

          <!-- 2. Recuadros de Métricas Financieras (Igual que en Módulo Usuarios) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            
            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--accent-green);">${icons.wallet || '💳'}</span> Saldo Disponible en Billetera
              </div>
              <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-green); margin-top: 0.3rem;">
                $${walletBalance.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                Listo para compra inmediata de ofertas
              </div>
            </div>

            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--primary-pink);">${icons.pig || '🐷'}</span> Valor de Compra Piggys
              </div>
              <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary-pink); margin-top: 0.3rem;">
                $${totalCompraPiggies.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                ${activePiggiesCount} en engorde (${totalPiggiesCount} total)
              </div>
            </div>

          </div>
        </div>
      `,
      footerButtons: [
        {
          text: 'Ir a Módulo de Usuarios',
          class: 'btn-secondary',
          onClick: (e, m) => {
            m.close();
            window.location.hash = '#users';
          }
        },
        { text: 'Cerrar', class: 'btn-primary', onClick: (e, m) => m.close() }
      ]
    });
  }

  openModal(item = null) {
    const isEdit = Boolean(item && item.id);
    const profiles = this.parentView.profilesList || [];
    const exclusiveConfigs = this.parentView.dataStore.exclusive_piggy_config || [];

    const userOptions = profiles.map(p => {
      const name = p.fullName || p.full_name || p.email;
      const isSelected = item?.user_id === p.id ? 'selected' : '';
      return `<option value="${p.id}" ${isSelected}>${name} (${p.email || p.id.slice(0,8)})</option>`;
    }).join('');

    const expiresVal = item?.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '';
    const initialType = item?.piggy_type || 'plus';
    const initialCatInfo = getPiggyCategoryInfo(initialType);
    const exclusiveOverride = exclusiveConfigs.find(c => c.piggy_type === initialType);
    const defaultInitialPrice = exclusiveOverride ? Number(exclusiveOverride.price) : initialCatInfo.defaultPrice;

    modal.open({
      title: isEdit ? 'Editar Oferta de Granja Exclusiva' : 'Nueva Oferta de Granja Exclusiva',
      contentHtml: `
        <form id="cycle-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cycle-user">Usuario Destinatario</label>
              <select id="cycle-user" class="form-select">
                <option value="">-- Global (Todos los usuarios) --</option>
                ${userOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="cycle-type">Tipo de Piggy</label>
              <select id="cycle-type" class="form-select">
                ${renderCategorySelectOptions(initialType, exclusiveConfigs)}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cycle-price">Precio de la Oferta</label>
              <div class="currency-input-wrapper">
                <span class="currency-input-prefix">$</span>
                <input type="text" id="cycle-price" class="form-input" value="${formatCurrency(item?.price !== undefined ? item.price : defaultInitialPrice)}" placeholder="1.200.000" required />
              </div>
            </div>

            <div class="form-group datetime-enhanced-group">
              <label class="form-label" for="cycle-expires">Fecha de Expiración</label>
              <input type="datetime-local" id="cycle-expires" class="form-input" value="${expiresVal}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="cycle-completed">Estado de Compra</label>
            <select id="cycle-completed" class="form-select">
              <option value="false" ${item?.is_completed !== true ? 'selected' : ''}>Disponible / Pendiente</option>
              <option value="true" ${item?.is_completed === true ? 'selected' : ''}>Aceptada (Comprada)</option>
            </select>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const typeSelect = modalBody.querySelector('#cycle-type');
        const priceInput = modalBody.querySelector('#cycle-price');
        const expiresInput = modalBody.querySelector('#cycle-expires');

        // Formato de moneda con puntos de miles
        const priceCtrl = setupCurrencyInput(priceInput);

        // Selector de fecha y hora con botones de expiración rápida (+6h, +12h, +24h, etc.)
        setupDateTimePicker(expiresInput);

        if (typeSelect) {
          typeSelect.addEventListener('change', (e) => {
            const selectedKey = e.target.value;
            const selectedOpt = typeSelect.options[typeSelect.selectedIndex];
            const catInfo = getPiggyCategoryInfo(selectedKey);
            const suggestedPrice = selectedOpt.getAttribute('data-price') || catInfo.defaultPrice;
            if (priceCtrl && (!isEdit || priceCtrl.getRawValue() === 0)) {
              priceCtrl.setRawValue(suggestedPrice);
            }
          });
        }
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Disparar Oferta',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const user_id = root.querySelector('#cycle-user')?.value || null;
            const piggy_type = root.querySelector('#cycle-type')?.value;
            const price = parseCurrency(root.querySelector('#cycle-price')?.value);
            const expires_at = root.querySelector('#cycle-expires')?.value;
            const is_completed = root.querySelector('#cycle-completed')?.value === 'true';

            const catInfo = getPiggyCategoryInfo(piggy_type);
            const exConfig = exclusiveConfigs.find(c => c.piggy_type === piggy_type);
            const piggy_label = exConfig?.piggy_label || catInfo.label;
            const extra_roi_bonus = exConfig?.extra_roi_bonus !== undefined ? Number(exConfig.extra_roi_bonus) : catInfo.extraRoiBonus;

            const payload = {
              user_id,
              piggy_type,
              piggy_label,
              extra_roi_bonus,
              price: Number(price || 0),
              expires_at: expires_at ? new Date(expires_at).toISOString() : null,
              is_completed,
              purchased_at: is_completed ? (item?.purchased_at || new Date().toISOString()) : null
            };

            let res;
            if (isEdit) {
              res = await marketingService.updateCycleMission(item.id, payload);
            } else {
              res = await marketingService.createCycleMission(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Oferta actualizada' : 'Oferta de cerdito creada');
              this.parentView.dataStore.cycle_completion_missions = await marketingService.getCycleMissions();
              this.dataTable.setData(this.parentView.dataStore.cycle_completion_missions);
              this.parentView.updateBadges();
              m.close();
            } else {
              toast.error(res.error || 'Error al guardar');
            }
          }
        }
      ]
    });
  }
}
