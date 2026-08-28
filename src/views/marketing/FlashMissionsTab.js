/* ==========================================================================
   MARKETING - MISIONES: SUB-TAB 2: MISIONES FLASH MANUALES (user_flash_missions)
   Columnas: Nombre Usuario, Misión Flash, Oferta (Tipo + Precio + Estado Compra), Estado (Activa + Caducidad + Creación), Acciones
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';
import { getPiggyCategoryBadge, getPiggyCategoryInfo, renderCategorySelectOptions } from '../../utils/piggyCategories.js';
import { formatCurrency, parseCurrency, setupCurrencyInput, setupDateTimePicker } from '../../utils/formUtils.js';

export class FlashMissionsTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    const rawData = data || [];
    const profiles = this.parentView.profilesList || [];

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.id] = p;
    });

    // 1. Cálculos de Inteligencia de Negocio para las tarjetas de métricas
    const now = new Date();
    const totalFlash = rawData.length;
    const acceptedMissions = rawData.filter(f => f.is_purchased === true);
    const acceptedCount = acceptedMissions.length;
    const expiredMissions = rawData.filter(f => f.is_purchased !== true && f.scheduled_at && new Date(f.scheduled_at) < now);
    const pendingMissions = rawData.filter(f => f.is_purchased !== true && (!f.scheduled_at || new Date(f.scheduled_at) >= now));
    const conversionRate = totalFlash > 0 ? Math.round((acceptedCount / totalFlash) * 100) : 0;
    const totalAcceptedVolume = acceptedMissions.reduce((sum, f) => sum + Number(f.price || 0), 0);

    // Identificar top comprador de ofertas flash
    const buyerMap = {};
    const buyerVolumeMap = {};
    acceptedMissions.forEach(f => {
      if (f.user_id) {
        buyerMap[f.user_id] = (buyerMap[f.user_id] || 0) + 1;
        buyerVolumeMap[f.user_id] = (buyerVolumeMap[f.user_id] || 0) + Number(f.price || 0);
      }
    });

    let topBuyerName = 'Ninguno';
    let topBuyerCount = 0;
    let topBuyerVolume = 0;
    Object.entries(buyerMap).forEach(([uid, count]) => {
      if (count > topBuyerCount) {
        topBuyerCount = count;
        topBuyerVolume = buyerVolumeMap[uid] || 0;
        const p = profileMap[uid] || {};
        topBuyerName = p.fullName || p.full_name || p.name || `Usuario ${uid.slice(0, 8)}`;
      }
    });

    // Total de saldo disponible en billeteras de usuarios listos para comprar
    const totalAvailableWallet = profiles.reduce((sum, p) => sum + Number(p.walletBalance || p.wallet_balance || 0), 0);
    const usersWithBalanceCount = profiles.filter(p => Number(p.walletBalance || p.wallet_balance || 0) > 0).length;

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar misiones flash, usuario o tipo de piggy...',
      filters: [
        { label: 'Pendientes / Activas', value: 'pending' },
        { label: 'Aceptadas (Compradas)', value: 'purchased' },
        { label: 'Vencidas / Expiradas', value: 'expired' },
        { label: 'Inactivas', value: 'inactive' }
      ],
      actionButton: {
        text: 'Nueva Misión Flash',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Nombre Usuario',
          render: (row) => {
            if (!row.user_id) {
              return '<span class="badge badge-neutral" style="font-weight: 700;">Global (Todos)</span>';
            }
            const p = profileMap[row.user_id] || {};
            const name = p.fullName || p.full_name || p.name || 'Usuario';
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
          header: 'Misión Flash',
          render: (row) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">
                ${row.title || row.mission_title || 'Misión Flash'}
              </div>
              ${row.benefit_title ? `
                <div style="font-size: 0.75rem; color: var(--accent-gold); font-weight: 700; margin-top: 2px;">
                  ✨ ${row.benefit_title}
                </div>
              ` : ''}
              <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 260px; margin-top: 2px;">
                ${row.benefit_description || row.description || 'Sin descripción'}
              </div>
            </div>
          `
        },
        {
          header: 'Oferta',
          render: (row) => {
            const piggyBadge = getPiggyCategoryBadge(row.piggy_type, row.badge || row.piggy_label);

            const labelHtml = row.piggy_label ? `
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                ${row.piggy_label}
              </div>
            ` : '';

            const priceHtml = `
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem; margin-top: 1px;">
                $${Number(row.price || 0).toLocaleString('es-CO')}
              </div>
            `;

            // Lógica de 3 estados para la oferta:
            // 1. Aceptada (Comprada)
            // 2. Vencida (No comprada y fecha expirada)
            // 3. Pendiente (No comprada y vigente o sin fecha)
            const isPurchased = row.is_purchased === true;
            const isExpired = !isPurchased && row.scheduled_at && new Date(row.scheduled_at) < new Date();

            let offerBadge;
            if (isPurchased) {
              offerBadge = `
                <div style="margin-top: 3px; display: flex; align-items: center; gap: 5px;">
                  <span class="badge badge-success" style="padding: 1px 7px; font-size: 0.7rem; font-weight: 800;">Aceptada</span>
                  ${row.purchased_at ? `<span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${new Date(row.purchased_at).toLocaleDateString('es-CO')}</span>` : ''}
                </div>
              `;
            } else if (isExpired) {
              offerBadge = `
                <div style="margin-top: 3px;">
                  <span class="badge badge-danger" style="padding: 1px 7px; font-size: 0.7rem; font-weight: 800;">Vencida</span>
                </div>
              `;
            } else {
              offerBadge = `
                <div style="margin-top: 3px;">
                  <span class="badge badge-warning" style="padding: 1px 7px; font-size: 0.7rem; font-weight: 800; background: rgba(245, 158, 11, 0.15); color: var(--accent-gold); border: 1px solid rgba(245, 158, 11, 0.3);">Pendiente</span>
                </div>
              `;
            }

            return `
              <div>
                ${piggyBadge}
                ${labelHtml}
                ${priceHtml}
                ${offerBadge}
              </div>
            `;
          }
        },
        {
          header: 'Estado',
          render: (row) => {
            const activeBadge = `
              <span class="badge ${row.is_active ? 'badge-success' : 'badge-neutral'}">
                ${row.is_active ? 'Activa' : 'Inactiva'}
              </span>
            `;

            const expHtml = row.scheduled_at ? `
              <div style="margin-top: 4px;">
                <span class="badge badge-info" style="font-size: 0.72rem; padding: 2px 7px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 4px;">
                  <span>⏳ Exp: ${new Date(row.scheduled_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </span>
              </div>
            ` : '<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Sin caducidad</div>';

            const createdHtml = `
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; font-family: monospace;">
                Creado: ${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '-'}
              </div>
            `;

            return `
              <div>
                ${activeBadge}
                ${expHtml}
                ${createdHtml}
              </div>
            `;
          }
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit" title="Editar Misión Flash">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="toggle-active" title="${row.is_active ? 'Desactivar' : 'Activar'}">
                ${row.is_active ? icons.x : icons.check}
              </button>
              <button class="btn btn-danger btn-sm" data-action="delete" title="Eliminar Misión Flash">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: rawData
    });

    return `
      <div>
        <!-- 4 Tarjetas de Inteligencia Comercial y Métricas de Conversión -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          
          <!-- Tarjeta 1: Resumen de Ofertas -->
          <div style="background: var(--bg-dark); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-blue);">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Total Ofertas Flash</span>
              <span style="color: var(--accent-blue);">${icons.zap}</span>
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-blue); margin-top: 0.35rem;">
              ${totalFlash}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
              <span style="color: var(--accent-gold); font-weight: 700;">${pendingMissions.length} activas</span> | ${expiredMissions.length} vencidas
            </div>
          </div>

          <!-- Tarjeta 2: Tasa de Aceptación / Conversión -->
          <div style="background: var(--bg-dark); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-green);">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Tasa de Conversión</span>
              <span style="color: var(--accent-green);">${icons.trendingUp || icons.zap}</span>
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-green); margin-top: 0.35rem;">
              ${conversionRate}%
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
              <strong>${acceptedCount}</strong> cerditos comprados de ${totalFlash} ofertas
            </div>
          </div>

          <!-- Tarjeta 3: Volumen Comprado -->
          <div style="background: var(--bg-dark); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-purple);">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Volumen de Ventas Flash</span>
              <span style="color: var(--accent-purple);">${icons.award || icons.pig}</span>
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-purple); margin-top: 0.35rem;">
              $${totalAcceptedVolume.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              Top comprador: <strong>${topBuyerName}</strong> (${topBuyerCount})
            </div>
          </div>

          <!-- Tarjeta 4: Liquidez Disponible en Usuarios -->
          <div style="background: var(--bg-dark); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-gold);">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Liquidez en Billeteras</span>
              <span style="color: var(--accent-gold);">${icons.wallet}</span>
            </div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.35rem;">
              $${totalAvailableWallet.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
              <strong>${usersWithBalanceCount}</strong> inversionistas con saldo para comprar
            </div>
          </div>

        </div>

        <!-- Tabla de Misiones Flash -->
        <div id="flash-missions-datatable">
          ${this.dataTable.render()}
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      const dtContainer = container.querySelector('#flash-missions-datatable');
      if (dtContainer) this.dataTable.attachEvents(dtContainer);
    }

    const tbody = container.querySelector('.data-table tbody');
    if (!tbody) return;

    tbody.querySelectorAll('tr').forEach((row, index) => {
      const item = this.dataTable.filteredData[index];
      if (!item) return;

      const editBtn = row.querySelector('[data-action="edit"]');
      const toggleBtn = row.querySelector('[data-action="toggle-active"]');
      const deleteBtn = row.querySelector('[data-action="delete"]');
      const viewDetailBtn = row.querySelector('[data-action="view-user-detail"]');

      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openModal(item);
        });
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const newStatus = !item.is_active;
          const res = await marketingService.toggleUserFlashMissionStatus(item.id, newStatus);
          if (res.success) {
            toast.success(`Misión flash ${newStatus ? 'activada' : 'desactivada'}`);
            item.is_active = newStatus;
            this.parentView.updateView();
          } else {
            toast.error('Error al actualizar estado: ' + res.error);
          }
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`¿Eliminar la misión flash "${item.title || item.mission_title}"?`)) {
            const res = await marketingService.deleteUserFlashMission(item.id);
            if (res.success) {
              toast.success('Misión flash eliminada');
              this.parentView.dataStore.user_flash_missions = this.parentView.dataStore.user_flash_missions.filter(f => f.id !== item.id);
              this.parentView.updateView();
              this.parentView.updateBadges();
            } else {
              toast.error('Error al eliminar: ' + res.error);
            }
          }
        });
      }

      if (viewDetailBtn) {
        viewDetailBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const uid = viewDetailBtn.getAttribute('data-uid');
          this.openUserDetailModal(uid);
        });
      }
    });
  }

  openUserDetailModal(userId) {
    const profiles = this.parentView.profilesList || [];
    const piggies = this.parentView.piggiesList || [];
    const rawFlash = this.parentView.dataStore.user_flash_missions || [];

    const user = profiles.find(p => p.id === userId);
    if (!user) {
      toast.error('No se encontró información del usuario');
      return;
    }

    const userPiggies = piggies.filter(p => p.user_id === userId);
    const activePiggies = userPiggies.filter(p => p.status === 'engorde' || p.status === 'active');
    const userFlashHistory = rawFlash.filter(f => f.user_id === userId);
    const purchasedFlash = userFlashHistory.filter(f => f.is_purchased === true);

    const piggyCount = userPiggies.length;
    const baseRoiPct = piggyCount >= 3 ? 0.10 : (piggyCount === 2 ? 0.09 : 0.08);

    modal.open({
      title: `Detalle del Inversionista: ${user.fullName || user.full_name || 'Usuario'}`,
      size: 'large',
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Ficha de Datos Principales -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; background: var(--bg-dark); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Nombre Completo</div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem; margin-top: 2px;">${user.fullName || user.full_name || 'N/A'}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Correo Electrónico</div>
              <div style="color: var(--text-primary); font-size: 0.85rem; margin-top: 2px;">${user.email || 'N/A'}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">WhatsApp / Teléfono</div>
              <div style="color: var(--accent-green); font-size: 0.85rem; margin-top: 2px; font-weight: 700;">${user.whatsapp || user.phone || 'No registrado'}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Saldo en Billetera Agro</div>
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 1.1rem; margin-top: 2px;">$${Number(user.walletBalance || user.wallet_balance || 0).toLocaleString('es-CO')}</div>
            </div>
          </div>

          <!-- Métricas del Inversionista -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
            <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.9rem; border-radius: var(--radius-sm);">
              <div style="font-size: 0.72rem; color: var(--accent-blue); font-weight: 700; text-transform: uppercase;">Cerditos Activos</div>
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-top: 0.2rem;">${activePiggies.length} de ${userPiggies.length}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">Margen Base: ${(baseRoiPct * 100).toFixed(0)}%</div>
            </div>

            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.9rem; border-radius: var(--radius-sm);">
              <div style="font-size: 0.72rem; color: var(--accent-green); font-weight: 700; text-transform: uppercase;">Ofertas Flash Aceptadas</div>
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-top: 0.2rem;">${purchasedFlash.length}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">De ${userFlashHistory.length} enviadas</div>
            </div>

            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); padding: 0.9rem; border-radius: var(--radius-sm);">
              <div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 700; text-transform: uppercase;">Total Compras Flash</div>
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.2rem;">$${purchasedFlash.reduce((sum, f) => sum + Number(f.price || 0), 0).toLocaleString('es-CO')}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">Volumen invertido</div>
            </div>
          </div>

          <!-- Historial de Ofertas Flash del Usuario -->
          <div>
            <h4 style="font-size: 0.88rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-primary);">Historial de Ofertas Flash Asignadas</h4>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left;">
                <thead style="background: var(--bg-dark); color: var(--text-muted); position: sticky; top: 0;">
                  <tr>
                    <th style="padding: 6px 10px;">Misión / Tipo</th>
                    <th style="padding: 6px 10px;">Precio</th>
                    <th style="padding: 6px 10px;">Estado Oferta</th>
                    <th style="padding: 6px 10px;">Caducidad</th>
                  </tr>
                </thead>
                <tbody>
                  ${userFlashHistory.length === 0 ? `
                    <tr><td colspan="4" style="padding: 12px; text-align: center; color: var(--text-muted);">No tiene ofertas flash registradas.</td></tr>
                  ` : userFlashHistory.map(f => `
                    <tr style="border-top: 1px solid var(--border-color);">
                      <td style="padding: 6px 10px;">
                        <strong>${f.title || f.mission_title}</strong>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${f.piggy_label || f.piggy_type}</div>
                      </td>
                      <td style="padding: 6px 10px; font-weight: 700; color: var(--accent-gold);">$${Number(f.price || 0).toLocaleString('es-CO')}</td>
                      <td style="padding: 6px 10px;">
                        ${f.is_purchased ? '<span class="badge badge-success" style="font-size: 0.68rem;">Aceptada</span>' : (f.scheduled_at && new Date(f.scheduled_at) < new Date() ? '<span class="badge badge-danger" style="font-size: 0.68rem;">Vencida</span>' : '<span class="badge badge-warning" style="font-size: 0.68rem;">Pendiente</span>')}
                      </td>
                      <td style="padding: 6px 10px; font-size: 0.72rem; color: var(--text-muted);">
                        ${f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('es-CO') : 'Sin caducidad'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Cerditos en Engorde Actuales -->
          <div>
            <h4 style="font-size: 0.88rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-primary);">Cerditos del Inversionista (${userPiggies.length})</h4>
            <div style="max-height: 180px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left;">
                <thead style="background: var(--bg-dark); color: var(--text-muted); position: sticky; top: 0;">
                  <tr>
                    <th style="padding: 6px 10px;">Código / Nombre</th>
                    <th style="padding: 6px 10px;">Inversión</th>
                    <th style="padding: 6px 10px;">Estado</th>
                    <th style="padding: 6px 10px;">Fecha Fin</th>
                  </tr>
                </thead>
                <tbody>
                  ${userPiggies.length === 0 ? `
                    <tr><td colspan="4" style="padding: 12px; text-align: center; color: var(--text-muted);">No tiene cerditos registrados aún.</td></tr>
                  ` : userPiggies.map(p => `
                    <tr style="border-top: 1px solid var(--border-color);">
                      <td style="padding: 6px 10px;">
                        <strong>${p.pig_id || `Cerdito ${p.id.slice(0, 6)}`}</strong>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${p.pig_name || p.type || 'Standard'}</div>
                      </td>
                      <td style="padding: 6px 10px; font-weight: 700; color: var(--accent-green);">$${Number(p.investment_amount || 1000000).toLocaleString('es-CO')}</td>
                      <td style="padding: 6px 10px;">
                        <span class="badge ${p.status === 'engorde' || p.status === 'active' ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.68rem;">
                          ${p.status || 'Activo'}
                        </span>
                      </td>
                      <td style="padding: 6px 10px; font-size: 0.72rem; color: var(--text-muted);">
                        ${p.end_date ? new Date(p.end_date).toLocaleDateString('es-CO') : 'En curso'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `,
      footerButtons: [
        {
          text: 'Crear Oferta para este Usuario',
          class: 'btn-primary',
          onClick: (e, m) => {
            m.close();
            this.openModal(null, userId);
          }
        },
        { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
      ]
    });
  }

  openModal(item = null, preselectedUserId = null) {
    const isEdit = !!item;
    const profiles = this.parentView.profilesList || [];

    const scheduledVal = item?.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : '';
    const initialPiggyType = item?.piggy_type || 'dorado';
    const initialCatInfo = getPiggyCategoryInfo(initialPiggyType);
    const defaultInitialPrice = initialCatInfo.defaultPrice;

    modal.open({
      title: isEdit ? 'Editar Misión Flash' : 'Lanzar Nueva Misión Flash',
      size: 'medium',
      contentHtml: `
        <form id="form-flash-mission" class="form-grid" style="display: flex; flex-direction: column; gap: 1rem;">
          
          <!-- Banner Informativo -->
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid var(--accent-gold); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-primary);">
            <strong style="color: var(--accent-gold);">${icons.zap} Misiones Flash Automatizadas:</strong> Configura ofertas exclusivas de cerditos temporales con retorno preferencial. Puedes activarlas de inmediato o programar su caducidad.
          </div>

          <!-- Selector de Audiencia / Destinatario -->
          ${!isEdit ? `
            <div class="form-group">
              <label class="form-label" for="flash-audience">Audiencia / Destinatarios</label>
              <select id="flash-audience" class="form-select">
                <option value="ALL" ${!preselectedUserId ? 'selected' : ''}>🌟 Todos los Inversionistas (${profiles.length} usuarios)</option>
                <option value="ACTIVE_INVESTORS">Inversionistas con Cerditos Activos</option>
                <option value="NEW_USERS">Nuevos Usuarios Registrados</option>
                <option value="NO_PIGGIES">Usuarios sin Cerditos Activos</option>
                <option value="SINGLE" ${preselectedUserId ? 'selected' : ''}>👤 Inversionista Individual Específico</option>
              </select>
            </div>

            <div class="form-group" id="flash-single-user-cont" style="display: ${preselectedUserId ? 'block' : 'none'};">
              <label class="form-label" for="flash-user-id">Seleccionar Inversionista</label>
              <select id="flash-user-id" class="form-select">
                <option value="" disabled ${!preselectedUserId ? 'selected' : ''}>-- Elige un usuario --</option>
                ${profiles.map(p => `
                  <option value="${p.id}" ${p.id === preselectedUserId ? 'selected' : ''}>
                    ${p.fullName || p.full_name || 'Sin Nombre'} (${p.email || p.whatsapp || p.id.slice(0, 6)})
                  </option>
                `).join('')}
              </select>
            </div>
          ` : `
            <div class="form-group">
              <label class="form-label">Inversionista Asignado</label>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem; padding: 0.5rem; background: var(--bg-dark); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                ${item?.user_id ? ((profiles.find(p => p.id === item.user_id)?.fullName) || (profiles.find(p => p.id === item.user_id)?.full_name) || `Usuario ${item.user_id.slice(0, 8)}`) : 'Global (Todos los usuarios)'}
              </div>
            </div>
          `}

          <!-- Tipo de Cerdito & Beneficio Exclusivo -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-type">Tipo de Cerdito</label>
              <select id="flash-type" class="form-select" required>
                ${renderCategorySelectOptions(initialPiggyType)}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-piggy-label">Nombre Comercial del Cerdito</label>
              <input type="text" id="flash-piggy-label" class="form-input" value="${item?.piggy_label || (isEdit ? '' : initialCatInfo.piggyLabel)}" placeholder="Ej: Cerdito Dorado" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-title">Título de la Misión</label>
              <input type="text" id="flash-title" class="form-input" value="${item?.title || item?.mission_title || (isEdit ? '' : initialCatInfo.title)}" placeholder="Ej: Oportunidad Cerdito Dorado" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-badge">Etiqueta Visual (Badge)</label>
              <input type="text" id="flash-badge" class="form-input" value="${item?.badge || (isEdit ? '' : initialCatInfo.badge)}" placeholder="Ej: 🏆 12% Extra / 🚀 15% ROI" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-benefit-title">Título del Beneficio</label>
              <input type="text" id="flash-benefit-title" class="form-input" value="${item?.benefit_title || (isEdit ? '' : initialCatInfo.benefitTitle)}" placeholder="Ej: 12% Ganancia Neta Asegurada" />
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-benefit-desc">Detalle del Beneficio</label>
              <input type="text" id="flash-benefit-desc" class="form-input" value="${item?.benefit_description || (isEdit ? '' : initialCatInfo.benefitDescription)}" placeholder="Ej: Retorno preferencial en 90 días" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="flash-desc">Descripción General / Instrucciones</label>
            <textarea id="flash-desc" class="form-textarea" placeholder="Explica la oferta temporal al usuario...">${item?.description || (isEdit ? '' : initialCatInfo.description)}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-price">Precio de la Oferta</label>
              <div class="currency-input-wrapper">
                <span class="currency-input-prefix">$</span>
                <input type="text" id="flash-price" class="form-input" value="${formatCurrency(item?.price !== undefined ? item.price : defaultInitialPrice)}" placeholder="1.200.000" required />
              </div>
            </div>

            <div class="form-group datetime-enhanced-group">
              <label class="form-label" for="flash-scheduled">Programación / Caducidad</label>
              <div class="datetime-input-wrapper">
                <input type="datetime-local" id="flash-scheduled" class="form-input" value="${scheduledVal}" style="color-scheme: dark;" />
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                Fecha límite para activar y/o comprar la oferta
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-purchased">Estado de la Oferta</label>
              <select id="flash-purchased" class="form-select">
                <option value="false" ${item?.is_purchased !== true ? 'selected' : ''}>Pendiente (No comprada)</option>
                <option value="true" ${item?.is_purchased === true ? 'selected' : ''}>Aceptada (Comprada)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-active">Estado</label>
              <select id="flash-active" class="form-select">
                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Activa</option>
                <option value="false" ${item?.is_active === false ? 'selected' : ''}>Inactiva</option>
              </select>
            </div>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const typeSelect = modalBody.querySelector('#flash-type');
        const priceInput = modalBody.querySelector('#flash-price');
        const titleInput = modalBody.querySelector('#flash-title');
        const piggyLabelInput = modalBody.querySelector('#flash-piggy-label');
        const badgeInput = modalBody.querySelector('#flash-badge');
        const benefitTitleInput = modalBody.querySelector('#flash-benefit-title');
        const benefitDescInput = modalBody.querySelector('#flash-benefit-desc');
        const descInput = modalBody.querySelector('#flash-desc');
        const scheduledInput = modalBody.querySelector('#flash-scheduled');

        // Formato monetario con separador de miles dinámico
        const priceCtrl = setupCurrencyInput(priceInput);

        // Selector mini-calendario con botón azul
        setupDateTimePicker(scheduledInput);

        const audienceSelect = modalBody.querySelector('#flash-audience');
        const singleCont = modalBody.querySelector('#flash-single-user-cont');
        if (audienceSelect && singleCont) {
          audienceSelect.addEventListener('change', () => {
            singleCont.style.display = audienceSelect.value === 'SINGLE' ? 'block' : 'none';
          });
        }

        if (typeSelect) {
          typeSelect.addEventListener('change', (e) => {
            const selectedKey = e.target.value;
            const selectedOpt = typeSelect.options[typeSelect.selectedIndex];
            const catInfo = getPiggyCategoryInfo(selectedKey);

            const suggestedPrice = selectedOpt.getAttribute('data-price') || catInfo.defaultPrice;
            if (priceCtrl && (!isEdit || priceCtrl.getRawValue() === 0)) {
              priceCtrl.setRawValue(suggestedPrice);
            }

            const optPiggyLabel = selectedOpt.getAttribute('data-piggy-label') || catInfo.piggyLabel;
            const optBadge = selectedOpt.getAttribute('data-badge') || catInfo.badge;
            const optBenefitTitle = selectedOpt.getAttribute('data-benefit-title') || catInfo.benefitTitle;
            const optBenefitDesc = selectedOpt.getAttribute('data-benefit-desc') || catInfo.benefitDescription;
            const optTitle = selectedOpt.getAttribute('data-title') || catInfo.title;

            if (titleInput) titleInput.value = optTitle;
            if (piggyLabelInput) piggyLabelInput.value = optPiggyLabel;
            if (badgeInput) badgeInput.value = optBadge;
            if (benefitTitleInput) benefitTitleInput.value = optBenefitTitle;
            if (benefitDescInput) benefitDescInput.value = optBenefitDesc;
            if (descInput) descInput.value = catInfo.description;
          });
        }
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Lanzar Misión Flash',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const title = root.querySelector('#flash-title')?.value?.trim();
            const piggy_label = root.querySelector('#flash-piggy-label')?.value?.trim();
            const badge = root.querySelector('#flash-badge')?.value?.trim();
            const benefit_title = root.querySelector('#flash-benefit-title')?.value?.trim();
            const benefit_description = root.querySelector('#flash-benefit-desc')?.value?.trim();
            const description = root.querySelector('#flash-desc')?.value?.trim();
            const piggy_type = root.querySelector('#flash-type')?.value;
            const price = parseCurrency(root.querySelector('#flash-price')?.value);
            const scheduled_at = root.querySelector('#flash-scheduled')?.value;
            const is_purchased = root.querySelector('#flash-purchased')?.value === 'true';
            const is_active = root.querySelector('#flash-active')?.value === 'true';

            if (!title) {
              toast.error('Ingresa el título de la misión flash');
              return;
            }

            const catInfo = getPiggyCategoryInfo(piggy_type);

            const basePayload = {
              title,
              description,
              piggy_type,
              piggy_label: piggy_label || catInfo.piggyLabel,
              benefit_title: benefit_title || catInfo.benefitTitle,
              benefit_description: benefit_description || catInfo.benefitDescription,
              badge: badge || catInfo.badge,
              price: Number(price || 0),
              scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
              is_purchased,
              purchased_at: is_purchased ? (item?.purchased_at || new Date().toISOString()) : null,
              is_active,
              mission_title: 'MISIÓN FLASH',
              icon: catInfo.icon || '⚡'
            };

            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Procesando...';

            if (isEdit) {
              const res = await marketingService.updateUserFlashMission(item.id, basePayload);
              if (res.success) {
                toast.success('Misión flash actualizada con éxito');
                m.close();
                this.parentView.updateView();
              } else {
                toast.error('Error al actualizar: ' + res.error);
                btn.disabled = false;
                btn.textContent = 'Guardar Cambios';
              }
            } else {
              const audience = root.querySelector('#flash-audience')?.value;
              const singleUserId = root.querySelector('#flash-user-id')?.value;

              let targetUserIds = [];
              if (audience === 'SINGLE') {
                if (!singleUserId) {
                  toast.error('Selecciona un inversionista específico');
                  btn.disabled = false;
                  btn.textContent = 'Lanzar Misión Flash';
                  return;
                }
                targetUserIds = [singleUserId];
              } else if (audience === 'ACTIVE_INVESTORS') {
                targetUserIds = profiles.filter(p => (p.activePiggiesCount || 0) > 0).map(p => p.id);
              } else if (audience === 'NO_PIGGIES') {
                targetUserIds = profiles.filter(p => (p.activePiggiesCount || 0) === 0).map(p => p.id);
              } else if (audience === 'NEW_USERS') {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
                targetUserIds = profiles.filter(p => p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo).map(p => p.id);
              } else {
                targetUserIds = profiles.map(p => p.id);
              }

              if (targetUserIds.length === 0) {
                targetUserIds = [null]; // Misión flash global
              }

              let createdCount = 0;
              for (const uid of targetUserIds) {
                const payload = { ...basePayload, user_id: uid };
                const res = await marketingService.createUserFlashMission(payload);
                if (res.success) createdCount++;
              }

              toast.success(`¡Misión Flash asignada con éxito a ${createdCount} usuario(s)!`);
              m.close();
              const refreshed = await marketingService.getUserFlashMissions();
              this.parentView.dataStore.user_flash_missions = refreshed;
              this.parentView.updateView();
              this.parentView.updateBadges();
            }
          }
        }
      ]
    });
  }
}
